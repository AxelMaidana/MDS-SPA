import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, ChevronDown, ChevronUp, CheckCircle, XCircle, Printer, Clock, User, Mail, Phone, DollarSign, Info } from 'lucide-react';
import { format, isToday, isTomorrow, isPast, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Appointment {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  services: Service[];  // Cambiado de serviceName, servicePrice, serviceDuration a services array
  staffId: string;
  staffName: string;
  date: {
    seconds: number;
    nanoseconds: number;
  };
  status: 'booked' | 'completed' | 'cancelled';
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  };
  notes?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  discountApplied?: boolean;
  totalPrice?: number;
}

const StaffAppointmentsDashboard = () => {
  const { currentUser, userData } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'today' | 'upcoming' | 'past' | 'all'>('today');
  const [expandedAppointment, setExpandedAppointment] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Obtener las citas del staff
  useEffect(() => {
    if (!currentUser || !userData) return;

    const fetchAppointments = async () => {
      try {
        setLoading(true);
        
        const q = query(
          collection(db, 'appointments'),
          where('staffId', '==', userData.uid),
          orderBy('date', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const appointmentsData: Appointment[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          appointmentsData.push({
            id: doc.id,
            userId: data.userId,
            userEmail: data.userEmail,
            userName: data.userName,
            userPhone: data.userPhone,
            services: data.services || [],
            staffId: data.staffId,
            staffName: data.staffName,
            date: data.date.toDate(),
            status: data.status || 'booked',
            createdAt: data.createdAt.toDate(),
            notes: data.notes,
            paymentMethod: data.paymentMethod,
            paymentStatus: data.paymentStatus,
            discountApplied: data.discountApplied,
            totalPrice: data.totalPrice
          });
        });

        setAppointments(appointmentsData);
      } catch (error) {
        console.error('Error al obtener citas:', error);
        toast.error('Error al cargar citas');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [currentUser, userData]);

  const calculateDiscountedPrice = (appointment: Appointment) => {
    const basePrice = appointment.totalPrice || 
                     appointment.services.reduce((sum, service) => sum + service.price, 0);
    
    if (appointment.discountApplied && appointment.paymentMethod === 'web') {
      return basePrice * 0.85; // Aplica 15% de descuento
    }
    return basePrice;
  };

  // Filtrar citas
  const filteredAppointments = appointments.filter((appointment) => {
    const now = new Date();
    const appointmentDate = new Date(appointment.date);
    const matchesFilter = () => {
      switch (selectedFilter) {
        case 'today':
          return isToday(appointmentDate);
        case 'upcoming':
          return isFuture(appointmentDate) && !isToday(appointmentDate);
        case 'past':
          return isPast(appointmentDate) && !isToday(appointmentDate);
        default:
          return true;
      }
    };

    const matchesSearch = appointment.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (appointment.services.length > 0 && 
                          appointment.services.some(service => 
                            service.name.toLowerCase().includes(searchTerm.toLowerCase())));

    return matchesFilter() && matchesSearch;
  });

  // Formatear fechas
  const formatDate = (date: Date) => {
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    return format(date, 'PPP', { locale: es });
  };

  const formatTime = (date: Date) => format(date, 'hh:mm a', { locale: es });

  // Cambiar estado de la cita
  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      setAppointments(appointments.map(app => 
        app.id === appointmentId ? { ...app, status: newStatus } : app
      ));
      
      toast.success(`Cita ${newStatus === 'completed' ? 'completada' : 'cancelada'} con éxito`);
    } catch (error) {
      console.error('Error al actualizar cita:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  // Función para imprimir el turno
  const printAppointment = (appointment: Appointment) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Turno ${appointment.services[0]?.name || 'Servicio'}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap');
              
              body { 
                font-family: 'Quicksand', sans-serif;
                background-color: #f2f5e9;
                padding: 20px;
                color: #1F1F1F;
              }
              
              .ticket-container {
                max-width: 380px;
                margin: 0 auto;
                background: white;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.08);
              }
              
              .ticket-header {
                background: linear-gradient(135deg, #0C9383 0%, #01f891 100%);
                padding: 20px;
                text-align: center;
                color: white;
                position: relative;
              }
              
              .ticket-header::after {
                content: "";
                position: absolute;
                bottom: -15px;
                left: 0;
                right: 0;
                height: 30px;
                background: white;
                border-radius: 50% 50% 0 0 / 30px 30px 0 0;
              }
              
              .ticket-title {
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 5px;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              
              .ticket-subtitle {
                font-size: 14px;
                opacity: 0.9;
              }
              
              .ticket-body {
                padding: 30px 25px;
                position: relative;
              }
              
              .ticket-logo {
                position: absolute;
                top: -25px;
                right: 20px;
                width: 50px;
                height: 50px;
                background: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                z-index: 2;
              }
              
              .ticket-details {
                margin-bottom: 25px;
              }
              
              .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
                padding-bottom: 12px;
                border-bottom: 1px dashed #e0e0e0;
              }
              
              .detail-label {
                font-weight: 600;
                color: #0C9383;
                flex: 1;
              }
              
              .detail-value {
                flex: 1;
                text-align: right;
                font-weight: 500;
              }
              
              .ticket-qr {
                text-align: center;
                margin: 20px 0;
                padding: 15px;
                background: #f8f8f8;
                border-radius: 8px;
              }
              
              .ticket-footer {
                text-align: center;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                font-size: 12px;
                color: #666;
              }
              
              .ticket-number {
                background: #f2f5e9;
                padding: 8px 15px;
                border-radius: 20px;
                display: inline-block;
                font-weight: 700;
                color: #0C9383;
                margin-bottom: 15px;
              }
              
              .watermark {
                position: absolute;
                bottom: 10px;
                right: 10px;
                opacity: 0.1;
                font-size: 60px;
                font-weight: 700;
                color: #0C9383;
                transform: rotate(-15deg);
              }
              
              .payment-badge {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                margin-left: 8px;
              }
              
              .payment-web {
                background-color: #dcfce7;
                color: #166534;
              }
              
              .payment-onsite {
                background-color: #fef9c3;
                color: #854d0e;
              }
              
              @media print {
                body {
                  background: white !important;
                }
                .ticket-container {
                  box-shadow: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="ticket-container">
              <div class="ticket-header">
                <div class="ticket-title">${appointment.services[0]?.name || 'Servicio'}</div>
                <div class="ticket-subtitle">Turno ${appointment.status === 'completed' ? 'Completado' : 'Confirmado'}</div>
              </div>
              
              <div class="ticket-body">
                <div class="ticket-logo">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#0C9383"/>
                  </svg>
                </div>
                
                <div class="ticket-number">
                  #${appointment.id.slice(0, 8).toUpperCase()}
                </div>
                
                <div class="ticket-details">
                  <div class="detail-row">
                    <span class="detail-label">Cliente:</span>
                    <span class="detail-value">${appointment.userName}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Fecha:</span>
                    <span class="detail-value">${formatDate(appointment.date)}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Hora:</span>
                    <span class="detail-value">${formatTime(appointment.date)}</span>
                  </div>
                  ${appointment.services.map(service => `
                    <div class="detail-row">
                      <span class="detail-label">Servicio:</span>
                      <span class="detail-value">${service.name}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Duración:</span>
                      <span class="detail-value">${service.duration} min</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Precio:</span>
                      <span class="detail-value">$${service.price}</span>
                    </div>
                  `).join('')}
                  <div class="detail-row">
                    <span class="detail-label">Total:</span>
                    <span class="detail-value">${calculateDiscountedPrice(appointment)}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Pago:</span>
                    <span class="detail-value">
                      ${appointment.paymentMethod === 'web' ? 'Online' : 'En sitio'}
                      ${appointment.discountApplied ? ' (15% desc)' : ''}
                    </span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Estado pago:</span>
                    <span class="detail-value">
                      ${appointment.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
                
                <div class="ticket-qr">
                  <div style="margin-bottom: 10px;">Presentar este código al llegar</div>
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="120" height="120" fill="#f2f5e9"/>
                    <rect x="10" y="10" width="20" height="20" fill="#0C9383"/>
                    <rect x="40" y="10" width="20" height="20" fill="#0C9383"/>
                    <rect x="70" y="10" width="20" height="20" fill="#0C9383"/>
                    <rect x="10" y="40" width="20" height="20" fill="#0C9383"/>
                    <rect x="40" y="40" width="20" height="20" fill="#f2f5e9"/>
                    <rect x="70" y="40" width="20" height="20" fill="#0C9383"/>
                    <rect x="10" y="70" width="20" height="20" fill="#0C9383"/>
                    <rect x="40" y="70" width="20" height="20" fill="#0C9383"/>
                    <rect x="70" y="70" width="20" height="20" fill="#0C9383"/>
                    <rect x="90" y="10" width="20" height="20" fill="#01f891"/>
                    <rect x="90" y="40" width="20" height="20" fill="#01f891"/>
                    <rect x="90" y="70" width="20" height="20" fill="#01f891"/>
                    <rect x="10" y="90" width="20" height="20" fill="#01f891"/>
                    <rect x="40" y="90" width="20" height="20" fill="#01f891"/>
                    <rect x="70" y="90" width="20" height="20" fill="#01f891"/>
                  </svg>
                </div>
                
                <div class="ticket-footer">
                  <div style="margin-bottom: 8px; font-weight: 600;">Gracias por elegir nuestros servicios</div>
                  <div>Por favor llegue 10 minutos antes de su cita</div>
                </div>
                
                <div class="watermark">SERENITY</div>
              </div>
            </div>
            
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 200);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Mis Turnos
                <span className="ml-2 text-sm font-normal bg-[#0C9383] text-white px-2 py-1 rounded-full">
                  {filteredAppointments.length}
                </span>
              </h1>
              <p className="text-gray-600">Gestiona tus citas programadas</p>
            </div>
            
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Buscar por cliente o servicio..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <User size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y estadísticas */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {['today', 'upcoming', 'past', 'all'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter as 'today' | 'upcoming' | 'past' | 'all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedFilter === filter
                    ? 'bg-[#0C9383] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {filter === 'today' && 'Hoy'}
                {filter === 'upcoming' && 'Próximas'}
                {filter === 'past' && 'Pasadas'}
                {filter === 'all' && 'Todas'}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total</span>
                <span className="text-lg font-bold">{appointments.length}</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Hoy</span>
                <span className="text-lg font-bold">
                  {appointments.filter(app => isToday(app.date)).length}
                </span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Completadas</span>
                <span className="text-lg font-bold">
                  {appointments.filter(app => app.status === 'completed').length}
                </span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Canceladas</span>
                <span className="text-lg font-bold">
                  {appointments.filter(app => app.status === 'cancelled').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de citas */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0C9383]"></div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No hay citas {selectedFilter === 'today' ? 'para hoy' : 
              selectedFilter === 'upcoming' ? 'próximas' : 
              selectedFilter === 'past' ? 'pasadas' : 'registradas'}
            </h3>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200"
              >
                <div 
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedAppointment(
                    expandedAppointment === appointment.id ? null : appointment.id
                  )}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${
                      appointment.status === 'completed' ? 'bg-green-50 text-green-600' :
                      appointment.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                      isToday(appointment.date) ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      <Calendar size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {appointment.services[0]?.name || 'Servicio'}
                        {appointment.services.length > 1 && ` +${appointment.services.length - 1}`}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                        <span>{formatDate(appointment.date)}</span>
                        <span>•</span>
                        <span>{formatTime(appointment.date)}</span>
                        <span>•</span>
                        <span>
                          {appointment.services.reduce((sum, service) => sum + service.duration, 0)} min
                        </span>
                        {appointment.paymentMethod && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            appointment.paymentMethod === 'web' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {appointment.paymentMethod === 'web' ? 'Online' : 'En sitio'}
                            {appointment.discountApplied && ' (15% off)'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      appointment.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {appointment.status === 'completed' ? 'Completado' :
                       appointment.status === 'cancelled' ? 'Cancelado' :
                       isToday(appointment.date) ? 'Hoy' : 'Confirmado'}
                    </span>
                    {expandedAppointment === appointment.id ? (
                      <ChevronUp className="text-gray-400" size={20} />
                    ) : (
                      <ChevronDown className="text-gray-400" size={20} />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedAppointment === appointment.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 pb-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          {/* Detalles del servicio */}
                          <div>
                            <h4 className="text-md font-medium text-gray-500 mb-3 flex items-center">
                              <Info className="mr-2" size={18} />
                              Detalles del servicio
                            </h4>
                            <div className="space-y-3">
                              {appointment.services.map((service, index) => (
                                <div key={index} className="mb-4">
                                  <div className="flex justify-between mb-1">
                                    <span className="text-gray-500 flex items-center">
                                      <Clock className="mr-2" size={16} />
                                      Servicio {index + 1}:
                                    </span>
                                    <span className="font-medium">{service.name}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 flex items-center pl-6">
                                      Duración:
                                    </span>
                                    <span className="font-medium">{service.duration} min</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 flex items-center pl-6">
                                      Precio:
                                    </span>
                                    <span className="font-medium">${service.price}</span>
                                  </div>
                                </div>
                              ))}
                              <div className="flex justify-between pt-2 border-t border-gray-200">
                                <span className="text-gray-500 flex items-center">
                                  <DollarSign className="mr-2" size={16} />
                                  Total:
                                </span>
                                <span className="font-medium">
                                  ${calculateDiscountedPrice(appointment)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 flex items-center">
                                  <DollarSign className="mr-2" size={16} />
                                  Método pago:
                                </span>
                                <span className="font-medium">
                                  {appointment.paymentMethod === 'web' ? 'Online' : 'En sitio'}
                                  {appointment.discountApplied && ' (con descuento)'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 flex items-center">
                                  <DollarSign className="mr-2" size={16} />
                                  Estado pago:
                                </span>
                                <span className="font-medium">
                                  {appointment.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Información del cliente */}
                          <div>
                            <h4 className="text-md font-medium text-gray-500 mb-3 flex items-center">
                              <User className="mr-2" size={18} />
                              Información del cliente
                            </h4>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-500 flex items-center">
                                  <User className="mr-2" size={16} />
                                  Nombre:
                                </span>
                                <span className="font-medium">{appointment.userName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 flex items-center">
                                  <Mail className="mr-2" size={16} />
                                  Email:
                                </span>
                                <a href={`mailto:${appointment.userEmail}`} className="font-medium text-blue-600 hover:underline">
                                  {appointment.userEmail}
                                </a>
                              </div>
                              {appointment.userPhone && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500 flex items-center">
                                    <Phone className="mr-2" size={16} />
                                    Teléfono:
                                  </span>
                                  <a href={`tel:${appointment.userPhone}`} className="font-medium text-blue-600 hover:underline">
                                    {appointment.userPhone}
                                  </a>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-500 flex items-center">
                                  <Calendar className="mr-2" size={16} />
                                  Reservado el:
                                </span>
                                <span className="font-medium">
                                  {format(appointment.createdAt, 'PPPp', { locale: es })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Notas */}
                        {appointment.notes && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                              <Info className="mr-2" size={16} />
                              Notas adicionales
                            </h4>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                              {appointment.notes}
                            </p>
                          </div>
                        )}

                        {/* Acciones */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-500 mb-3">Acciones</h4>
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => printAppointment(appointment)}
                              className="flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200"
                            >
                              <Printer className="mr-2" size={16} />
                              Imprimir Turno
                            </button>
                            
                            {appointment.paymentMethod === 'onsite' && appointment.paymentStatus !== 'paid' && (
                              <button
                                onClick={() => updateDoc(doc(db, 'appointments', appointment.id), {
                                  paymentStatus: 'paid',
                                  updatedAt: new Date()
                                }).then(() => {
                                  setAppointments(appointments.map(app => 
                                    app.id === appointment.id ? { ...app, paymentStatus: 'paid' } : app
                                  ));
                                  toast.success('Pago marcado como completado');
                                })}
                                className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium hover:bg-green-200"
                              >
                                <CheckCircle className="mr-2" size={16} />
                                Marcar como Pagado
                              </button>
                            )}
                            
                            {(isToday(appointment.date) || isFuture(appointment.date)) && appointment.status === 'booked' && (
                              <>
                                <button
                                  onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                                  className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium hover:bg-green-200"
                                >
                                  <CheckCircle className="mr-2" size={16} />
                                  Completar
                                </button>
                                <button
                                  onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                                  className="flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200"
                                >
                                  <XCircle className="mr-2" size={16} />
                                  Cancelar
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffAppointmentsDashboard;