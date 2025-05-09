/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Users, Scissors, ArrowRight } from 'lucide-react';

interface DashboardCounts {
  clientes: number;
  servicios: number;
  citas: number;
  empleados: number;
}

interface CitaReciente {
  id: string;
  nombreCliente: string;
  nombreServicio: string;
  fecha: any;
  estado: string;
}

interface DatosGraficoTendencia {
  mes: string;
  citas: number;
}

interface DistribucionServicios {
  nombre: string;
  valor: number;
}

const AdminDashboard = () => {
  const [contadores, setContadores] = useState<DashboardCounts>({
    clientes: 0,
    servicios: 0,
    citas: 0,
    empleados: 0
  });
  const [citasRecientes, setCitasRecientes] = useState<CitaReciente[]>([]);
  const [tendenciaCitas, setTendenciaCitas] = useState<DatosGraficoTendencia[]>([]);
  const [distribucionServicios, setDistribucionServicios] = useState<DistribucionServicios[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerDatosDashboard = async () => {
      try {
        // Contar documentos en colecciones
        const queryClientes = query(collection(db, 'users'), where('role', '==', 'client'));
        const snapshotClientes = await getDocs(queryClientes);
        
        const queryEmpleados = query(collection(db, 'users'), where('role', '==', 'staff'));
        const snapshotEmpleados = await getDocs(queryEmpleados);
        
        const snapshotServicios = await getDocs(collection(db, 'services'));
        
        const snapshotCitas = await getDocs(collection(db, 'appointments'));
        
        // Obtener datos para gráfico de tendencia (últimos 6 meses)
        const ahora = new Date();
        const meses = [];
        for (let i = 5; i >= 0; i--) {
          const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
          meses.push({
            mes: fecha.toLocaleString('es-ES', { month: 'short' }),
            fechaInicio: fecha,
            fechaFin: new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0)
          });
        }
        
        // Obtener distribución de servicios
        const todasLasCitas = await getDocs(collection(db, 'appointments'));
        const conteoServicios: Record<string, number> = {};
        
        todasLasCitas.forEach(doc => {
          const servicio = doc.data().serviceName;
          conteoServicios[servicio] = (conteoServicios[servicio] || 0) + 1;
        });
        
        setContadores({
          clientes: snapshotClientes.size,
          servicios: snapshotServicios.size,
          citas: snapshotCitas.size,
          empleados: snapshotEmpleados.size
        });
        
        // Procesar datos para gráficos
        const datosTendencia = await Promise.all(meses.map(async mes => {
          const q = query(
            collection(db, 'appointments'),
            where('date', '>=', mes.fechaInicio),
            where('date', '<=', mes.fechaFin)
          );
          const snapshot = await getDocs(q);
          return {
            mes: mes.mes,
            citas: snapshot.size
          };
        }));
        
        setTendenciaCitas(datosTendencia);
        setDistribucionServicios(
          Object.entries(conteoServicios).map(([nombre, valor]) => ({
            nombre,
            valor
          }))
        );
        
        // Obtener citas recientes
        const queryCitasRecientes = query(
          collection(db, 'appointments'),
          orderBy('date', 'desc'),
          limit(5)
        );
        const snapshotCitasRecientes = await getDocs(queryCitasRecientes);
        const datosCitasRecientes: CitaReciente[] = [];
        
        snapshotCitasRecientes.forEach((doc) => {
          const datos = doc.data();
          datosCitasRecientes.push({
            id: doc.id,
            nombreCliente: datos.userName,
            nombreServicio: datos.serviceName,
            fecha: datos.date,
            estado: datos.status
          });
        });
        
        setCitasRecientes(datosCitasRecientes);
      } catch (error) {
        console.error('Error obteniendo datos:', error);
        // Usar datos de ejemplo si falla la conexión
        setContadores({
          clientes: 24,
          servicios: 8,
          citas: 42,
          empleados: 5
        });
        setTendenciaCitas([
          { mes: 'Ene', citas: 15 },
          { mes: 'Feb', citas: 20 },
          { mes: 'Mar', citas: 25 },
          { mes: 'Abr', citas: 22 },
          { mes: 'May', citas: 30 },
          { mes: 'Jun', citas: 35 }
        ]);
        setDistribucionServicios([
          { nombre: 'Masaje', valor: 45 },
          { nombre: 'Facial', valor: 25 },
          { nombre: 'Uñas', valor: 20 },
          { nombre: 'Cabello', valor: 10 }
        ]);
        setCitasRecientes(citasEjemplo);
      } finally {
        setCargando(false);
      }
    };

    obtenerDatosDashboard();
  }, []);

  const COLORS = ['#0EA5E9', '#6366F1', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6'];

  const formatearFecha = (cita: CitaReciente) => {
    if (!cita.fecha) return 'Fecha inválida';
    
    const fecha = new Date(cita.fecha.seconds * 1000);
    return fecha.toLocaleDateString('es-ES');
  };

  const obtenerClaseEstado = (estado: string) => {
    switch (estado) {
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

  const traducirEstado = (estado: string) => {
    switch (estado) {
      case 'booked': return 'Reservada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return estado;
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
          <p className="text-gray-600">
            Resumen estadístico y gestión de tu spa
          </p>
        </div>

        {cargando ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0C9383] mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos del dashboard...</p>
          </div>
        ) : (
          <>
            {/* Tarjetas de Estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Citas</h3>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar size={20} className="text-[#0C9383]" />
                  </div>
                </div>
                <p className="text-3xl font-semibold text-gray-900 mb-1">{contadores.citas}</p>
                <p className="text-sm text-gray-500">Total de citas</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Clientes</h3>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users size={20} className="text-[#0C9383]" />
                  </div>
                </div>
                <p className="text-3xl font-semibold text-gray-900 mb-1">{contadores.clientes}</p>
                <p className="text-sm text-gray-500">Clientes registrados</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Servicios</h3>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Scissors size={20} className="text-[#0C9383]" />
                  </div>
                </div>
                <p className="text-3xl font-semibold text-gray-900 mb-1">{contadores.servicios}</p>
                <p className="text-sm text-gray-500">Servicios disponibles</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Empleados</h3>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users size={20} className="text-[#0C9383]" />
                  </div>
                </div>
                <p className="text-3xl font-semibold text-gray-900 mb-1">{contadores.empleados}</p>
                <p className="text-sm text-gray-500">Equipo de trabajo</p>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-medium text-gray-800 mb-6">Tendencia de Citas</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={tendenciaCitas}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="mes" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip 
                        formatter={(value: number) => [`${value} citas`, 'Total']}
                        labelFormatter={(label) => `Mes: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="citas"
                        stroke="#0C9383"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-medium text-gray-800 mb-6">Distribución de Servicios</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribucionServicios}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="valor"
                        label={({ nombre, percent }) => `${nombre} ${(percent * 100).toFixed(0)}%`}
                      >
                        {distribucionServicios.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${value} citas`, 'Total']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Citas Recientes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-800">Citas Recientes</h3>
                  <Link to="/appointments" className="text-[#0C9383] hover:text-[#0C9383]/80 text-sm font-medium flex items-center">
                    Ver todas
                    <ArrowRight size={16} className="ml-1" />
                  </Link>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Servicio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {citasRecientes.map((cita) => (
                      <tr key={cita.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {cita.nombreCliente}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cita.nombreServicio}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatearFecha(cita)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${obtenerClaseEstado(cita.estado)}`}>
                            {traducirEstado(cita.estado)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link to="/admin/services" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
                <Scissors size={24} className="text-[#0C9383] mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">Administrar Servicios</h3>
                <p className="text-gray-600 text-sm flex-grow">Agrega, edita o elimina servicios del spa.</p>
                <div className="text-[#0C9383] mt-4 text-sm font-medium flex items-center">
                  Ir a Servicios
                  <ArrowRight size={16} className="ml-1" />
                </div>
              </Link>

              <Link to="/admin/staff" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
                <Users size={24} className="text-[#0C9383] mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">Solicitudes de Empleo</h3>
                <p className="text-gray-600 text-sm flex-grow">Revisa y gestiona candidatos para tu equipo.</p>
                <div className="text-[#0C9383] mt-4 text-sm font-medium flex items-center">
                  Ver Solicitudes
                  <ArrowRight size={16} className="ml-1" />
                </div>
              </Link>

              <Link to="/admin/users" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
                <Users size={24} className="text-[#0C9383] mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">Administrar Clientes</h3>
                <p className="text-gray-600 text-sm flex-grow">Visualiza y gestiona las cuentas de clientes.</p>
                <div className="text-[#0C9383] mt-4 text-sm font-medium flex items-center">
                  Ir a Clientes
                  <ArrowRight size={16} className="ml-1" />
                </div>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Datos de ejemplo para citas
const citasEjemplo = [
  {
    id: 'cita1',
    nombreCliente: 'Juan Pérez',
    nombreServicio: 'Masaje Relajante',
    fecha: { seconds: new Date().getTime() / 1000, nanoseconds: 0 },
    estado: 'booked'
  },
  {
    id: 'cita2',
    nombreCliente: 'María González',
    nombreServicio: 'Facial Rejuvenecedor',
    fecha: { seconds: new Date().getTime() / 1000 - 86400, nanoseconds: 0 },
    estado: 'completed'
  },
  {
    id: 'cita3',
    nombreCliente: 'Carlos López',
    nombreServicio: 'Manicura Premium',
    fecha: { seconds: new Date().getTime() / 1000 - 172800, nanoseconds: 0 },
    estado: 'cancelled'
  },
  {
    id: 'cita4',
    nombreCliente: 'Ana Martínez',
    nombreServicio: 'Depilación Facial',
    fecha: { seconds: new Date().getTime() / 1000 - 259200, nanoseconds: 0 },
    estado: 'booked'
  },
  {
    id: 'cita5',
    nombreCliente: 'Luisa Rodríguez',
    nombreServicio: 'Pedicura Spa',
    fecha: { seconds: new Date().getTime() / 1000 - 345600, nanoseconds: 0 },
    estado: 'completed'
  }
];

export default AdminDashboard;