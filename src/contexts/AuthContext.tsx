/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import toast from 'react-hot-toast';

type UserRole = 'client' | 'admin' | 'staff' | null;

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  phoneNumber?: string | null;
  createdAt?: any;
  specialization?: string | null; // For staff members
  authCreated?: boolean; // Nuevo campo para marcar si ya tiene cuenta de auth
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  userRole: UserRole;
  loading: boolean;
  register: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserData>) => Promise<void>;
  registerPreRegisteredUser: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  async function fetchUserData(user: User) {
    try {
      // Primero intentamos buscar por UID
      let userDocRef = doc(db, 'users', user.uid);
      let userSnap = await getDoc(userDocRef);
      
      if (!userSnap.exists()) {
        // Si no existe por UID, buscamos por email
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', user.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Encontramos el usuario por email
          userSnap = querySnapshot.docs[0];
          userDocRef = doc(db, 'users', userSnap.id);
          
          // Actualizamos el documento con el UID de auth
          await setDoc(userDocRef, { 
            uid: user.uid,
            authCreated: true 
          }, { merge: true });
        }
      }
      
      if (userSnap.exists()) {
        const userData = userSnap.data() as Omit<UserData, 'uid'>;
        setUserData({ uid: user.uid, ...userData });
        setUserRole(userData.role);
      } else {
        console.log("No user data found!");
        setUserData(null);
        setUserRole(null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await fetchUserData(user);
      } else {
        setUserData(null);
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);


  async function register(email: string, password: string, name: string) {
    try {
      // Verificar si el usuario existe en Firestore (para staff/admins)
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Usuario existe en Firestore (staff/admin)
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        if (userData.authCreated) {
          throw new Error('Este usuario ya tiene una cuenta creada. Por favor inicia sesión.');
        }
        
        // Crear cuenta de autenticación
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Actualizar perfil con el nombre
        await updateProfile(user, {
          displayName: userData.displayName || name
        });
        
        // Actualizar documento en Firestore
        await setDoc(userDoc.ref, { 
          uid: user.uid,
          authCreated: true,
          role: userData.role // Mantener el rol asignado por el admin
        }, { merge: true });
        
        toast.success('Cuenta de staff creada exitosamente!');
      } else {
        // Usuario no existe en Firestore - registro normal (cliente)
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update profile
        await updateProfile(user, {
          displayName: name
        });
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          displayName: name,
          email: email,
          role: 'client', // Default role
          authCreated: true,
          createdAt: serverTimestamp()
        });
        
        toast.success('Cuenta de cliente creada exitosamente!');
      }
    } catch (error: any) {
      throw error;
    }
  }

async function registerPreRegisteredUser(email: string, password: string): Promise<void> {
  try {
    // 1. Buscar usuario en Firestore
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('No existe un usuario pre-registrado con este email');
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Verificar si ya tiene auth creada
    if (userData.authCreated) {
      throw new Error('Este usuario ya completó su registro');
    }

    // 2. Crear cuenta en Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    // 3. Actualizar todos los documentos relacionados usando una transacción batch
    const batch = writeBatch(db);

    // a. Crear nuevo documento de usuario con el UID de auth como ID
    batch.set(doc(db, 'users', newUser.uid), {
      ...userData,
      uid: newUser.uid,
      authCreated: true,
      updatedAt: serverTimestamp()
    });

    // b. Actualizar referencias en otras colecciones (ej. appointments)
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('staffFirestoreId', '==', userDoc.id)
    );
    const appointmentsSnapshot = await getDocs(appointmentsQuery);
    
    appointmentsSnapshot.forEach((apptDoc) => {
      batch.update(apptDoc.ref, {
        staffId: newUser.uid,
        staffFirestoreId: newUser.uid // Actualizamos a la nueva referencia
      });
    });

    // c. Eliminar el documento viejo
    batch.delete(userDoc.ref);

    await batch.commit();
    
    // 4. Actualizar el perfil del usuario en Auth si hay displayName
    if (userData.displayName) {
      await updateProfile(newUser, {
        displayName: userData.displayName
      });
    }

    toast.success('Registro completado exitosamente!');
  } catch (error: any) {
    console.error('Error en registro:', error);
    toast.error(error.message || 'Error al completar el registro');
    throw error;
  }
}

async function login(email: string, password: string) {
  try {
    if (!email || !password) {
      throw new Error('Por favor completa todos los campos');
    }

    try {
      // Intento normal de login
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Inicio de sesión exitoso!');
    } catch (authError: any) {
      // Si el error es "invalid-credential" (nuevo en Firebase v9+)
      if (authError.code === 'auth/invalid-credential') {
        // Verificar si el usuario está pre-registrado en Firestore
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          if (!userData.authCreated) {
            // Lanzar error especial para redirigir
            throw { 
              code: 'PRE_REGISTERED_USER', 
              message: 'Completa tu registro primero' 
            };
          }
        }
      }
      throw authError; // Relanzar otros errores
    }
  } catch (error: any) {
    console.error('Error en login:', error);
    toast.error(error.message);
    throw error;
  }
}

  async function logout() {
    try {
      await signOut(auth);
      toast.success('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  async function updateUserProfile(data: Partial<UserData>) {
    if (!currentUser) throw new Error('No hay usuario autenticado');
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, data, { merge: true });
      
      // Update local state
      if (userData) {
        setUserData({ ...userData, ...data });
      }
      
      // Update displayName in Auth if provided
      if (data.displayName) {
        await updateProfile(currentUser, {
          displayName: data.displayName
        });
      }
      
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
    }
  }

  const value = {
    currentUser,
    userData,
    userRole,
    loading,
    register,
    login,
    logout,
    updateUserProfile,
    registerPreRegisteredUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}