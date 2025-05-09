import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  category: string;
  imageUrl: string;
  featured?: boolean;
}

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesCollection = collection(db, 'services');
        const servicesSnapshot = await getDocs(servicesCollection);
        const servicesList = servicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Service[];
        
        // Agregar algunos servicios destacados (sin formatear el precio)
        const formattedServices = servicesList.map(service => ({
          ...service,
          featured: Math.random() > 0.7 // 30% de chance de ser destacado
        }));
        
        setServices(formattedServices );
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };

  const categories = [
    { id: "all", name: "Todos los Servicios" },
    { id: "massages", name: "Masajes" },
    { id: "facialTreatments", name: "Tratamientos Faciales" },
    { id: "groupServices", name: "En Grupo" },
    { id: "beauty", name: "Belleza" },
  ];

  const filteredServices = selectedCategory === "all" 
    ? services 
    : services.filter(service => service.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f3e9] to-[#e8f4f0]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#0C9383] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <main className="bg-gradient-to-br from-[#f8f3e9] to-[#e8f4f0] min-h-screen px-4 py-16 sm:px-6 lg:px-8"> 
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-b-2xl mb-16 lg:ml-16">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C9383]/80 to-[#99D4D6]/10 z-10"></div>
        <img
          src="https://img.freepik.com/free-photo/spa-massage-therapist-hands-client-back_23-2151454821.jpg"
          alt="Spa background"
          className="w-full h-96 object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center z-20 text-center px-4">
          <div>
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-white mb-4"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              Nuestros <span className="text-[#FFFDE1]">Servicios</span>
            </motion.h1>
            <motion.p 
              className="text-xl text-white/90 max-w-2xl mx-auto"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Descubre tratamientos diseñados para restaurar el equilibrio y realzar tu belleza natural
            </motion.p>
          </div>
        </div>
      </section>

      {/* Services Content */}
      <div className="max-w-7xl mx-auto">
        {/* Category Filters */}
        <motion.div 
          className="flex flex-wrap justify-center gap-3 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-2 rounded-full transition-all duration-300 ${
                selectedCategory === category.id
                  ? 'bg-[#0C9383] text-white'
                  : 'bg-white text-[#0C9383] hover:bg-[#0C9383]/10'
              }`}
            >
              {category.name}
            </button>
          ))}
        </motion.div>

        {/* Featured Services */}
        {services.some(s => s.featured) && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-[#2F3E2E] mb-6 text-center">Servicios Destacados</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {services.filter(service => service.featured).map((service, index) => (
                <motion.div
                  key={service.id}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row h-full"
                  whileHover={{ y: -5 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="md:w-1/2 h-64 md:h-auto">
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 md:w-1/2 flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-[#0C9383] mb-2">{service.name}</h3>
                      <p className="text-gray-600 mb-4">{service.description}</p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xl font-bold text-[#2F3E2E]">{formatPrice(service.price)}</span>
                      </div>
                      <button 
                        onClick={() => navigate(`/book`)}
                        className="w-full bg-gradient-to-r from-[#0C9383] to-[#99D4D6] text-white py-3 rounded-lg hover:opacity-90 transition"
                      >
                        Reservar Ahora
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* All Services Grid */}
        <h2 className="text-3xl font-bold text-[#2F3E2E] mb-8 text-center">
          {selectedCategory === "all" ? "Todos los Servicios" : categories.find(c => c.id === selectedCategory)?.name}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service, index) => (
            <motion.div
              key={service.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
              whileHover={{ y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <span className="text-white font-medium">{service.category.toUpperCase()}</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#2F3E2E] mb-2">{service.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-[#0C9383]">{formatPrice(service.price)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.section 
          className="mt-20 bg-[#0C9383] rounded-2xl p-8 md:p-12 text-center text-white"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-4">¿Listo para experimentar verdadera relajación?</h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-6">
            Nuestros especialistas te ayudarán a elegir el tratamiento perfecto para tus necesidades.
          </p>
          <button 
            onClick={() => navigate("/contact")}
            className="bg-white text-[#0C9383] px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition"
          >
            Contactar a Nuestros Especialistas
          </button>
        </motion.section>
      </div>
    </main>
  );
};

export default Services;