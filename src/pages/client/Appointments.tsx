import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { Calendar, Clock, DollarSign, User, X, Filter, Loader, CheckCircle, Printer, Info, ChevronUp, ChevronDown } from 'lucide-react';

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
  services: Service[];
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

const Appointments = () => {
  const { currentUser, userRole } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'booked' | 'completed' | 'cancelled'>('all');
  const [expandedAppointment, setExpandedAppointment] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        let q;
        
        if (userRole === 'admin') {
          // Si es admin, traer todos los turnos
          q = query(
            collection(db, 'appointments'),
            orderBy('date', 'desc')
          );
        } else {
          // Si es cliente, traer solo sus turnos
          q = query(
            collection(db, 'appointments'),
            where('userId', '==', currentUser.uid),
            orderBy('date', 'desc')
          );
        }
        
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
            date: data.date,
            status: data.status || 'booked',
            createdAt: data.createdAt,
            notes: data.notes,
            paymentMethod: data.paymentMethod,
            paymentStatus: data.paymentStatus,
            discountApplied: data.discountApplied,
            totalPrice: data.totalPrice
          } as Appointment);
        });
        
        setAppointments(appointmentsData);
        setFilteredAppointments(appointmentsData);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        toast.error('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [currentUser, userRole]);

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredAppointments(appointments);
    } else {
      setFilteredAppointments(appointments.filter(app => app.status === activeFilter));
    }
  }, [activeFilter, appointments]);

  const calculateDiscountedPrice = (appointment: Appointment) => {
    const basePrice = appointment.totalPrice || 
                     appointment.services.reduce((sum, service) => sum + service.price, 0);
    
    if (appointment.discountApplied && appointment.paymentMethod === 'web') {
      return basePrice * 0.85; // Aplica 15% de descuento
    }
    return basePrice;
  };

  const cancelAppointment = async (id: string) => {
    if (!currentUser) return;
    
    try {
      setCancellingId(id);
      await updateDoc(doc(db, 'appointments', id), {
        status: 'cancelled',
        updatedAt: new Date()
      });
      
      setAppointments(prev => prev.map(app => 
        app.id === id ? { ...app, status: 'cancelled' } : app
      ));
      
      toast.success('Cita cancelada exitosamente');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Error al cancelar la cita');
    } finally {
      setCancellingId(null);
    }
  };

  const completeAppointment = async (id: string) => {
    try {
      await updateDoc(doc(db, 'appointments', id), {
        status: 'completed',
        updatedAt: new Date()
      });
      
      setAppointments(prev => prev.map(app => 
        app.id === id ? { ...app, status: 'completed' } : app
      ));
      
      toast.success('Cita marcada como completada');
    } catch (error) {
      console.error('Error completing appointment:', error);
      toast.error('Error al completar la cita');
    }
  };

  const getAppointmentDate = (appointment: Appointment) => {
    if (!appointment.date) return 'Fecha inválida';
    const date = new Date(appointment.date.seconds * 1000);
    return format(date, 'PPP', { locale: es });
  };

  const getAppointmentTime = (appointment: Appointment) => {
    if (!appointment.date) return 'Hora inválida';
    const date = new Date(appointment.date.seconds * 1000);
    return format(date, 'hh:mm a', { locale: es });
  };

  const getCreatedAtDate = (appointment: Appointment) => {
    if (!appointment.createdAt) return 'Fecha inválida';
    const date = new Date(appointment.createdAt.seconds * 1000);
    return format(date, 'PPPp', { locale: es });
  };

  // const getStatusClass = (status: string) => {
  //   switch (status) {
  //     case 'booked':
  //       return 'bg-blue-100 text-blue-800';
  //     case 'completed':
  //       return 'bg-green-100 text-green-800';
  //     case 'cancelled':
  //       return 'bg-red-100 text-red-800';
  //     default:
  //       return 'bg-gray-100 text-gray-800';
  //   }
  // };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'booked': return 'Reservada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

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
                    <span class="detail-value">${getAppointmentDate(appointment)}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Hora:</span>
                    <span class="detail-value">${getAppointmentTime(appointment)}</span>
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
                    <span class="detail-value">$${calculateDiscountedPrice(appointment)}</span>
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Citas</h1>
            <p className="text-gray-600">
              {userRole === 'admin' ? 'Administra todas las citas del spa' : 'Administra tus citas programadas en el spa'}
            </p>
          </div>
          {userRole === 'client' && (
            <Link 
              to="/book" 
              className="mt-4 md:mt-0 bg-[#0C9383] hover:bg-[#0C9383]/90 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Reservar Nueva Cita
            </Link>
          )}
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-full flex items-center ${activeFilter === 'all' ? 'bg-[#0C9383] text-white' : 'bg-white text-gray-700 border'}`}
          >
            <Filter size={16} className="mr-2" />
            Todas
          </button>
          <button
            onClick={() => setActiveFilter('booked')}
            className={`px-4 py-2 rounded-full ${activeFilter === 'booked' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            Reservadas
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-4 py-2 rounded-full ${activeFilter === 'completed' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            Completadas
          </button>
          <button
            onClick={() => setActiveFilter('cancelled')}
            className={`px-4 py-2 rounded-full ${activeFilter === 'cancelled' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            Canceladas
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <Loader className="animate-spin mx-auto text-[#0C9383] mb-4" size={48} />
            <p className="text-gray-600">Cargando tus citas...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-800 mb-2">
              {activeFilter === 'all' ? 'No tienes citas' : `No hay citas ${getStatusText(activeFilter).toLowerCase()}`}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeFilter === 'all' 
                ? 'No has reservado ninguna cita aún.' 
                : `No tienes citas ${getStatusText(activeFilter).toLowerCase()}.`}
            </p>
            {userRole === 'client' ? (
              <Link 
                to="/book" 
                className="bg-[#0C9383] hover:bg-[#0C9383]/90 text-white px-6 py-2 rounded-lg inline-block transition-colors"
              >
                Reserva tu primera cita
              </Link>
            ) : (
              <p className="text-gray-600">No hay citas para mostrar</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div 
                  className="p-6 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedAppointment(
                    expandedAppointment === appointment.id ? null : appointment.id
                  )}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${
                      appointment.status === 'completed' ? 'bg-green-50 text-green-600' :
                      appointment.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      <Calendar size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {appointment.services[0]?.name || 'Servicio'}
                        {appointment.services.length > 1 && ` +${appointment.services.length - 1}`}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                        {userRole === 'admin' && (
                          <>
                            <span className="font-medium text-gray-700">{appointment.userName}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{getAppointmentDate(appointment)}</span>
                        <span>•</span>
                        <span>{getAppointmentTime(appointment)}</span>
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
                      {getStatusText(appointment.status)}
                    </span>
                    {expandedAppointment === appointment.id ? (
                      <ChevronUp className="text-gray-400" size={20} />
                    ) : (
                      <ChevronDown className="text-gray-400" size={20} />
                    )}
                  </div>
                </div>

                {expandedAppointment === appointment.id && (
                  <div className="px-6 pb-6 border-t border-gray-200">
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

                      {/* Información del profesional */}
                      <div>
                        <h4 className="text-md font-medium text-gray-500 mb-3 flex items-center">
                          <User className="mr-2" size={18} />
                          Información del profesional
                        </h4>
                        <div className="space-y-3">
                          {userRole === 'admin' && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 flex items-center">
                                <User className="mr-2" size={16} />
                                Cliente:
                              </span>
                              <span className="font-medium">{appointment.userName}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500 flex items-center">
                              <User className="mr-2" size={16} />
                              Profesional:
                            </span>
                            <span className="font-medium">{appointment.staffName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 flex items-center">
                              <Calendar className="mr-2" size={16} />
                              Reservado el:
                            </span>
                            <span className="font-medium">
                              {appointment.createdAt ? getCreatedAtDate(appointment) : 'No disponible'}
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
                        
                        {appointment.status === 'booked' && (
                          <>
                            <button
                              onClick={() => completeAppointment(appointment.id)}
                              className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium hover:bg-green-200"
                            >
                              <CheckCircle className="mr-2" size={16} />
                              Marcar como Completada
                            </button>
                            <button
                              onClick={() => cancelAppointment(appointment.id)}
                              disabled={cancellingId === appointment.id}
                              className="flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200"
                            >
                              {cancellingId === appointment.id ? (
                                <>
                                  <Loader className="animate-spin mr-2" size={16} />
                                  Cancelando...
                                </>
                              ) : (
                                <>
                                  <X className="mr-2" size={16} />
                                  Cancelar Cita
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;