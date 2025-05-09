import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion } from 'framer-motion';
import { Star, Clock, Award, Users } from 'lucide-react';
import '../styles/index.css';

interface Servicio {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  imageUrl: string;
}

// Animaciones reutilizables
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1 } }
};

const slideUp = {
  hidden: { y: 50, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.8 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const Home = () => {
  const [serviciosDestacados, setServiciosDestacados] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const obtenerServicios = async () => {
      try {
        const q = query(collection(db, 'services'), limit(3));
        const querySnapshot = await getDocs(q);
        const datosServicios: Servicio[] = [];
        
        querySnapshot.forEach((doc) => {
          datosServicios.push({
            id: doc.id,
            ...doc.data()
          } as Servicio);
        });
        
        setServiciosDestacados(datosServicios);
      } catch (error) {
        console.error('Error al obtener servicios:', error);
        // Usar datos de ejemplo si falla la obtención
        setServiciosDestacados(serviciosEjemplo);
      } finally {
        setCargando(false);
      }
    };

    obtenerServicios();
  }, []);

  return (
    <main className="bg-[#f2f5e9] text-white min-h-screen tipo-quicksand overflow-hidden">

      {/* Sección Hero */}
      <section
        className="relative bg-center bg-cover bg-no-repeat px-5 lg:pl-20 xl:px-40 py-40 lg:py-60"
        style={{ backgroundImage: "url('/home.jpg')" }}
      >
        <div className="absolute inset-0 bg-black opacity-40 z-0" />

        <motion.div 
          className="relative z-10 flex flex-col"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div className="flex w-full" variants={slideUp}>
            <div className="md:w-full font-bold leading-tight">
              <h1 className="mb-4">
                <motion.span 
                  className="block text-3xl sm:text-4xl md:text-5xl"
                  variants={slideUp}
                >
                  Eleva tu
                </motion.span>
                <motion.span 
                  className="block pl-1 tipo-dancing text-7xl sm:text-7xl md:text-8xl xl:text-9xl bg-gradient-to-r from-[#67ffed] to-[#01f891] bg-clip-text text-transparent"
                  variants={slideUp}
                >
                  Experiencia de Spa
                </motion.span>
              </h1>
            </div>
          </motion.div>
        </motion.div>

        {/* Imagen con animación flotante */}
        <motion.div 
          className="absolute right-0 -bottom-15 md:-bottom-28 lg:right-0 lg:-bottom-28 xl:right-0 xl:-bottom-50 2xl:right-0 2xl:-bottom-50 max-w-100 z-10"
          initial={{ y: 50, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
            transition: { 
              delay: 0.5,
              y: { 
                type: "spring", 
                damping: 10, 
                stiffness: 100 
              } 
            } 
          }}
        >
          <div className="relative">
            <motion.img
              src="primera.png"
              alt="Tratamiento de spa"
              className="w-40 md:w-60 lg:w-80 xl:w-80 z-20"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            />
          </div>
        </motion.div>

        <div className="absolute bottom-0 left-0 w-full h-24 z-0 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-t from-[#F2F5E9] to-transparent" />
        </div>
      </section>

      {/* Sección Sobre Nosotros */}
      <section className="px-5 lg:pl-20 xl:px-40 py-16 relative">
        <motion.h2 
          className="text-6xl font-bold mb-6 text-[#1F1F1F] tipo-quicksand"
          initial={{ x: -50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Sobre Nosotros
        </motion.h2>
        
        <motion.div 
          className="max-w-3xl"
          initial="hidden"
          whileInView="visible"
          variants={staggerContainer}
          viewport={{ once: true }}
        >
          <motion.p className="text-gray-500 mb-6" variants={fadeIn}>
            En Sentirse Bien Spa, nos comprometemos a usar ingredientes y técnicas premium. Nuestros tratamientos están
            diseñados para brindarte una experiencia relajante y efectiva que mejora tu bienestar físico y mental.
          </motion.p>
          <motion.a 
            onClick={() => navigate("/about")} 
            className="text-[#1F1F1F] font-medium underline cursor-pointer"
            variants={fadeIn}
            whileHover={{ scale: 1.05 }}
          >
            Conoce Más
          </motion.a>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10"
          initial="hidden"
          whileInView="visible"
          variants={staggerContainer}
          viewport={{ once: true }}
        >
          <motion.div 
            className="rounded-2xl overflow-hidden shadow-xl"
            variants={slideUp}
            whileHover={{ y: -10 }}
          >
            <img
              src="primeraAboutSection.jpg"
              alt="Tratamiento de spa"
              width={300}
              height={200}
              className="w-full h-48 object-bottom object-cover"
            />
          </motion.div>

          <motion.div 
            className="rounded-2xl relative shadow-xl"
            variants={slideUp}
            whileHover={{ y: -10 }}
          >
            <img
              src="segundaAboutSection.jpg"
              alt="Tratamiento facial"
              width={300}
              height={200}
              className="w-full h-48 object-top object-cover rounded-2xl"
            />
            <motion.div 
              className="absolute -bottom-20 right-5 xl:right-20 bg-[#24A498]/70 backdrop-blur-sm rounded-2xl shadow-xl p-4 w-64 z-10"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1, type: "spring" }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#99D4D6] flex items-center justify-center text-white text-xs font-bold">
                  LA
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Dra. Ana Felicidad</p>
                  <p className="text-xs text-white/80">Fundadora, CEO</p>
                </div>
              </div>
              <hr className="border-gray-500 border-t-[1px] opacity-30 my-2" />
              <p className="text-sm text-gray-100">
                "La belleza comienza en el momento en que decides ser tú misma." - Coco Chanel
              </p>
            </motion.div>
          </motion.div>

          <motion.div 
            className="rounded-2xl overflow-hidden shadow-xl"
            variants={slideUp}
            whileHover={{ y: -10 }}
          >
            <img
              src="terceraAboutSection.jpg"
              alt="Masaje con piedras calientes"
              width={300}
              height={200}
              className="w-full h-48 object-cover"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Sección Por Qué Elegirnos */}
      <section className="px-5 lg:pl-20 xl:px-40 py-16 relative">
        <motion.h2 
          className="text-6xl font-bold mb-6 text-[#1F1F1F] tipo-quicksand"
          initial={{ x: -50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Por Qué Elegirnos
        </motion.h2>
        
        <motion.div 
          className="max-w-3xl"
          initial="hidden"
          whileInView="visible"
          variants={staggerContainer}
          viewport={{ once: true }}
        >
          <motion.p className="text-gray-500 mb-6" variants={fadeIn}>
            En Serenity Spa, estamos comprometidos a usar ingredientes y técnicas premium. Nuestros tratamientos están
            diseñados para brindarte una experiencia relajante y efectiva que mejora tu bienestar físico y mental.
          </motion.p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-10"
          initial="hidden"
          whileInView="visible"
          variants={staggerContainer}
          viewport={{ once: true }}
        >
          <motion.div 
            className="card text-center transform transition hover:-translate-y-2 bg-white p-6 rounded-xl shadow-xl"
            variants={slideUp}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <Star size={28} />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[#1F1F1F]">Experiencia Premium</h3>
            <p className="text-secondary-600">
              Tratamientos de lujo utilizando solo los mejores productos y técnicas.
            </p>
          </motion.div>

          <motion.div 
            className="card text-center transform transition hover:-translate-y-2 bg-white p-6 rounded-xl shadow-xl"
            variants={slideUp}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <Award size={28} />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[#1F1F1F]">Expertos Certificados</h3>
            <p className="text-secondary-600">
              Nuestro equipo está formado por profesionales altamente capacitados y certificados.
            </p>
          </motion.div>

          <motion.div 
            className="card text-center transform transition hover:-translate-y-2 bg-white p-6 rounded-xl shadow-xl"
            variants={slideUp}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <Users size={28} />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[#1F1F1F]">Atención Personalizada</h3>
            <p className="text-secondary-600">
              Tratamientos adaptados a tus necesidades y preferencias específicas.
            </p>
          </motion.div>

          <motion.div 
            className="card text-center transform transition hover:-translate-y-2 bg-white p-6 rounded-xl shadow-xl"
            variants={slideUp}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <Clock size={28} />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[#1F1F1F]">Horarios Flexibles</h3>
            <p className="text-secondary-600">
              Reserva fácil en línea con citas disponibles los 7 días de la semana.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Sección de Servicios */}
      <section className="px-5 lg:pl-20 xl:px-40 py-10 relative">
        <motion.div 
          className="flex items-center w-full"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center w-full gap-4">
            <motion.span 
              className="text-4xl md:text-6xl font-bold text-[#1F1F1F] whitespace-nowrap"
              initial={{ x: -50 }}
              whileInView={{ x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Nuestros
            </motion.span>

            <div className="flex-1 flex items-center">
              <hr className="w-full border-gray-400 border-t-[1px] opacity-30 mt-3" />
              <motion.img
                src="flower.png"
                alt="Decoración floral"
                width={160}
                height={160}
                className="-ml-2 w-20 h-20 object-cover rounded-full"
                initial={{ rotate: -30, scale: 0.8 }}
                whileInView={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring" }}
                viewport={{ once: true }}
              />
            </div>
          </div>
        </motion.div>

        <motion.h2 
          className="text-4xl md:text-6xl font-bold text-[#1F1F1F] md:-mt-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <span className="bg-gradient-to-r from-[#0C9383] to-[#01f891] bg-clip-text text-transparent">
            Servicios
          </span>{" "}
          <span className="tipo-quicksand">Destacados</span>
        </motion.h2>

        {cargando ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin">
              <svg className="w-8 h-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10"
            initial="hidden"
            whileInView="visible"
            variants={staggerContainer}
            viewport={{ once: true }}
          >
            {(serviciosDestacados.length > 0 ? serviciosDestacados : serviciosEjemplo).map((servicio) => (
              <motion.div 
                key={servicio.id}
                className="bg-white rounded-xl overflow-hidden shadow-xl"
                variants={slideUp}
                whileHover={{ y: -10 }}
              >
                <img
                  src={servicio.imageUrl}
                  alt={servicio.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-[#1F1F1F]">{servicio.name}</h3>
                  <p className="text-gray-600 mb-4">{servicio.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-[#0C9383] font-bold">${servicio.price}</span>
                    <span className="text-gray-500">{servicio.duration} min</span>
                  </div>
                  <motion.button
                    onClick={() => navigate(`/book`)}
                    className="mt-4 w-full bg-[#0C9383] text-white py-2 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Reservar Ahora
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="text-center mt-12">
          <motion.button
            onClick={() => navigate("/services")}
            className="inline-block border border-[#0C9383] text-[#1F1F1F] hover:bg-[#0C9383] hover:text-white transition-colors duration-300 px-8 py-3 tracking-widest text-md cursor-pointer rounded-xl"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 15px rgba(12, 147, 131, 0.5)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            Ver Todos los Servicios
          </motion.button>
        </div>
      </section>

      {/* Sección Beneficios */}
      <section className="px-5 lg:pl-20 xl:px-40 py-10 relative"> 
        <motion.div 
          className="flex items-center w-full"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center w-full gap-4">
            <motion.span 
              className="text-4xl md:text-6xl font-bold text-[#1F1F1F] whitespace-nowrap"
              initial={{ x: -50 }}
              whileInView={{ x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Beneficios de Nuestro
            </motion.span>

            <div className="flex-1 flex items-center">
              <hr className="w-full border-gray-400 border-t-[1px] opacity-30 mt-3" />
              <motion.img
                src="flower.png"
                alt="Decoración floral"
                width={160}
                height={160}
                className="-ml-2 w-20 h-20 object-cover rounded-full"
                initial={{ rotate: 30, scale: 0.8 }}
                whileInView={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring" }}
                viewport={{ once: true }}
              />
            </div>
          </div>
        </motion.div>

        <motion.h2 
          className="text-4xl md:text-6xl font-bold text-[#1F1F1F] sm:-mt-6 -mt-0"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <span className="bg-gradient-to-r from-[#0C9383] to-[#01f891] bg-clip-text text-transparent">
            Cuidado Facial
          </span>{" "}
        </motion.h2>

        <motion.p 
          className="text-gray-400 max-w-xl mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          Estos beneficios no son simplemente promesas—son resultados reales que mejoran tu bienestar físico y mental.
          Experimenta la transformación a través de nuestros productos y tratamientos.
        </motion.p>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          variants={staggerContainer}
          viewport={{ once: true }}
        >
          <motion.div 
            className="row-span-2 relative shadow-xl"
            variants={slideUp}
            whileHover={{ scale: 1.02 }}
          >
            <img
              src="https://img.freepik.com/premium-photo/cartoon-woman-bathrobe-with-cucumber-slices-her-eyes-enjoying-cup-tea_605905-119965.jpg?w=740"
              alt="Tratamiento de spa"
              className="w-fit h-fit object-cover rounded-xl shadow-xl"
            />
            <motion.div 
              className="absolute bottom-10 -right-4 w-40 h-40 shadow-xl"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              viewport={{ once: true }}
            >
              <img src="https://img.freepik.com/premium-photo/eucalyptus-leaves-jar-cream-towel-pastel-green-background_1261393-5177.jpg?w=740" alt="" className="rounded-2xl"/>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="bg-pink-200 p-6 rounded-xl shadow-xl"
            variants={slideUp}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <motion.div 
                className="w-8 h-8 bg-pink-400 rounded-full flex items-center justify-center shadow-xl"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              >
                <span className="text-white text-xs">🌸</span>
              </motion.div>
              <h3 className="font-bold text-black">Rejuvenece y Renueva</h3>
            </div>
            <p className="text-gray-700 text-sm">
              Nuestras fórmulas avanzadas están diseñadas para rejuvenecer tu piel, promoviendo la regeneración y ayudando a reducir
              la apariencia de líneas finas y arrugas.
            </p>
          </motion.div>
          
          <motion.div 
            className="p-6 border border-[#e2e2e2] rounded-xl shadow-xl"
            variants={slideUp}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <motion.div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                animate={{ 
                  scale: [1, 1.1, 1],
                  transition: { repeat: Infinity, duration: 2 }
                }}
              >
                <span className="text-black text-xs">🧪</span>
              </motion.div>
              <h3 className="font-bold text-black">Ingredientes Naturales y Ciencia</h3>
            </div>
            <p className="text-gray-700 text-sm">
              Combinamos lo mejor de la naturaleza con ciencia de vanguardia para crear productos que son suaves, efectivos y
              sostenibles para la salud de la piel a largo plazo.
            </p>
          </motion.div>
          
          <motion.div 
            className="p-6 border border-[#e2e2e2] rounded-xl shadow-xl"
            variants={slideUp}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <motion.div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  transition: { repeat: Infinity, duration: 3 }
                }}
              >
                <span className="text-black text-xs">✨</span>
              </motion.div>
              <h3 className="font-bold text-black">Belleza Natural Radiante</h3>
            </div>
            <p className="text-gray-700 text-sm">
              Desbloquea un brillo que proviene naturalmente de una piel sana y bien nutrida. Nuestros productos mejoran tu
              belleza natural en lugar de enmascararla.
            </p>
          </motion.div>
          
          <motion.div 
            className="p-6 border border-[#e2e2e2] rounded-xl shadow-xl"
            variants={slideUp}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center">
                <span className="text-black text-xs">👩‍⚕️</span>
              </div>
              <h3 className="font-bold text-black">Orientación Experta</h3>
            </div>
            <p className="text-gray-700 text-sm">
              Nuestros especialistas capacitados están aquí para guiarte en tu viaje de cuidado de la piel con recomendaciones
              personalizadas y asesoramiento profesional.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Sección CTA */}
      <motion.section 
        className="px-5 md:px-20 py-16 text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.h2 
          className="text-2xl mb-6 bg-gradient-to-r from-[#1F1F1F] to-[#01f891] bg-clip-text text-transparent font-semibold uppercase tracking-wide"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
          }}
        >
          ¿Listo para experimentar la máxima relajación?
        </motion.h2> 
        <motion.button
          onClick={() => navigate("/book")}
          className="inline-block border border-[#0C9383] text-[#1F1F1F] hover:bg-[#0C9383] hover:text-white transition-colors duration-300 px-8 py-3 tracking-widest text-md cursor-pointer rounded-xl"
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 0 15px rgba(12, 147, 131, 0.5)"
          }}
          whileTap={{ scale: 0.95 }}
        >
          Reserva tu cita
        </motion.button>
      </motion.section>
    </main>
  );
};

// Servicios de ejemplo en caso de que falle la conexión con Firebase
const serviciosEjemplo = [
  {
    id: '1',
    name: 'Masaje Sueco',
    description: 'Un suave masaje de cuerpo completo diseñado para relajar músculos, mejorar la circulación y reducir el estrés.',
    price: 85,
    duration: 60,
    imageUrl: 'https://images.pexels.com/photos/5599437/pexels-photo-5599437.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  },
  {
    id: '2',
    name: 'Facial de Limpieza Profunda',
    description: 'Purifica y refresca tu piel con limpieza profunda, exfoliación y una mascarilla personalizada.',
    price: 95,
    duration: 75,
    imageUrl: 'https://images.pexels.com/photos/3997381/pexels-photo-3997381.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  },
  {
    id: '3',
    name: 'Terapia con Piedras Calientes',
    description: 'Piedras calientes colocadas en puntos clave del cuerpo para derretir la tensión y el estrés.',
    price: 110,
    duration: 90,
    imageUrl: 'https://images.pexels.com/photos/3865676/pexels-photo-3865676.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  }
];

export default Home;