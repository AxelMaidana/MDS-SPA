import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { addDays, isAfter, isBefore, setHours, setMinutes, format, differenceInHours } from 'date-fns';
import toast from 'react-hot-toast';
import { Calendar, Clock, UserCheck, ChevronRight, Check, ArrowRight, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; 
  imageUrl: string;
  specialty: string;
  availableTimes?: string[];
}

interface StaffMember {
  id: string;
  displayName: string;
  email: string;
  specialty: string;
  role: string;
  imageUrl?: string;
}

const BookAppointment = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const preSelectedServiceId = searchParams.get('service');

  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [selectedService, setSelectedService] = useState<string>(preSelectedServiceId || '');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState<'services' | 'staff' | 'datetime' | 'payment'>('services');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<'web' | 'onsite' | null>(null);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: ''
  });
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);

  // Obtener todas las especialidades únicas
  const getSpecialties = () => {
    const specialties = new Set<string>();
    services.forEach(service => specialties.add(service.specialty));
    return Array.from(specialties);
  };

  // Filtrar servicios por especialidad
  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter(service => service.specialty === selectedCategory);

  // Fetch services and staff
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch services
        const servicesSnapshot = await getDocs(collection(db, 'services'));
        const servicesData: Service[] = [];
        servicesSnapshot.forEach((doc) => {
          const serviceData = doc.data() as Omit<Service, 'id'>;
          servicesData.push({ 
            id: doc.id, 
            ...serviceData,
            availableTimes: ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM']
          });
        });
        setServices(servicesData);

        // Fetch staff members
        const staffQuery = query(collection(db, 'users'), where('role', '==', 'staff'));
        const staffSnapshot = await getDocs(staffQuery);
        const staffData: StaffMember[] = [];
        staffSnapshot.forEach((doc) => {
          staffData.push({ id: doc.id, ...doc.data() } as StaffMember);
        });
        setStaff(staffData);
        setFilteredStaff(staffData);

        if (preSelectedServiceId) {
          setSelectedService(preSelectedServiceId);
          setActiveStep('staff');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error cargando datos de reserva');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [preSelectedServiceId]);

  // Filtrar staff según la especialidad del servicio seleccionado
  useEffect(() => {
    if (selectedService && services.length > 0 && staff.length > 0) {
      const service = services.find(s => s.id === selectedService);
      if (service) {
        setCurrentService(service);
        const filtered = staff.filter(member => 
          member.specialty === service.specialty
        );
        setFilteredStaff(filtered);
        setSelectedStaff('');
      }
    } else {
      setCurrentService(null);
      setFilteredStaff(staff);
    }
  }, [selectedService, services, staff]);

  // Update current staff when selected staff changes
  useEffect(() => {
    if (selectedStaff && filteredStaff.length > 0) {
      const staffMember = filteredStaff.find(s => s.id === selectedStaff);
      setCurrentStaff(staffMember || null);
    } else {
      setCurrentStaff(null);
    }
  }, [selectedStaff, filteredStaff]);

  // Generate available time slots
  useEffect(() => {
    if (selectedDate) {
      const times: string[] = [];
      const startHour = 9;
      const endHour = 17;
      
      for (let hour = startHour; hour < endHour; hour++) {
        ['00', '30'].forEach(minute => {
          times.push(`${hour}:${minute}`);
        });
      }
      
      setAvailableTimes(times);
    }
  }, [selectedDate]);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleAddAnotherService = () => {
    if (currentService) {
      setSelectedServices([...selectedServices, currentService]);
      setSelectedService('');
      setSelectedStaff('');
      setSelectedDate(null);
      setSelectedTime('');
      setActiveStep('services');
      toast.success('Servicio agregado. Selecciona otro servicio o procede al pago.');
    }
  };

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(s => s.id !== serviceId));
  };

  const calculateTotal = () => {
    const basePrice = selectedServices.reduce((sum, service) => sum + service.price, currentService?.price || 0);
    
    // Aplicar descuento del 15% si se paga online y es más de 48 horas antes
    if (paymentMethod === 'web' && selectedDate) {
      const hoursUntilAppointment = differenceInHours(selectedDate, new Date());
      if (hoursUntilAppointment > 48) {
        return basePrice * 0.85; // 15% de descuento
      }
    }
    
    return basePrice;
  };

  const handlePaymentSubmit = async () => {
    if (!currentUser || !selectedService || !selectedStaff || !selectedDate || !selectedTime) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (!currentService) {
      toast.error('Selección de servicio inválida');
      return;
    }

    setSubmitting(true);

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const appointmentDateTime = setMinutes(setHours(selectedDate, hours), minutes);
      
      const allServices = [...selectedServices, currentService];
      const totalPrice = calculateTotal();
      const paymentStatus = paymentMethod === 'web' ? 'paid' : 'pending';
      const discountApplied = paymentMethod === 'web' && differenceInHours(appointmentDateTime, new Date()) > 48;

      // Crear una sola reserva para todos los servicios si son el mismo día
      const appointmentData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName,
        services: allServices.map(service => ({
          id: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration
        })),
        totalPrice,
        paymentMethod,
        paymentStatus,
        discountApplied,
        staffId: selectedStaff,
        staffName: currentStaff?.displayName || 'Desconocido',
        date: appointmentDateTime,
        createdAt: serverTimestamp(),
        status: 'booked'
      };
      
      await addDoc(collection(db, 'appointments'), appointmentData);
      
      // Enviar comprobante por email (simulado)
      if (paymentMethod === 'web') {
        toast.success('Pago procesado y comprobante enviado a tu email');
      }
      
      setShowSuccess(true);
    } catch (error) {
      console.error('Error reservando cita:', error);
      toast.error('Error al reservar cita. Por favor intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const filterDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isAfter(date, today) && isBefore(date, addDays(today, 30));
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setActiveStep('staff');
  };

  const handleStaffSelect = (staffId: string) => {
    setSelectedStaff(staffId);
    setActiveStep('datetime');
  };

  const handleBackToServices = () => {
    setActiveStep('services');
    setSelectedStaff('');
  };

  const handleBackToStaff = () => {
    setActiveStep('staff');
    setSelectedDate(null);
    setSelectedTime('');
  };

  const handleBackToDatetime = () => {
    setActiveStep('datetime');
    setPaymentMethod(null);
  };

  const handleProceedToPayment = () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Por favor selecciona fecha y hora');
      return;
    }
    setActiveStep('payment');
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gradient-to-b from-[#F8FAF4] to-white">
      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row gap-8"
        >
          {/* Left Panel - Steps */}
          <div className="w-full lg:w-2/5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#0C9383] to-[#28edf0] bg-clip-text text-transparent">
                Reserva tu Cita
              </h1>
              <p className="text-gray-600 mb-8">
                Completa estos pasos para programar tu experiencia de spa perfecta
              </p>

              {/* Progress Indicators */}
              <div className="space-y-4 mb-8">
                {/* Service Step */}
                <div className={`p-5 rounded-xl transition-all duration-300 ${
                  activeStep === 'services' 
                    ? "bg-gradient-to-r from-[#0C9383] to-[#99D4D6] text-white shadow-lg"
                    : selectedService || selectedServices.length > 0
                      ? "bg-white border border-[#0C9383] shadow-md"
                      : "bg-white border border-gray-200 shadow-md"
                }`}>
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      activeStep === 'services' 
                        ? "bg-white/20" 
                        : selectedService || selectedServices.length > 0
                          ? "bg-[#0C9383] text-white" 
                          : "bg-gray-100 text-[#0C9383]"
                    }`}>
                      <span className="font-bold">
                        {(selectedService || selectedServices.length > 0) ? <Check size={20} /> : '1'}
                      </span>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-medium">Servicio{selectedServices.length > 0 ? 's' : ''}</h3>
                      <p className="text-sm mt-1">
                        {selectedServices.length > 0 
                          ? `${selectedServices.length} servicio(s) seleccionado(s)`
                          : currentService?.name || "Selecciona un servicio"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Staff Step */}
                <div className={`p-5 rounded-xl transition-all duration-300 ${
                  activeStep === 'staff'
                    ? "bg-gradient-to-r from-[#0C9383] to-[#99D4D6] text-white shadow-lg"
                    : selectedStaff
                      ? "bg-white border border-[#0C9383] shadow-md"
                      : "bg-white border border-gray-200 shadow-md"
                } ${selectedService ? "cursor-pointer" : "opacity-60 cursor-not-allowed"}`}
                onClick={() => selectedService && setActiveStep('staff')}>
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      activeStep === 'staff'
                        ? "bg-white/20" 
                        : selectedStaff 
                          ? "bg-[#0C9383] text-white" 
                          : "bg-gray-100 text-[#0C9383]"
                    }`}>
                      <span className="font-bold">
                        {selectedStaff ? <Check size={20} /> : '2'}
                      </span>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-medium">Profesional</h3>
                      <p className="text-sm mt-1">
                        {currentStaff?.displayName || "Selecciona un Profesional"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date & Time Step */}
                <div className={`p-5 rounded-xl transition-all duration-300 ${
                  activeStep === 'datetime'
                    ? "bg-gradient-to-r from-[#0C9383] to-[#99D4D6] text-white shadow-lg"
                    : selectedDate && selectedTime
                      ? "bg-white border border-[#0C9383] shadow-md"
                      : "bg-white border border-gray-200 shadow-md"
                } ${selectedStaff ? "cursor-pointer" : "opacity-60 cursor-not-allowed"}`}
                onClick={() => selectedStaff && setActiveStep('datetime')}>
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      activeStep === 'datetime'
                        ? "bg-white/20" 
                        : selectedDate && selectedTime 
                          ? "bg-[#0C9383] text-white" 
                          : "bg-gray-100 text-[#0C9383]"
                    }`}>
                      <span className="font-bold">
                        {selectedDate && selectedTime ? <Check size={20} /> : '3'}
                      </span>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-medium">Fecha & Hora</h3>
                      <p className="text-sm mt-1">
                        {selectedDate && selectedTime 
                          ? `${format(selectedDate, 'PPP')} a las ${selectedTime}`
                          : "Selecciona fecha y hora"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Step */}
                <div className={`p-5 rounded-xl transition-all duration-300 ${
                  activeStep === 'payment'
                    ? "bg-gradient-to-r from-[#0C9383] to-[#99D4D6] text-white shadow-lg"
                    : paymentMethod
                      ? "bg-white border border-[#0C9383] shadow-md"
                      : "bg-white border border-gray-200 shadow-md"
                } ${selectedDate && selectedTime ? "cursor-pointer" : "opacity-60 cursor-not-allowed"}`}
                onClick={() => selectedDate && selectedTime && setActiveStep('payment')}>
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      activeStep === 'payment'
                        ? "bg-white/20" 
                        : paymentMethod 
                          ? "bg-[#0C9383] text-white" 
                          : "bg-gray-100 text-[#0C9383]"
                    }`}>
                      <span className="font-bold">
                        {paymentMethod ? <Check size={20} /> : '4'}
                      </span>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-medium">Pago</h3>
                      <p className="text-sm mt-1">
                        {paymentMethod 
                          ? paymentMethod === 'web' ? 'Pago online' : 'Pago en sitio'
                          : "Selecciona método de pago"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <UserCheck className="w-5 h-5 text-[#0C9383] mr-2" />
                  Tu Información
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <UserCheck className="w-5 h-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Nombre</p>
                      <p className="font-medium">{currentUser?.displayName || 'No disponible'}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <UserCheck className="w-5 h-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{currentUser?.email || 'No disponible'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Panel - Content */}
          <div className="w-full lg:w-3/5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl h-[800px] p-6 shadow-lg border border-gray-100 overflow-auto"
              >
                {/* Service Selection - Horizontal Cards */}
                {activeStep === 'services' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-[#0C9383] to-[#28edf0] bg-clip-text text-transparent mb-2">
                        Nuestros Servicios
                      </h2>
                      <p className="text-gray-600">
                        Selecciona el tratamiento que deseas disfrutar
                      </p>
                    </div>

                    <div className="lg:flex justify-between items-center mb-4 ">
                      <h3 className="text-lg font-semibold text-gray-800">Especialidades</h3>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 w-2/3"
                      >
                        <option value="all">Todas</option>
                        {getSpecialties().map((specialty) => (
                          <option key={specialty} value={specialty}>
                            {specialty}
                          </option>
                        ))}
                      </select>
                    </div>

                    {loading ? (
                      <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0C9383]"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        {filteredServices.map((service) => (
                          <motion.div
                            key={service.id}
                            whileHover={{ y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative overflow-hidden rounded-xl shadow-md cursor-pointer transition-all duration-300 ${
                              selectedService === service.id ? 'ring-2 ring-[#0C9383]' : 'hover:shadow-lg'
                            }`}
                            onClick={() => handleServiceSelect(service.id)}
                          >
                            <div className="h-40 bg-gray-100 overflow-hidden">
                              <img
                                src={service.imageUrl}
                                alt={service.name}
                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                              />
                            </div>
                            <div className="p-4">
                              <h3 className="text-lg font-bold text-gray-800">{service.name}</h3>
                              <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
                              <div className="mt-3 flex justify-between items-center">
                                <span className="text-xs px-2 py-1 bg-[#0C9383]/10 text-[#0C9383] rounded-full">
                                  {service.specialty}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500 flex items-center">
                                    <Clock size={14} className="mr-1" />
                                    {service.duration} min
                                  </span>
                                  <span className="text-sm font-bold text-[#0C9383]">
                                    ${service.price}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Staff Selection */}
                {activeStep === 'staff' && (
                  <div className="space-y-6">
                    <div>
                      <button 
                        onClick={handleBackToServices}
                        className="flex items-center text-[#0C9383] mb-4"
                      >
                        <ChevronRight className="rotate-180 mr-1" size={18} />
                        Volver a servicios
                      </button>
                      
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-[#0C9383] to-[#0C9383] bg-clip-text text-transparent mb-2">
                        Selecciona tu Profesional
                      </h2>
                      <p className="text-gray-600">
                        Elige al profesional que realizará tu tratamiento
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredStaff.length > 0 ? (
                        filteredStaff.map((member) => (
                          <motion.div
                            key={member.id}
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`p-4 rounded-xl transition-all cursor-pointer ${
                              selectedStaff === member.id
                                ? "ring-2 ring-[#0C9383] bg-gradient-to-br from-[#0C9383]/10 to-[#99D4D6]/10"
                                : "bg-white hover:bg-gray-50 border border-gray-200"
                            }`}
                            onClick={() => handleStaffSelect(member.id)}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden ${
                                selectedStaff === member.id 
                                  ? "ring-2 ring-[#0C9383]"
                                  : "border border-gray-200"
                              }`}>
                                {member.imageUrl ? (
                                  <img 
                                    src={member.imageUrl} 
                                    alt={member.displayName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[#0C9383]">
                                    <UserCheck className="w-6 h-6" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className={`font-medium ${
                                  selectedStaff === member.id ? "text-[#0C9383]" : "text-gray-800"
                                }`}>
                                  {member.displayName}
                                </p>
                                <p className="text-sm text-gray-500">{member.specialty}</p>
                                <div className="mt-2 flex items-center">
                                  <span className="text-xs bg-[#0C9383]/10 text-[#0C9383] px-2 py-1 rounded-full">
                                    {member.role === 'staff' ? 'Profesional' : member.role}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center py-8 text-gray-500">
                          No hay Profesionales disponibles para este servicio
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Date & Time Selection */}
                {activeStep === 'datetime' && (
                  <div className="space-y-6">
                    <div>
                      <button 
                        onClick={handleBackToStaff}
                        className="flex items-center text-[#0C9383] mb-4"
                      >
                        <ChevronRight className="rotate-180 mr-1" size={18} />
                        Volver a Profesionales
                      </button>
                      
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-[#0C9383] to-[#28edf0] bg-clip-text text-transparent mb-2">
                        Selecciona Fecha y Hora
                      </h2>
                      <p className="text-gray-600">
                        Elige el momento perfecto para tu experiencia
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <Calendar size={16} className="mr-2 text-[#0C9383]" />
                          Fecha
                        </label>
                        <DatePicker
                          selected={selectedDate}
                          onChange={handleDateChange}
                          filterDate={filterDate}
                          minDate={addDays(new Date(), 1)}
                          maxDate={addDays(new Date(), 30)}
                          placeholderText="Selecciona una fecha"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                          required
                          inline
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <Clock size={16} className="mr-2 text-[#0C9383]" />
                          Hora
                        </label>
                        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
                          {availableTimes.map((time) => (
                            <motion.button
                              key={time}
                              type="button"
                              onClick={() => setSelectedTime(time)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`py-2 px-3 rounded-lg text-center transition-all ${
                                selectedTime === time
                                  ? "bg-[#0C9383] text-white shadow-md"
                                  : "bg-gray-100 hover:bg-gray-200"
                              }`}
                            >
                              {time}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    {(selectedService || selectedStaff || selectedDate || selectedServices.length > 0) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[#F8FAF4] p-6 rounded-xl border border-[#0C9383]/20 mt-6"
                      >
                        <h3 className="text-lg font-semibold text-[#2F3E2E] mb-4">Resumen de tu Cita</h3>
                        
                        {/* Servicios seleccionados */}
                        {selectedServices.length > 0 && (
                          <div className="mb-4 pb-4 border-b border-[#0C9383]/10">
                            <h4 className="text-sm font-medium text-[#2F3E2E]">Servicios adicionales</h4>
                            <div className="space-y-3 mt-2">
                              {selectedServices.map((service) => (
                                <div key={service.id} className="flex items-start gap-3">
                                  <div className="w-16 h-16 rounded-md overflow-hidden">
                                    <img 
                                      src={service.imageUrl} 
                                      alt={service.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-[#2F3E2E] font-medium">{service.name}</p>
                                    <div className="flex gap-4 mt-1">
                                      <span className="text-xs text-[#0C9383] flex items-center">
                                        <Clock size={12} className="mr-1" />
                                        {service.duration} min
                                      </span>
                                      <span className="text-xs font-bold text-[#0C9383]">
                                        ${service.price}
                                      </span>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => handleRemoveService(service.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {currentService && (
                          <div className="mb-4 pb-4 border-b border-[#0C9383]/10">
                            <h4 className="text-sm font-medium text-[#2F3E2E]">Servicio actual</h4>
                            <div className="flex items-start gap-3 mt-2">
                              <div className="w-16 h-16 rounded-md overflow-hidden">
                                <img 
                                  src={currentService.imageUrl} 
                                  alt={currentService.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="text-[#2F3E2E] font-medium">{currentService.name}</p>
                                <div className="flex gap-4 mt-1">
                                  <span className="text-xs text-[#0C9383] flex items-center">
                                    <Clock size={12} className="mr-1" />
                                    {currentService.duration} min
                                  </span>
                                  <span className="text-xs font-bold text-[#0C9383]">
                                    ${currentService.price}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {currentStaff && (
                          <div className="mb-4 pb-4 border-b border-[#0C9383]/10">
                            <h4 className="text-sm font-medium text-[#2F3E2E]">Profesional</h4>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="w-12 h-12 rounded-full overflow-hidden">
                                {currentStaff.imageUrl ? (
                                  <img 
                                    src={currentStaff.imageUrl} 
                                    alt={currentStaff.displayName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[#0C9383]">
                                    <UserCheck size={16} />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-[#2F3E2E] font-medium">{currentStaff.displayName}</p>
                                <p className="text-xs text-[#0C9383]">{currentStaff.specialty}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {selectedDate && selectedTime && (
                          <div>
                            <h4 className="text-sm font-medium text-[#2F3E2E]">Fecha & Hora</h4>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="w-10 h-10 bg-[#0C9383]/10 rounded-full flex items-center justify-center text-[#0C9383]">
                                <Calendar size={16} />
                              </div>
                              <p className="text-[#2F3E2E] font-medium">
                                {format(selectedDate, 'PPP')} a las {selectedTime}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Total */}
                        <div className="mt-4 pt-4 border-t border-[#0C9383]/20">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-[#2F3E2E]">Total:</span>
                            <span className="text-xl font-bold text-[#0C9383]">
                              ${calculateTotal().toFixed(2)}
                            </span>
                          </div>
                          {selectedDate && differenceInHours(selectedDate, new Date()) > 48 && (
                            <div className="text-sm text-green-600 mt-1">
                              ¡Paga online ahora y obtén un 15% de descuento!
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3 mt-6">
                          {selectedServices.length > 0 && (
                            <button
                              onClick={handleAddAnotherService}
                              className="flex-1 bg-white border border-[#0C9383] text-[#0C9383] py-3 rounded-xl font-medium hover:bg-[#0C9383]/10 transition"
                            >
                              Agregar Otro Servicio
                            </button>
                          )}
                          <button
                            onClick={handleProceedToPayment}
                            disabled={!selectedDate || !selectedTime}
                            className={`flex-1 py-3 rounded-xl text-white font-medium shadow-lg transition-all duration-300 ${
                              selectedDate && selectedTime
                                ? 'bg-gradient-to-r from-[#0C9383] to-[#99D4D6] hover:from-[#0C9383]/90 hover:to-[#99D4D6]/90 hover:shadow-xl'
                                : 'bg-gray-300 cursor-not-allowed'
                            }`}
                          >
                            Continuar al Pago
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Payment Selection */}
                {activeStep === 'payment' && (
                  <div className="space-y-6">
                    <div>
                      <button 
                        onClick={handleBackToDatetime}
                        className="flex items-center text-[#0C9383] mb-4"
                      >
                        <ChevronRight className="rotate-180 mr-1" size={18} />
                        Volver a fecha y hora
                      </button>
                      
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-[#0C9383] to-[#28edf0] bg-clip-text text-transparent mb-2">
                        Método de Pago
                      </h2>
                      <p className="text-gray-600">
                        Selecciona cómo deseas pagar por tu reserva
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                          paymentMethod === 'web' 
                            ? 'border-[#0C9383] bg-[#0C9383]/10'
                            : 'border-gray-200 hover:border-[#0C9383]/50'
                        }`}
                        onClick={() => setPaymentMethod('web')}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            paymentMethod === 'web' ? 'bg-[#0C9383] text-white' : 'bg-gray-100 text-[#0C9383]'
                          }`}>
                            <CreditCard size={20} />
                          </div>
                          <h3 className="text-xl font-semibold">Pago Online</h3>
                        </div>
                        <ul className="space-y-2 text-gray-600">
                          <li className="flex items-start">
                            <Check className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                            <span>15% de descuento si pagas ahora</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                            <span>Solo tarjeta de débito</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                            <span>Recibirás comprobante por email</span>
                          </li>
                        </ul>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                          paymentMethod === 'onsite' 
                            ? 'border-[#0C9383] bg-[#0C9383]/10'
                            : 'border-gray-200 hover:border-[#0C9383]/50'
                        }`}
                        onClick={() => setPaymentMethod('onsite')}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            paymentMethod === 'onsite' ? 'bg-[#0C9383] text-white' : 'bg-gray-100 text-[#0C9383]'
                          }`}>
                            <UserCheck size={20} />
                          </div>
                          <h3 className="text-xl font-semibold">Pago en el Local</h3>
                        </div>
                        <ul className="space-y-2 text-gray-600">
                          <li className="flex items-start">
                            <Check className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                            <span>Paga cuando llegues al spa</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                            <span>Efectivo o tarjeta</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                            <span>Precio de lista sin descuento</span>
                          </li>
                        </ul>
                      </motion.div>
                    </div>

                    {/* Card Details Form */}
                    {paymentMethod === 'web' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="mt-6 bg-gray-50 p-6 rounded-xl"
                      >
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <CreditCard className="w-5 h-5 text-[#0C9383] mr-2" />
                          Detalles de la Tarjeta
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Tarjeta</label>
                            <input
                              type="text"
                              placeholder="1234 5678 9012 3456"
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                              value={cardDetails.number}
                              onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Expiración</label>
                              <input
                                type="text"
                                placeholder="MM/AA"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                                value={cardDetails.expiry}
                                onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                              <input
                                type="text"
                                placeholder="123"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                                value={cardDetails.cvv}
                                onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Payment Summary */}
                    <div className="bg-[#F8FAF4] p-6 rounded-xl border border-[#0C9383]/20 mt-6">
                      <h3 className="text-lg font-semibold text-[#2F3E2E] mb-4">Resumen de Pago</h3>
                      
                      <div className="space-y-3 mb-4">
                        {selectedServices.map((service) => (
                          <div key={service.id} className="flex justify-between">
                            <span>{service.name}</span>
                            <span className="font-medium">${service.price}</span>
                          </div>
                        ))}
                        {currentService && (
                          <div className="flex justify-between">
                            <span>{currentService.name}</span>
                            <span className="font-medium">${currentService.price}</span>
                          </div>
                        )}
                      </div>

                      {paymentMethod === 'web' && selectedDate && differenceInHours(selectedDate, new Date()) > 48 && (
                        <div className="flex justify-between py-2 border-t border-b border-[#0C9383]/20">
                          <span className="text-green-600">Descuento (15%)</span>
                          <span className="text-green-600 font-medium">
                            -${((selectedServices.reduce((sum, s) => sum + s.price, currentService?.price || 0)) * 0.15).toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between mt-4 pt-2 border-t border-[#0C9383]/20">
                        <span className="font-semibold">Total a pagar</span>
                        <span className="text-xl font-bold text-[#0C9383]">
                          ${calculateTotal().toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={handlePaymentSubmit}
                        disabled={!paymentMethod || (paymentMethod === 'web' && (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv))}
                        className={`w-full mt-6 py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all duration-300 ${
                          paymentMethod && (paymentMethod === 'onsite' || (cardDetails.number && cardDetails.expiry && cardDetails.cvv))
                            ? 'bg-gradient-to-r from-[#0C9383] to-[#99D4D6] hover:from-[#0C9383]/90 hover:to-[#99D4D6]/90 hover:shadow-xl'
                            : 'bg-gray-300 cursor-not-allowed'
                        }`}
                      >
                        {submitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                              className="inline-block"
                            >
                              <Clock className="h-5 w-5" />
                            </motion.span>
                            Procesando...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            {paymentMethod === 'web' ? 'Pagar Ahora' : 'Confirmar Reserva'} <ArrowRight size={20} />
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <Check className="h-10 w-10 text-[#0C9383]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {paymentMethod === 'web' ? '¡Pago Exitoso!' : '¡Cita Confirmada!'}
                </h3>
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden">
                    <img 
                      src={currentService?.imageUrl || "https://img.freepik.com/free-photo/spa-massage-therapist-hands-client-back_23-2151454821.jpg"} 
                      alt="Servicio"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <p className="text-gray-600 mb-6">
                  {paymentMethod === 'web' ? (
                    <>
                      Tu pago de <span className="font-bold">${calculateTotal().toFixed(2)}</span> ha sido procesado. 
                      Hemos enviado el comprobante a <span className="font-bold">{currentUser?.email}</span>.
                    </>
                  ) : (
                    `Tu reserva ha sido confirmada. Por favor paga al llegar al spa.`
                  )}
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/appointments')}
                    className="w-full bg-[#0C9383] text-white py-3 rounded-lg font-medium hover:bg-[#0C9383]/90 transition"
                  >
                    Ver Mis Citas
                  </button>
                  <button
                    onClick={() => {
                      setShowSuccess(false);
                      setSelectedService('');
                      setSelectedStaff('');
                      setSelectedDate(null);
                      setSelectedTime('');
                      setSelectedServices([]);
                      setPaymentMethod(null);
                      setActiveStep('services');
                    }}
                    className="w-full border border-[#0C9383] text-[#0C9383] py-3 rounded-lg font-medium hover:bg-[#0C9383]/10 transition"
                  >
                    Reservar Otro Servicio
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookAppointment;