/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, FormEvent } from 'react';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../../firebase/config';
import toast from 'react-hot-toast';
import { Scissors, PlusCircle, Edit, Trash, Loader2, X, Upload } from 'lucide-react';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

interface Staff {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt?: any;
  imageUrl: string;
  price: number;
  duration: number;
}

const StaffAppointments = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    role: 'staff',
    imageUrl: ''
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'staff'));
      const staffData: Staff[] = [];
      
      querySnapshot.forEach((doc) => {
        staffData.push({
          id: doc.id,
          ...doc.data()
        } as Staff);
      });
      
      setStaff(staffData);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff');
      // Use placeholder data if fetching fails
      setStaff(placeholderStaff as Staff[]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setFormData({
      email: '',
      displayName: '',
      role: 'staff',
      imageUrl: ''
    });
    setImageFile(null);
    setImagePreview('');
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (staff: Staff) => {
    setFormData({
      email: staff.email,
      displayName: staff.displayName,
      role: staff.role,
      imageUrl: staff.imageUrl
    });
    setCurrentStaff(staff);
    setImagePreview(staff.imageUrl);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'role') {
      setFormData({
        ...formData,
        [name]: value
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Preview image
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
    
    if (!isEditing && !imageFile && !formData.imageUrl) {
      toast.error('Please upload an image');
      return;
    }
    
    setFormLoading(true);
    
    try {
      let imageUrl = formData.imageUrl;
      
      // Upload image if a new one is selected
      if (imageFile) {
        const storageRef = ref(storage, `staff/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      if (isEditing && currentStaff) {
        // Update existing staff
        await updateDoc(doc(db, 'staff', currentStaff.id), {
          displayName: formData.displayName,
          email: formData.email,
          role: formData.role,
          imageUrl: imageUrl,
          updatedAt: serverTimestamp()
        });
        
        toast.success('Staff updated successfully');
        
        // Update local state
        setStaff(staff.map(staff => 
          staff.id === currentStaff.id 
            ? { ...staff, ...formData, imageUrl } 
            : staff
        ));
      } else {
        // Add new staff
        const newStaff = {
          displayName: formData.displayName,
          email: formData.email,
          role: formData.role,
          imageUrl: imageUrl,
          createdAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'staff'), newStaff);
        
        toast.success('Staff added successfully');
        
        // Update local state
        setStaff([...staff, {
            id: docRef.id, ...newStaff,
            price: 0,
            duration: 0
        }]);        
      }
      
      // Close modal and reset form
      setShowModal(false);
      setFormData({
        email: '',
        displayName: '',
        role: 'staff',
        imageUrl: ''
      });
      setImageFile(null);
      setImagePreview('');
    } catch (error) {
      console.error('Error saving staff:', error);
      toast.error('Failed to save staff');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this staff? This action cannot be undone.')) {
      setDeleteId(id);
      
      try {
        // Get staff to check for image URL
        const staffDoc = await getDoc(doc(db, 'staff', id));
        
        if (staffDoc.exists()) {
          const staffData = staffDoc.data();
          
          // Delete document
          await deleteDoc(doc(db, 'staff', id));
          
          // Delete image from storage if exists and is stored in Firebase
          if (staffData.imageUrl && staffData.imageUrl.includes('firebasestorage')) {
            const imageRef = ref(storage, staffData.imageUrl);
            await deleteObject(imageRef);
          }
          
          // Update local state
          setStaff(staff.filter(staff => staff.id !== id));
          
          toast.success('Staff deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting staff:', error);
        toast.error('Failed to delete staff');
      } finally {
        setDeleteId(null);
      }
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12">      
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">          
          <div>
            <h1 className="section-title mb-2">Manage Staff</h1>
            <p className="text-secondary-600">Add, edit, or delete staff members</p>
          </div>
          <button 
            onClick={openAddModal}
            className="btn-primary mt-4 md:mt-0 flex items-center"
          >
            <PlusCircle size={18} className="mr-2" />
            Add New Staff
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">                
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>                
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-secondary-600">Loading staff...</p>
          </div>
        ) : staff.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Scissors size={48} className="mx-auto text-secondary-400 mb-4" />
            <h3 className="text-xl font-medium text-secondary-800 mb-2">No Staff Found</h3>
            <p className="text-secondary-600 mb-6">You haven't added any staff yet. Get started by adding your first staff member.</p>
            <button 
              onClick={openAddModal}
              className="btn-primary"
            >
              Add Your First Staff
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">            
            {staff.map((staff) => (              
              <div key={staff.id} className="bg-white rounded-xl shadow-sm overflow-hidden">                
                <div className="relative h-48">
                  <img 
                    src={staff.imageUrl}
                    alt={staff.displayName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-0 right-0 p-2 flex space-x-2">
                    <button 
                      onClick={() => openEditModal(staff)}
                      className="p-2 bg-white rounded-full shadow hover:bg-primary-50 transition-colors"
                    >
                      <Edit size={16} className="text-primary-600" />
                    </button>
                    <button 
                      onClick={() => handleDelete(staff.id)}
                      className="p-2 bg-white rounded-full shadow hover:bg-error-50 transition-colors"
                      disabled={deleteId === staff.id}
                    >
                      {deleteId === staff.id ? (
                        <Loader2 size={16} className="text-error-600 animate-spin" />
                      ) : (
                        <Trash size={16} className="text-error-600" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Edit Staff Modal */}
                {showModal && (
                  <div className="fixed inset-0 bg-secondary-900/50 flex items-center justify-center z-50 p-4">                    
                    <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
                      <div className="flex justify-between items-center p-6 border-b border-secondary-200">
                        <h3 className="text-xl font-semibold text-secondary-900">
                          {isEditing ? 'Edit Staff' : 'Add New Staff'}
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
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="form-select"
                            disabled={formLoading}
                            required
                          >
                            <option value="staff">Staff</option>
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">Staff Image</label>
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
                              <>{isEditing ? 'Update Staff' : 'Create Staff'}</>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-secondary-900/50 flex items-center justify-center z-50 p-4">          
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-6 border-b border-secondary-200">              
              <h3 className="text-xl font-semibold text-secondary-900">                
                {isEditing ? 'Edit Staff' : 'Add New Staff'}                
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
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="form-select"
                  disabled={formLoading}
                  required
                >
                  <option value="staff">Staff</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Staff Image</label>
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
                    <>{isEditing ? 'Update Staff' : 'Create Staff'}</>
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

// Placeholder staff in case Firebase fetch fails
const placeholderStaff = [
  {
    id: 'staff1',
    email: 'staff1@example.com',
    displayName: 'Staff 1',
    role: 'staff',
    imageUrl: 'https://images.pexels.com/photos/5599437/pexels-photo-5599437.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  },
  {
    id: 'staff2',
    email: 'staff2@example.com',
    displayName: 'Staff 2',
    role: 'staff',
    imageUrl: 'https://images.pexels.com/photos/3757952/pexels-photo-3757952.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  },
  {
    id: 'staff3',
    email: 'staff3@example.com',
    displayName: 'Staff 3',
    role: 'staff',
    imageUrl: 'https://images.pexels.com/photos/3865676/pexels-photo-3865676.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  }
];  

export default StaffAppointments;