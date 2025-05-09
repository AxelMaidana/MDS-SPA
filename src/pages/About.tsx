"use client"

import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

// Animaciones reutilizables

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

export default function AboutUs() {
  const decorativeRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Add smooth parallax effect on scroll
    const handleScroll = () => {
      if (decorativeRef.current) {
        const scrollY = window.scrollY
        decorativeRef.current.style.transform = `translateY(${scrollY * 0.05}px)`
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <main className="relative bg-[#f8f3e9] min-h-screen text-[#1F1F1F] overflow-hidden">

      {/* Main Content */}
      <div className="relative z-10 w-full">
        {/* Hero Section */}
        <div className="lg:pl-16">
          <motion.section 
            className="relative w-full mb-24 rounded-b-3xl overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="absolute inset-0 bg-black opacity-40 z-10" />
            
            <div className="overflow-hidden h-[600px] relative">
              <motion.img
                src="aboutPageHero.jpg"
                alt="Spa relaxation"
                className="object-cover w-full h-full"
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />

              {/* CENTERED TEXT AT BOTTOM */}
              <motion.div 
                className="absolute bottom-0 left-0 w-full h-full z-20 flex items-end justify-center pb-16 text-white text-center px-4"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                <motion.div variants={slideUp}>
                  <motion.h1 
                    className="text-7xl tracking-wide mb-6"
                    variants={slideUp}
                  >
                    About Us
                  </motion.h1>
                  <motion.p 
                    className="text-lg leading-relaxed max-w-2xl mx-auto opacity-80"
                    variants={slideUp}
                  >
                    <span className="font-medium">Sentirse Bien Spa</span>, nos dedicamos a brindar experiencias de relajación, bienestar y autocuidado que transforman cuerpo y mente.
                  </motion.p>
                </motion.div>
              </motion.div>
            </div>
          </motion.section>
        </div>

        <div className="mx-auto px-5 lg:pl-20 xl:px-40">
          {/* Your Sanctuary Section */}
          <motion.section 
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24"
            initial="hidden"
            whileInView="visible"
            variants={staggerContainer}
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div 
              className="space-y-6"
              variants={slideUp}
            >
              <motion.h2 
                className="text-3xl tracking-wide"
                variants={slideUp}
              >
                Tu Santuario
                <br />
                De Serenidad
                Te Espera
                <br />
              </motion.h2>
              <motion.p 
                className="text-md leading-relaxed max-w-md"
                variants={slideUp}
              >
                 Desde que Sentirse Bien Spa abrió sus puertas, nos hemos comprometido a crear un espacio donde cada visitante pueda escapar de las presiones diarias y encontrar un momento de paz. Nuestro equipo de terapeutas altamente capacitados se dedica a personalizar cada tratamiento según tus necesidades específicas.
              </motion.p>
            </motion.div>
            <motion.div 
              className="grid grid-cols-2 gap-4"
              variants={staggerContainer}
            >
              <motion.div 
                className="rounded-2xl overflow-hidden h-[200px] relative"
                variants={slideUp}
                whileHover={{ y: -5 }}
              >
                <img
                  src="https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=1974&auto=format&fit=crop"
                  alt="Spa texture"
                  className="object-cover w-full h-full"
                />
              </motion.div>
              <motion.div 
                className="rounded-2xl overflow-hidden h-[200px] relative mt-8"
                variants={slideUp}
                whileHover={{ y: -5 }}
              >
                <img
                  src="https://images.unsplash.com/photo-1600334129128-685c5582fd35?q=80&w=2070&auto=format&fit=crop"
                  alt="Spa ambience"
                  className="object-cover w-full h-full"
                />
              </motion.div>
              <motion.div 
                className="rounded-2xl overflow-hidden h-[200px] relative col-span-2"
                variants={slideUp}
                whileHover={{ y: -5 }}
              >
                <img
                  src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2070&auto=format&fit=crop"
                  alt="Coconut bowl"
                  className="object-cover w-full h-full"
                />
              </motion.div>
            </motion.div>
          </motion.section>

          {/* Divider with Message */}
          <motion.section 
            className="mb-24 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.div 
              className="max-w-3xl mx-auto py-12 px-4"
              initial="hidden"
              whileInView="visible"
              variants={staggerContainer}
              viewport={{ once: true }}
            >
              <motion.div 
                className="flex justify-center mb-4"
                variants={slideUp}
              >
                <div className="w-32 h-px bg-[#0C9383]"></div>
              </motion.div>
              <motion.h2 
                className="text-2xl tracking-wide text-center mb-4"
                variants={slideUp}
              >
                Redefine tu experiencia de autocuidado
                <br />
                con nosotros. Tu camino hacia la relajación
                <br />
                comienza aquí.
              </motion.h2>
              <motion.div 
                className="flex justify-center mt-4"
                variants={slideUp}
              >
                <div className="w-32 h-px bg-[#0C9383]"></div>
              </motion.div>
            </motion.div>
          </motion.section>

          {/* Mission Section */}
          <motion.section 
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24"
            initial="hidden"
            whileInView="visible"
            variants={staggerContainer}
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div 
              className="rounded-2xl overflow-hidden h-[400px] relative"
              variants={slideUp}
              whileHover={{ scale: 1.02 }}
            >
              <img
                src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=2070&auto=format&fit=crop"
                alt="Cream texture"
                className="object-cover w-full h-full"
              />
            </motion.div>
            <motion.div 
              className="space-y-6 flex flex-col justify-center"
              variants={staggerContainer}
            >
              <motion.h2 
                className="text-5xl tracking-wide"
                variants={slideUp}
              >
                Mision
              </motion.h2>
              <motion.p 
                className="text-md leading-relaxed"
                variants={slideUp}
              >
                Nuestra misión es crear un espacio de paz donde puedas desconectarte del mundo exterior y reconectarte con tu esencia. Nos comprometemos a ofrecer tratamientos que combinan técnicas ancestrales con innovaciones modernas, siempre respetando el ritmo natural de tu cuerpo.
              </motion.p>
              <motion.p 
                className="text-md leading-relaxed"
                variants={slideUp}
              >
                Nos esforzamos para que cada experiencia de relajación, alivio del estrés y restauración del equilibrio sea un viaje verdaderamente transformador que conecte genuinamente contigo.
              </motion.p>
            </motion.div>
          </motion.section>

          {/* Transformational Story */}
          <motion.section 
            className="mb-24"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.h2 
              className="text-4xl tracking-wide text-center mb-2"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              MI EXPERIENCIA
            </motion.h2>
            <motion.div 
              className="flex items-center justify-center gap-4 mb-16"
              initial="hidden"
              whileInView="visible"
              variants={staggerContainer}
              viewport={{ once: true }}
            >
              <motion.div 
                className="w-16 h-px bg-[#0C9383]"
                variants={slideUp}
              />
              <motion.h2 
                className="text-4xl tracking-wide text-center"
                variants={slideUp}
              >
                TRANSFORMADORA
              </motion.h2>
              <motion.div 
                className="w-16 h-px bg-[#0C9383]"
                variants={slideUp}
              />
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-16"
              initial="hidden"
              whileInView="visible"
              variants={staggerContainer}
              viewport={{ once: true }}
            >
              <motion.div 
                className="space-y-6"
                variants={slideUp}
              >
                <motion.p 
                  className="text-md leading-relaxed"
                  variants={slideUp}
                >
                  En Sentirse Bien Spa, cada cliente tiene una historia de transformación única. Desde quienes buscan alivio del dolor crónico hasta quienes simplemente necesitan un momento de paz en sus vidas ocupadas, hemos sido testigos de innumerables momentos de renovación.
                </motion.p>
                <motion.p 
                  className="text-md leading-relaxed"
                  variants={slideUp}
                >
                  Nuestro enfoque holístico no solo trata el cuerpo, sino también la mente y el espíritu, creando una experiencia verdaderamente transformadora.
                </motion.p>
              </motion.div>
              <motion.div 
                className="rounded-2xl overflow-hidden h-[300px] relative"
                variants={slideUp}
                whileHover={{ scale: 1.02 }}
              >
                <img
                  src="https://images.unsplash.com/photo-1507652313519-d4e9174996dd?q=80&w=2070&auto=format&fit=crop"
                  alt="Spa treatment"
                  className="object-cover w-full h-full"
                />
              </motion.div>
            </motion.div>
          </motion.section>

          {/* CTA Section */}
          <motion.section 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.h3 
              className="text-2xl tracking-wide mb-6"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              COMIENZA TU CAMINO HACIA EL BIENESTAR HOY
            </motion.h3>
            <motion.a
              onClick={() => navigate("/appointments")}
              className="inline-block border border-[#0C9383] text-[#1F1F1F] hover:bg-[#0C9383] hover:text-white transition-colors duration-300 px-8 py-3 tracking-widest text-md cursor-pointer rounded-xl"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 0 15px rgba(12, 147, 131, 0.5)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              Reservá tu turno
            </motion.a>
          </motion.section>
        </div>
      </div>

      {/* Elemento decorativo con efecto parallax */}
      <motion.div
        ref={decorativeRef}
        className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#0C9383] opacity-10 blur-3xl z-0"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.1 }}
        transition={{ duration: 1.5, delay: 0.5 }}
      />
    </main>
  )
}