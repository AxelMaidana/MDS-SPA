import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Calendar, Clock, DollarSign, User, X, Filter, Loader } from 'lucide-react';

interface Appointment {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  staffId: string;
  staffName: string;
  date: {
    seconds: number;
    nanoseconds: number;
  };
  status: 'booked' | 'completed' | 'cancelled';
}

const Appointments = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'booked' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!currentUser) return;

      try {
        const q = query(
          collection(db, 'appointments'),
          where('userId', '==', currentUser.uid),
          orderBy('date', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const appointmentsData: Appointment[] = [];
        
        querySnapshot.forEach((doc) => {
          appointmentsData.push({
            id: doc.id,
            ...doc.data()
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
  }, [currentUser]);

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredAppointments(appointments);
    } else {
      setFilteredAppointments(appointments.filter(app => app.status === activeFilter));
    }
  }, [activeFilter, appointments]);

  const cancelAppointment = async (id: string) => {
    if (!currentUser) return;
    
    try {
      setCancellingId(id);
      // Eliminar completamente de la base de datos
      await deleteDoc(doc(db, 'appointments', id));
      
      // Actualizar estado local
      setAppointments(prev => prev.filter(appointment => appointment.id !== id));
      
      toast.success('Cita cancelada exitosamente');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Error al cancelar la cita');
    } finally {
      setCancellingId(null);
    }
  };

  const getAppointmentDate = (appointment: Appointment) => {
    if (!appointment.date) return 'Fecha inválida';
    const date = new Date(appointment.date.seconds * 1000);
    return format(date, 'PPP'); // Formato legible "May 1st, 2023"
  };

  const getAppointmentTime = (appointment: Appointment) => {
    if (!appointment.date) return 'Hora inválida';
    const date = new Date(appointment.date.seconds * 1000);
    return format(date, 'h:mm a');
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'booked': return 'Reservada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };
  
  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Citas</h1>
            <p className="text-gray-600">Administra tus citas programadas en el spa</p>
          </div>
          <Link 
            to="/book" 
            className="mt-4 md:mt-0 bg-[#0C9383] hover:bg-[#0C9383]/90 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Reservar Nueva Cita
          </Link>
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
            <Link 
              to="/book" 
              className="bg-[#0C9383] hover:bg-[#0C9383]/90 text-white px-6 py-2 rounded-lg inline-block transition-colors"
            >
              Reserva tu primera cita
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {/* Vista de tarjetas para móviles */}
            <div className="md:hidden space-y-4">
              {filteredAppointments.map((appointment) => (
                <div key={appointment.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{appointment.serviceName}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <DollarSign size={14} className="mr-1" />
                        ${appointment.servicePrice}
                        <span className="mx-2">•</span>
                        <Clock size={14} className="mr-1" />
                        {appointment.serviceDuration} min
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(appointment.status)}`}>
                      {getStatusText(appointment.status)}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-500 mr-3" />
                      <div>
                        <p className="text-gray-900">{getAppointmentDate(appointment)}</p>
                        <p className="text-sm text-gray-500">{getAppointmentTime(appointment)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <User size={16} className="text-gray-500 mr-3" />
                      <p className="text-gray-900">{appointment.staffName}</p>
                    </div>
                  </div>
                  
                  {appointment.status === 'booked' && (
                    <button
                      onClick={() => cancelAppointment(appointment.id)}
                      disabled={cancellingId === appointment.id}
                      className="mt-4 w-full flex items-center justify-center text-red-600 hover:text-red-800 py-2 border border-red-200 rounded-lg transition-colors"
                    >
                      {cancellingId === appointment.id ? (
                        <>
                          <Loader className="animate-spin mr-2" size={16} />
                          Cancelando...
                        </>
                      ) : (
                        <>
                          <X size={16} className="mr-2" />
                          Cancelar Cita
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Vista de tabla para desktop */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Servicio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha & Hora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Especialista
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAppointments.map((appointment) => (
                      <tr key={appointment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{appointment.serviceName}</div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <DollarSign size={14} className="mr-1" />
                            ${appointment.servicePrice}
                            <span className="mx-2">•</span>
                            <Clock size={14} className="mr-1" />
                            {appointment.serviceDuration} min
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar size={16} className="mr-2 text-[#0C9383]" />
                            <div>
                              <div className="text-gray-900">{getAppointmentDate(appointment)}</div>
                              <div className="text-sm text-gray-500">{getAppointmentTime(appointment)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User size={16} className="mr-2 text-[#0C9383]" />
                            <span className="text-gray-900">{appointment.staffName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(appointment.status)}`}>
                            {getStatusText(appointment.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {appointment.status === 'booked' && (
                            <button
                              onClick={() => cancelAppointment(appointment.id)}
                              disabled={cancellingId === appointment.id}
                              className="text-red-600 hover:text-red-900 transition-colors flex items-center justify-end w-full"
                            >
                              {cancellingId === appointment.id ? (
                                <>
                                  <Loader className="animate-spin mr-2" size={16} />
                                  Cancelando...
                                </>
                              ) : (
                                <>
                                  <X size={16} className="mr-1" />
                                  Cancelar
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;