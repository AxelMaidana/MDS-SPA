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
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
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

// Modifica la función registerPreRegisteredUser en tu AuthContext
async function registerPreRegisteredUser(email: string, password: string): Promise<void> {
  try {
    // 1. Buscar usuario en Firestore
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const oldUid = userDoc.id; // Guardamos el UID original

    // 2. Crear cuenta en Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    // 3. Eliminar el documento viejo y crear uno nuevo con el UID correcto
    await deleteDoc(doc(db, 'users', oldUid));
    
    // Crear nuevo documento con los mismos datos pero nuevo UID
    await setDoc(doc(db, 'users', newUser.uid), {
      ...userData,
      uid: newUser.uid,
      authCreated: true,
      updatedAt: serverTimestamp()
    });

    toast.success('Cuenta creada exitosamente!');
  } catch (error: any) {
    
   console.error('Error al registrar el usuario pre-registrado:', error);
  }
}

async function login(email: string, password: string) {
  try {
    //validaciones
    if (!email || !password) {
      toast.error('Por favor completa todos los campos');
      throw new Error('Por favor completa todos los campos');
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
    }
    // Intento normal de login
    await signInWithEmailAndPassword(auth, email, password);
    toast.success('Inicio de sesión exitoso!');
  } catch (error: any) {
    // Si el usuario no existe en Auth pero sí en Firestore
    if (error.code === 'asdasdasd') {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        // Redirigir solo si no ha completado el registro (authCreated no existe o es false)
        if (!userData.authCreated) {
          throw { redirect: true, message: 'Por favor completa tu registro' };
        }
      }
    }
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