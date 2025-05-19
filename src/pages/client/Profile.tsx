import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config';
import { toast } from 'react-hot-toast';
import { updateProfile, updateEmail } from 'firebase/auth';
import { Camera, Edit2, Save, X, User as UserIcon, Mail, Shield } from 'react-feather';

interface UserData {
  displayName: string;
  email: string;
  photoURL: string;
  role?: string;
  createdAt?: string;
}

const Profile = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        setLoading(true);
        try {
          // Datos básicos de autenticación
          const basicData = {
            displayName: currentUser.displayName || '',
            email: currentUser.email || '',
            photoURL: currentUser.photoURL ||'',
          };

          // Obtener datos adicionales de Firestore
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const firestoreData = userDoc.exists() ? userDoc.data() : {};

          setUserData({
            ...basicData,
            ...firestoreData,
          });

          setFormData({
            displayName: currentUser.displayName || '',
            email: currentUser.email || '',
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          toast.error('Error al cargar los datos del usuario');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser || !userData) return;

    setLoading(true);
    try {
      // Actualizar datos de autenticación
      const updates: Promise<void>[] = [];

      if (formData.displayName !== currentUser.displayName) {
        updates.push(updateProfile(currentUser, { displayName: formData.displayName }));
      }

      if (formData.email !== currentUser.email) {
        updates.push(updateEmail(currentUser, formData.email));
      }

      // Subir nueva imagen si existe
      let photoURL = userData.photoURL;
      if (imageFile) {
        const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
        await uploadBytes(storageRef, imageFile);
        photoURL = await getDownloadURL(storageRef);
        updates.push(updateProfile(currentUser, { photoURL }));
      }

      // Esperar a que todas las actualizaciones de auth terminen
      await Promise.all(updates);

      // Actualizar datos en Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: formData.displayName,
        email: formData.email,
        ...(photoURL && { photoURL }),
        updatedAt: new Date().toISOString(),
      });

      // Actualizar estado local
      setUserData({
        ...userData,
        displayName: formData.displayName,
        email: formData.email,
        ...(photoURL && { photoURL }),
      });

      setIsEditing(false);
      setImageFile(null);
      setPreviewImage(null);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0C9383]"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No se encontraron datos de usuario</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Encabezado */}
          <div className="bg-gradient-to-r from-[#22895e] to-[#01f891] px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : userData.photoURL ? (
                    <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-100 transition">
                    <Camera className="w-5 h-5 text-gray-700" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-white">
                  {isEditing ? (
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="bg-white/90 rounded px-3 py-1 text-gray-900"
                    />
                  ) : (
                    userData.displayName || 'Usuario'
                  )}
                </h1>
                <p className="text-primary-100 mt-1">{userData.role || 'Usuario'}</p>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="px-6 py-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Información del Perfil</h2>
              {isEditing ? (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setPreviewImage(null);
                      setFormData({
                        displayName: userData.displayName || '',
                        email: userData.email || '',
                      });
                    }}
                    className="btn-secondary flex items-center px-3 py-1 text-sm"
                  >
                    <X className="w-4 h-4 mr-1" /> Cancelar
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="btn-primary flex items-center px-3 py-1 text-sm"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-1" /> Guardar
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary flex items-center px-3 py-1 text-sm"
                >
                  <Edit2 className="w-4 h-4 mr-1" /> Editar Perfil
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Sección de Información Básica */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                  <UserIcon className="w-5 h-5 mr-2 text-[#0C9383]" />
                  Información Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nombre</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        className="form-input w-full"
                      />
                    ) : (
                      <p className="text-gray-900 bg-white p-2 rounded border border-gray-200">
                        {userData.displayName || 'No especificado'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Rol</label>
                    <p className="text-gray-900 bg-white p-2 rounded border border-gray-200">
                      {userData.role || 'Usuario'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sección de Contacto */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-[#0C9383]" />
                  Información de Contacto
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="form-input w-full"
                      />
                    ) : (
                      <p className="text-gray-900 bg-white p-2 rounded border border-gray-200">
                        {userData.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sección de Seguridad */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-[#0C9383]" />
                  Seguridad
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Cuenta creada el: {new Date(userData.createdAt || currentUser?.metadata.creationTime || '').toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Último inicio de sesión: {new Date(currentUser?.metadata.lastSignInTime || '').toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;