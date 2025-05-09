import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FaDownload, FaEnvelope, FaCalendarAlt, FaUser } from 'react-icons/fa';

interface JobApplication {
  id: string;
  email: string;
  cvUrl: string;
  status: 'pending' | 'reviewed' | 'contacted' | 'rejected';
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

const JobApplicationsList = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'contacted' | 'rejected'>('all');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const q = query(collection(db, 'spaApplications'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const apps = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as JobApplication[];

        setApplications(apps);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const filteredApplications = filter === 'all' 
    ? applications 
    : applications.filter(app => app.status === filter);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'pending': return 'Pendiente';
      case 'reviewed': return 'Revisado';
      case 'contacted': return 'Contactado';
      case 'rejected': return 'Rechazado';
      default: return status;
    }
  };

  if (loading) return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Solicitudes de Empleo</h1>
        
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            Todas
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-full ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            Pendientes
          </button>
          <button 
            onClick={() => setFilter('reviewed')}
            className={`px-4 py-2 rounded-full ${filter === 'reviewed' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            Revisadas
          </button>
          <button 
            onClick={() => setFilter('contacted')}
            className={`px-4 py-2 rounded-full ${filter === 'contacted' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            Contactadas
          </button>
          <button 
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-full ${filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            Rechazadas
          </button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total</h3>
            <p className="text-2xl font-bold">{applications.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Pendientes</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {applications.filter(a => a.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Contactadas</h3>
            <p className="text-2xl font-bold text-green-600">
              {applications.filter(a => a.status === 'contacted').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Rechazadas</h3>
            <p className="text-2xl font-bold text-red-600">
              {applications.filter(a => a.status === 'rejected').length}
            </p>
          </div>
        </div>

        {/* Lista de solicitudes */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.length > 0 ? (
                filteredApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <FaCalendarAlt className="mr-2 text-gray-400" />
                        {new Date(application.createdAt.seconds * 1000).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <FaUser className="text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            <FaEnvelope className="inline mr-1 text-gray-400" />
                            {application.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(application.status)}`}>
                        {getStatusText(application.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <a 
                        href={application.cvUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <FaDownload className="inline mr-1" /> CV
                      </a>
                      <button className="text-gray-600 hover:text-gray-900 mr-4">
                        Contactar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay solicitudes {filter !== 'all' ? `con estado ${getStatusText(filter)}` : ''}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default JobApplicationsList;