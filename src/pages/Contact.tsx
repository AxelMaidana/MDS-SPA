import { useState, FormEvent } from 'react';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import { FaMapMarkerAlt } from "react-icons/fa";
import { motion } from "framer-motion";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitSuccess(true);
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: ''
    });
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="bg-[#F8FAF4] text-[#2F3E2E]">

      {/* Mapa y Formulario */}
      <section className="text-gray-600 body-font relative min-h-[600px]">
        <div className="absolute inset-0 bg-gray-300 h-full">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3560.3779642927277!2d-58.97900773763465!3d-27.45103670042867!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94450c97c44896e9%3A0xf69e0464c8cb5105!2sUTN%20Facultad%20Regional%20Resistencia!5e0!3m2!1ses-419!2sar!4v1712751715075!5m2!1ses-419!2sar"
            width="100%"
            height="100%"
            className="border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>

          {/* Ubicación: Icono flotante */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full z-10">
            <div className="flex flex-col items-center text-[#0C9383]">
              <FaMapMarkerAlt className="text-4xl drop-shadow-lg animate-bounce" />
              <span className="text-xs font-semibold bg-white px-2 py-1 mt-1 rounded shadow">
                Nuestra Ubicación
              </span>
            </div>
          </div>
        </div>

        {/* Formulario de contacto */}
        <div className="container justify-end px-5 py-24 mx-auto flex">
          <motion.div 
            className="relative z-10 bg-gradient-to-br from-[#F2F5E9]/20 to-[#F2F5E9] rounded-2xl shadow-xl p-10 w-full max-w-md backdrop-blur-md bg-opacity-90"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4 bg-[#1f1f1f]/80 bg-clip-text text-transparent">Contáctanos</h2>
            <p className="text-sm text-gray-700 mb-6">
              Completa el formulario y nos pondremos en contacto contigo a la brevedad.
            </p>
            
            {submitSuccess ? (
              <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
                ¡Gracias por tu mensaje! Hemos recibido tu consulta correctamente. Nos pondremos en contacto contigo pronto.
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#1f1f1f]/80">Nombre Completo *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-[#C3CEA1]"
                    required
                    placeholder="Tu nombre"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#1f1f1f]/80">Correo Electrónico *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-[#C3CEA1]"
                    required
                    placeholder="tu@email.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[#1f1f1f]/80">Teléfono</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-[#C3CEA1]"
                    placeholder="+54 9 XXX XXX XXXX"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-[#1f1f1f]/80">Mensaje *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-[#C3CEA1]"
                    required
                    placeholder="Escribe tu mensaje aquí..."
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#0C9383] to-[#01f891] text-white font-bold py-2 cursor-pointer rounded-lg text-lg shadow-md hover:shadow-lg bg-[length:200%_100%] bg-left hover:bg-right transition-all duration-500 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin inline mr-2" size={20} />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="inline mr-2" size={20} />
                      Enviar Mensaje
                    </>
                  )}
                </button>
              </form>
            )}
            
            <p className="text-xs text-gray-500 mt-3">
              Tus datos personales serán tratados con confidencialidad según la ley de protección de datos.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Información de contacto */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Teléfono */}
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-md text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-center mb-4">
              <div className="bg-[#0C9383]/10 p-3 rounded-full">
                <Phone className="w-8 h-8 text-[#0C9383]" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-[#2F3E2E] mb-2">Teléfono</h3>
            <p className="text-gray-600">+54 9 362 412-3456</p>
            <p className="text-sm text-gray-500 mt-1">Lunes a Viernes de 8am a 8pm</p>
          </motion.div>

          {/* Email */}
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-md text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-center mb-4">
              <div className="bg-[#0C9383]/10 p-3 rounded-full">
                <Mail className="w-8 h-8 text-[#0C9383]" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-[#2F3E2E] mb-2">Email</h3>
            <p className="text-gray-600">info@serenityspa.com</p>
            <p className="text-sm text-gray-500 mt-1">Respondemos dentro de las 24 horas</p>
          </motion.div>

          {/* Dirección */}
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-md text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-center mb-4">
              <div className="bg-[#0C9383]/10 p-3 rounded-full">
                <MapPin className="w-8 h-8 text-[#0C9383]" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-[#2F3E2E] mb-2">Dirección</h3>
            <p className="text-gray-600">French 400</p>
            <p className="text-gray-600">Resistencia, Chaco</p>
          </motion.div>
        </div>

        {/* Horario de atención */}
        <motion.div 
          className="mt-16 bg-white rounded-2xl shadow-md p-8 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-semibold text-[#2F3E2E] mb-6 text-center">Horario de Atención</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h4 className="font-medium text-[#0C9383]">Lunes - Viernes</h4>
              <p className="text-gray-600">9:00 AM - 8:00 PM</p>
            </div>
            <div className="text-center">
              <h4 className="font-medium text-[#0C9383]">Sábados</h4>
              <p className="text-gray-600">10:00 AM - 6:00 PM</p>
            </div>
            <div className="text-center">
              <h4 className="font-medium text-[#0C9383]">Domingos</h4>
              <p className="text-gray-600">10:00 AM - 4:00 PM</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;