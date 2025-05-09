/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, FormEvent } from 'react';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../../firebase/config';
import toast from 'react-hot-toast';
import { PlusCircle, Edit, Trash, Loader2, X, Upload, Filter, User } from 'lucide-react';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  specialty?: string;
  createdAt?: any;
  imageUrl: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Filtros
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    role: 'client',
    specialty: '',
    imageUrl: ''
  });

  // Definición de especialidades
  const specialties = {
    massages: [
      'Anti-stress',
      'Descontracturantes',
      'Masajes con piedras calientes',
      'Circulatorios'
    ],
    beauty: [
      'Lifting de pestaña',
      'Depilación facial',
      'Belleza de manos y pies'
    ],
    facialTreatments: [
      'Punta de Diamante: Microexfoliación',
      'Limpieza profunda + Hidratación',
      'Crio frecuencia facial'
    ],
    bodyTreatments: [
      'VelaSlim',
      'DermoHealth',
      'Criofrecuencia',
      'Ultracavitación'
    ],
    groupServices: [
      'Hidromasajes',
      'Yoga'
    ]
  };

  // Obtener todas las especialidades como array plano para filtros
  const allSpecialties = [
    ...specialties.massages,
    ...specialties.beauty,
    ...specialties.facialTreatments,
    ...specialties.bodyTreatments,
    ...specialties.groupServices
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  // Aplicar filtros cuando cambian los usuarios o los filtros
  useEffect(() => {
    applyFilters();
  }, [users, roleFilter, specialtyFilter]);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData: User[] = [];
      
      querySnapshot.forEach((doc) => {
        usersData.push({
          id: doc.id,
          ...doc.data()
        } as User);
      });
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setUsers(placeholderUsers);
    } finally {
      setLoading(false);
    }
  };

  // Función para aplicar los filtros
  const applyFilters = () => {
    let result = [...users];

    // Filtrar por rol
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }

    // Filtrar por especialidad (solo para staff)
    if (specialtyFilter !== 'all') {
      result = result.filter(user => 
        user.role === 'staff' && user.specialty === specialtyFilter
      );
    }

    setFilteredUsers(result);
  };

  const openAddModal = () => {
    setFormData({
      email: '',
      displayName: '',
      role: 'client',
      specialty: '',
      imageUrl: ''
    });
    setImageFile(null);
    setImagePreview('');
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setFormData({
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      specialty: user.specialty || '',
      imageUrl: user.imageUrl
    });
    setCurrentUser(user);
    setImagePreview(user.imageUrl);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.displayName || !formData.role) {
      toast.error('Please fill all required fields');
      return;
    }
    
    if (formData.role === 'staff' && !formData.specialty) {
      toast.error('Please select a specialty for staff members');
      return;
    }
    
    if (!isEditing && !imageFile && !formData.imageUrl) {
      toast.error('Please upload an image');
      return;
    }
    
    setFormLoading(true);
    
    try {
      let imageUrl = formData.imageUrl;
      
      if (imageFile) {
        const storageRef = ref(storage, `users/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      const userData = {
        displayName: formData.displayName,
        email: formData.email,
        role: formData.role,
        ...(formData.role === 'staff' && { specialty: formData.specialty }),
        imageUrl: imageUrl,
        updatedAt: serverTimestamp(),
        ...(!isEditing && { createdAt: serverTimestamp() })
      };
      
      if (isEditing && currentUser) {
        await updateDoc(doc(db, 'users', currentUser.id), userData);
        toast.success('User updated successfully');
        setUsers(users.map(user => 
          user.id === currentUser.id ? { ...user, ...userData } : user
        ));
      } else {
        const docRef = await addDoc(collection(db, 'users'), userData);
        toast.success('User added successfully');
        setUsers([...users, { id: docRef.id, ...userData }]);
      }
      
      setShowModal(false);
      setFormData({
        email: '',
        displayName: '',
        role: 'client',
        specialty: '',
        imageUrl: ''
      });
      setImageFile(null);
      setImagePreview('');
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Failed to save user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setDeleteId(id);
      
      try {
        const userDoc = await getDoc(doc(db, 'users', id));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          await deleteDoc(doc(db, 'users', id));
          
          if (userData.imageUrl && userData.imageUrl.includes('firebasestorage')) {
            const imageRef = ref(storage, userData.imageUrl);
            await deleteObject(imageRef);
          }
          
          setUsers(users.filter(user => user.id !== id));
          toast.success('User deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      } finally {
        setDeleteId(null);
      }
    }
  };

  // Resetear todos los filtros
  const resetFilters = () => {
    setRoleFilter('all');
    setSpecialtyFilter('all');
  };

  return (
    <div className="min-h-screen pt-24 pb-12">      
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">          
          <div>
            <h1 className="section-title mb-2">Manage Users</h1>
            <p className="text-secondary-600">Add, edit, or delete users</p>
          </div>
          
          <div className="flex space-x-4 mt-4 md:mt-0">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center"
            >
              <Filter size={18} className="mr-2" />
              Filters
            </button>
            
            <button 
              onClick={openAddModal}
              className="btn-primary flex items-center"
            >
              <PlusCircle size={18} className="mr-2" />
              Add New User
            </button>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label htmlFor="roleFilter" className="form-label">Filter by Role</label>
                <select
                  id="roleFilter"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="form-select"
                >
                  <option value="all">All Roles</option>
                  <option value="client">Client</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="specialtyFilter" className="form-label">Filter by Specialty</label>
                <select
                  id="specialtyFilter"
                  value={specialtyFilter}
                  onChange={(e) => setSpecialtyFilter(e.target.value)}
                  className="form-select"
                  disabled={roleFilter !== 'staff' && roleFilter !== 'all'}
                >
                  <option value="all">All Specialties</option>
                  {allSpecialties.map((specialty, index) => (
                    <option key={`specialty-${index}`} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="btn-secondary w-full"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-secondary-600">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <User size={48} className="mx-auto text-secondary-400 mb-4" />
            <h3 className="text-xl font-medium text-secondary-800 mb-2">
              {users.length === 0 ? 'No Users Found' : 'No Users Match Your Filters'}
            </h3>
            <p className="text-secondary-600 mb-6">
              {users.length === 0 
                ? 'You haven\'t added any users yet. Get started by adding your first user.' 
                : 'Try adjusting your filters or reset them to see all users.'}
            </p>
            <div className="flex justify-center space-x-4">
              {users.length > 0 && (
                <button 
                  onClick={resetFilters}
                  className="btn-secondary"
                >
                  Reset Filters
                </button>
              )}
              <button 
                onClick={openAddModal}
                className="btn-primary"
              >
                Add New User
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="relative h-48">
                  <img 
                    src={user.imageUrl}
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-0 right-0 p-2 flex space-x-2">
                    <button 
                      onClick={() => openEditModal(user)}
                      className="p-2 bg-white rounded-full shadow hover:bg-primary-50 transition-colors"
                    >
                      <Edit size={16} className="text-primary-600" />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-2 bg-white rounded-full shadow hover:bg-error-50 transition-colors"
                      disabled={deleteId === user.id}
                    >
                      {deleteId === user.id ? (
                        <Loader2 size={16} className="text-error-600 animate-spin" />
                      ) : (
                        <Trash size={16} className="text-error-600" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{user.displayName}</h3>
                  <p className="text-sm text-gray-600 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {user.email}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : user.role === 'staff' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                    {user.createdAt && (
                      <span className="text-xs text-gray-500">
                        {new Date(user.createdAt.seconds * 1000).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {user.role === 'staff' && user.specialty && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-600">Specialty:</p>
                      <p className="text-sm font-medium text-gray-800">{user.specialty}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-secondary-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-6 border-b border-secondary-200">
              <h3 className="text-xl font-semibold text-secondary-900">
                {isEditing ? 'Edit User' : 'Add New User'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-secondary-500 hover:text-secondary-700"
                disabled={formLoading}
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your email"
                  disabled={formLoading}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="displayName" className="form-label">Display Name</label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your display name"
                  disabled={formLoading}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="role" className="form-label">Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="form-select"
                  disabled={formLoading}
                  required
                >
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              
              {formData.role === 'staff' && (
                <div className="form-group">
                  <label htmlFor="specialty" className="form-label">Specialty</label>
                  <select
                    id="specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleInputChange}
                    className="form-select"
                    disabled={formLoading}
                    required={formData.role === 'staff'}
                  >
                    <option value="">Select a specialty</option>
                    
                    <optgroup label="Massages">
                      {specialties.massages.map((item, index) => (
                        <option key={`massage-${index}`} value={item}>{item}</option>
                      ))}
                    </optgroup>
                    
                    <optgroup label="Beauty Treatments">
                      {specialties.beauty.map((item, index) => (
                        <option key={`beauty-${index}`} value={item}>{item}</option>
                      ))}
                    </optgroup>
                    
                    <optgroup label="Facial Treatments">
                      {specialties.facialTreatments.map((item, index) => (
                        <option key={`facial-${index}`} value={item}>{item}</option>
                      ))}
                    </optgroup>
                    
                    <optgroup label="Body Treatments">
                      {specialties.bodyTreatments.map((item, index) => (
                        <option key={`body-${index}`} value={item}>{item}</option>
                      ))}
                    </optgroup>
                    
                    <optgroup label="Group Services">
                      {specialties.groupServices.map((item, index) => (
                        <option key={`group-${index}`} value={item}>{item}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              )}
              
              <div className="form-group">
                <label className="form-label">User Image</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-secondary-300 border-dashed rounded-md">
                  {imagePreview ? (
                    <div className="text-center">
                      <img 
                        src={imagePreview}
                        alt="Preview"
                        className="mx-auto h-48 object-cover mb-4"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('');
                          setImageFile(null);
                          setFormData({ ...formData, imageUrl: '' });
                        }}
                        className="text-error-600 hover:text-error-800 text-sm font-medium"
                        disabled={formLoading}
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-secondary-400" />
                      <div className="flex text-sm text-secondary-600">
                        <label
                          htmlFor="image-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-700"
                        >
                          <span>Upload a file</span>
                          <input
                            id="image-upload"
                            name="image-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageChange}
                            disabled={formLoading}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-secondary-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {!isEditing && !imageFile && !formData.imageUrl && (
                <div className="text-sm mb-4">
                  <p className="text-secondary-700">
                    Don't have an image? You can use a direct URL to an image:
                  </p>
                  <input
                    type="url"
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className="form-input mt-2"
                    placeholder="https://example.com/image.jpg"
                    disabled={formLoading}
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin mr-2" />
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>{isEditing ? 'Update User' : 'Create User'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Placeholder users in case Firebase fetch fails
const placeholderUsers = [
  {
    id: 'user1',
    email: 'user1@example.com',
    displayName: 'User 1',
    role: 'client',
    imageUrl: 'https://images.pexels.com/photos/5599437/pexels-photo-5599437.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  },
  {
    id: 'user2',
    email: 'user2@example.com',
    displayName: 'User 2',
    role: 'admin',
    imageUrl: 'https://images.pexels.com/photos/3757952/pexels-photo-3757952.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  },
  {
    id: 'user3',
    email: 'user3@example.com',
    displayName: 'User 3',
    role: 'staff',
    specialty: 'Anti-stress Massage',
    imageUrl: 'https://images.pexels.com/photos/3865676/pexels-photo-3865676.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  }
];

export default AdminUsers;