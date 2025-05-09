import { FaMapMarkerAlt, FaPaperclip } from "react-icons/fa";
import { useState } from "react";
import { db, storage } from "../firebase/config"; // Asegúrate de tener configurado Firebase
import { addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

export default function Contact() {
  const [email, setEmail] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      if (!cvFile) {
        throw new Error("No se ha seleccionado ningún archivo");
      }
      // Subir el archivo a Firebase Storage
      const storageRef = ref(storage, `cvs/${uuidv4()}_${cvFile.name}`);
      await uploadBytes(storageRef, cvFile);
      const cvUrl = await getDownloadURL(storageRef);

      // Guardar datos en Firestore
      const applicationsRef = collection(db, "spaApplications");
      await addDoc(applicationsRef, {
        email,
        cvUrl,
        status: "pending", // pending, reviewed, contacted, rejected
        createdAt: new Date(),
      });

      setSubmitSuccess(true);
      setEmail("");
      setCvFile(null);
    } catch (error) {
      console.error("Error submitting application:", error);
      setSubmitError("Error al enviar la solicitud. Por favor intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
      setCvFile(file);
    } else if (file) {
      setSubmitError("El archivo es demasiado grande (máximo 5MB)");
    }
  };

  return (
    <main className="bg-[#F8FAF4] text-[#2F3E2E]">
      {/* Mapa */}
      <section className="text-gray-600 body-font relative h-screen">
        <div className="absolute inset-0 bg-gray-300">
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
                UTN Resistencia, Chaco
              </span>
            </div>
          </div>
        </div>

        {/* Formulario de contacto */}
        <div className="container justify-end px-5 py-24 mx-auto flex">
          <div className="relative z-10 bg-gradient-to-br from-[#F2F5E9]/20 to-[#F2F5E9] rounded-2xl shadow-xl p-10 w-full max-w-md backdrop-blur-md bg-opacity-90">
            <h2 className="text-3xl font-bold mb-4 bg-[#1f1f1f]/80 bg-clip-text text-transparent">Únete a nuestro equipo</h2>
            <p className="text-sm text-gray-700 mb-6">
              ¿Te gustaría trabajar en nuestro spa de belleza? Envíanos tu CV y nos pondremos en contacto contigo.
            </p>
            
            {submitSuccess ? (
              <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
                ¡Gracias por tu interés! Hemos recibido tu CV correctamente. Nos pondremos en contacto contigo si tu perfil coincide con nuestras necesidades.
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {submitError && (
                  <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                    {submitError}
                  </div>
                )}
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#1f1f1f]/80">Correo Electrónico *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-[#C3CEA1]"
                    required
                    placeholder="tu@email.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="cv" className="block text-sm font-medium text-[#1f1f1f]/80">Adjuntar CV *</label>
                  <div className="mt-1 flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FaPaperclip className="text-2xl text-gray-500" />
                        {cvFile ? (
                          <>
                            <p className="mb-1 text-sm text-gray-500 font-semibold">{cvFile.name}</p>
                            <p className="text-xs text-gray-500">{(cvFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </>
                        ) : (
                          <>
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Haz clic para subir</span> o arrastra tu archivo
                            </p>
                            <p className="text-xs text-gray-500">PDF, DOC o DOCX (MAX. 5MB)</p>
                          </>
                        )}
                      </div>
                      <input 
                        id="cv" 
                        name="cv" 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        required
                      />
                    </label>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#0C9383] to-[#01f891] text-white font-bold py-2 cursor-pointer rounded-lg text-lg shadow-md hover:shadow-lg bg-[length:200%_100%] bg-left hover:bg-right transition-all duration-500 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
                </button>
              </form>
            )}
            
            <p className="text-xs text-gray-500 mt-3">
              Tus datos personales serán tratados con confidencialidad según la ley de protección de datos.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}