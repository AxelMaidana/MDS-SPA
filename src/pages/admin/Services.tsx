/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, FormEvent } from 'react';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import toast from 'react-hot-toast';
import { Scissors, PlusCircle, Edit, Trash, Loader2, X, Upload, DollarSign, Clock, Filter } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  imageUrl: string;
  category: string;
  specialty: string;
  createdAt?: any;
}

const AdminServicios = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    duration: 60,
    imageUrl: '',
    category: '',
    specialty: ''
  });

  // Definición de categorías y especialidades (en inglés para la BD, con traducción al español para UI)
  const serviceCategories = {
    massages: {
      name: 'Masajes',
      specialties: [
        'Anti-stress',
        'Descontracturantes',
        'Masajes con piedras calientes',
        'Circulatorios'
      ]
    },
    beauty: {
      name: 'Belleza',
      specialties: [
        'Lifting de pestaña',
        'Depilación facial',
        'Belleza de manos y pies'
      ]
    },
    facialTreatments: {
      name: 'Tratamientos Faciales',
      specialties: [
        'Punta de Diamante: Microexfoliación',
        'Limpieza profunda + Hidratación',
        'Crio frecuencia facial'
      ]
    },
    bodyTreatments: {
      name: 'Tratamientos Corporales',
      specialties: [
        'VelaSlim',
        'DermoHealth',
        'Criofrecuencia',
        'Ultracavitación'
      ]
    },
    groupServices: {
      name: 'Servicios Grupales',
      specialties: [
        'Hidromasajes',
        'Yoga'
      ]
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (categoryFilter === 'all') {
      setFilteredServices(services);
    } else {
      setFilteredServices(services.filter(service => service.category === categoryFilter));
    }
  }, [categoryFilter, services]);

  const fetchServices = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'services'));
      const servicesData: Service[] = [];
      
      querySnapshot.forEach((doc) => {
        servicesData.push({
          id: doc.id,
          ...doc.data()
        } as Service);
      });
      
      setServices(servicesData);
      setFilteredServices(servicesData);
    } catch (error) {
      console.error('Error al obtener servicios:', error);
      toast.error('Error al cargar los servicios');
      setServices(placeholderServices);
      setFilteredServices(placeholderServices);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      duration: 60,
      imageUrl: '',
      category: '',
      specialty: ''
    });
    setImageFile(null);
    setImagePreview('');
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (service: Service) => {
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      imageUrl: service.imageUrl,
      category: service.category,
      specialty: service.specialty
    });
    setCurrentService(service);
    setImagePreview(service.imageUrl);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'price' || name === 'duration') {
      setFormData({
        ...formData,
        [name]: Number(value)
      });
    } else if (name === 'category') {
      // Reset specialty when category changes
      setFormData({
        ...formData,
        [name]: value,
        specialty: ''
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
      
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || formData.price <= 0 || formData.duration <= 0 || !formData.category || !formData.specialty) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }
    
    if (!isEditing && !imageFile && !formData.imageUrl) {
      toast.error('Por favor suba una imagen');
      return;
    }
    
    setFormLoading(true);
    
    try {
      let imageUrl = formData.imageUrl;
      
      if (imageFile) {
        const storageRef = ref(storage, `services/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      const serviceData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        duration: formData.duration,
        category: formData.category,
        specialty: formData.specialty,
        imageUrl: imageUrl,
        updatedAt: serverTimestamp(),
        ...(!isEditing && { createdAt: serverTimestamp() })
      };
      
      if (isEditing && currentService) {
        await updateDoc(doc(db, 'services', currentService.id), serviceData);
        toast.success('Servicio actualizado correctamente');
        setServices(services.map(service => 
          service.id === currentService.id ? { ...service, ...serviceData } : service
        ));
      } else {
        const docRef = await addDoc(collection(db, 'services'), serviceData);
        toast.success('Servicio agregado correctamente');
        setServices([...services, { id: docRef.id, ...serviceData }]);
      }
      
      setShowModal(false);
      setFormData({
        name: '',
        description: '',
        price: 0,
        duration: 60,
        imageUrl: '',
        category: '',
        specialty: ''
      });
      setImageFile(null);
      setImagePreview('');
    } catch (error) {
      console.error('Error al guardar servicio:', error);
      toast.error('Error al guardar el servicio');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro que desea eliminar este servicio? Esta acción no se puede deshacer.')) {
      setDeleteId(id);
      
      try {
        const serviceDoc = await getDoc(doc(db, 'services', id));
        
        if (serviceDoc.exists()) {
          const serviceData = serviceDoc.data();
          
          await deleteDoc(doc(db, 'services', id));
          
          if (serviceData.imageUrl && serviceData.imageUrl.includes('firebasestorage')) {
            const imageRef = ref(storage, serviceData.imageUrl);
            await deleteObject(imageRef);
          }
          
          setServices(services.filter(service => service.id !== id));
          toast.success('Servicio eliminado correctamente');
        }
      } catch (error) {
        console.error('Error al eliminar servicio:', error);
        toast.error('Error al eliminar el servicio');
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
            <h1 className="section-title mb-2">Administrar Servicios</h1>
            <p className="text-secondary-600">Agregue, edite o elimine servicios del spa</p>
          </div>
          <button 
            onClick={openAddModal}
            className="btn-primary mt-4 md:mt-0 flex items-center"
          >
            <PlusCircle size={18} className="mr-2" />
            Agregar Nuevo Servicio
          </button>
        </div>

        {/* Filtro por categoría */}
        <div className="mb-6 flex items-center">
          <Filter size={20} className="text-secondary-500 mr-2" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-select max-w-xs"
          >
            <option value="all">Todas las categorías</option>
            {Object.entries(serviceCategories).map(([key, category]) => (
              <option key={key} value={key}>{category.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-secondary-600">Cargando servicios...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Scissors size={48} className="mx-auto text-secondary-400 mb-4" />
            <h3 className="text-xl font-medium text-secondary-800 mb-2">No se encontraron servicios</h3>
            <p className="text-secondary-600 mb-6">No hay servicios en esta categoría. Puede agregar uno nuevo.</p>
            <button 
              onClick={openAddModal}
              className="btn-primary"
            >
              Agregar Nuevo Servicio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div key={service.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="relative h-48">
                  <img 
                    src={service.imageUrl}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-0 right-0 p-2 flex space-x-2">
                    <button 
                      onClick={() => openEditModal(service)}
                      className="p-2 bg-white rounded-full shadow hover:bg-primary-50 transition-colors"
                    >
                      <Edit size={16} className="text-primary-600" />
                    </button>
                    <button 
                      onClick={() => handleDelete(service.id)}
                      className="p-2 bg-white rounded-full shadow hover:bg-error-50 transition-colors"
                      disabled={deleteId === service.id}
                    >
                      {deleteId === service.id ? (
                        <Loader2 size={16} className="text-error-600 animate-spin" />
                      ) : (
                        <Trash size={16} className="text-error-600" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{service.name}</h3>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {serviceCategories[service.category as keyof typeof serviceCategories]?.name || service.category}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center text-sm font-medium">
                        <DollarSign size={14} className="mr-1" />
                        ${service.price}
                      </div>
                      <div className="flex items-center text-sm text-secondary-600">
                        <Clock size={14} className="mr-1" />
                        {service.duration} min
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-secondary-700 mt-2 mb-1">
                    <span className="font-medium">Especialidad:</span> {service.specialty}
                  </p>
                  <p className="text-secondary-700 text-sm line-clamp-2">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Agregar/Editar Servicio */}
      {showModal && (
        <div className="fixed inset-0 bg-secondary-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-6 border-b border-secondary-200">
              <h3 className="text-xl font-semibold text-secondary-900">
                {isEditing ? 'Editar Servicio' : 'Agregar Nuevo Servicio'}
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
                <label htmlFor="name" className="form-label">Nombre del Servicio</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Ej: Masaje Sueco"
                  disabled={formLoading}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description" className="form-label">Descripción</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-input min-h-[100px]"
                  placeholder="Describa el servicio..."
                  disabled={formLoading}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label htmlFor="price" className="form-label">Precio ($)</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={formLoading}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="duration" className="form-label">Duración (minutos)</label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="60"
                    min="15"
                    step="15"
                    disabled={formLoading}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label htmlFor="category" className="form-label">Categoría</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="form-select"
                    disabled={formLoading}
                    required
                  >
                    <option value="">Seleccione una categoría</option>
                    {Object.entries(serviceCategories).map(([key, category]) => (
                      <option key={key} value={key}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="specialty" className="form-label">Especialidad</label>
                  <select
                    id="specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleInputChange}
                    className="form-select"
                    disabled={!formData.category || formLoading}
                    required
                  >
                    <option value="">Seleccione una especialidad</option>
                    {formData.category && serviceCategories[formData.category as keyof typeof serviceCategories]?.specialties.map((specialty, index) => (
                      <option key={index} value={specialty}>{specialty}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Imagen del Servicio</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-secondary-300 border-dashed rounded-md">
                  {imagePreview ? (
                    <div className="text-center">
                      <img 
                        src={imagePreview}
                        alt="Vista previa"
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
                        Eliminar Imagen
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
                          <span>Subir archivo</span>
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
                        <p className="pl-1">o arrastrar y soltar</p>
                      </div>
                      <p className="text-xs text-secondary-500">
                        PNG, JPG, GIF hasta 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {!isEditing && !imageFile && !formData.imageUrl && (
                <div className="text-sm mb-4">
                  <p className="text-secondary-700">
                    ¿No tiene una imagen? Puede usar una URL directa a una imagen:
                  </p>
                  <input
                    type="url"
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className="form-input mt-2"
                    placeholder="https://ejemplo.com/imagen.jpg"
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
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin mr-2" />
                      {isEditing ? 'Actualizando...' : 'Creando...'}
                    </>
                  ) : (
                    <>{isEditing ? 'Actualizar Servicio' : 'Crear Servicio'}</>
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

// Servicios de ejemplo en caso de que falle la conexión con Firebase
const placeholderServices = [
  {
    id: 'service1',
    name: 'Masaje Anti-stress',
    description: 'Un masaje relajante diseñado para aliviar el estrés y la tensión muscular.',
    price: 85,
    duration: 60,
    imageUrl: 'https://images.pexels.com/photos/5599437/pexels-photo-5599437.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    category: 'massages',
    specialty: 'Anti-stress'
  },
  {
    id: 'service2',
    name: 'Limpieza Facial Profunda',
    description: 'Tratamiento facial que incluye limpieza profunda e hidratación intensiva.',
    price: 95,
    duration: 60,
    imageUrl: 'https://images.pexels.com/photos/3757952/pexels-photo-3757952.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    category: 'facialTreatments',
    specialty: 'Limpieza profunda + Hidratación'
  },
  {
    id: 'service3',
    name: 'Yoga Grupal',
    description: 'Sesión de yoga en grupo para mejorar flexibilidad y relajación.',
    price: 25,
    duration: 90,
    imageUrl: 'https://images.pexels.com/photos/3865676/pexels-photo-3865676.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    category: 'groupServices',
    specialty: 'Yoga'
  }
];

export default AdminServicios;