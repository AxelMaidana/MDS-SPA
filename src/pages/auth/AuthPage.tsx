/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// import toast from 'react-hot-toast';
// import { db } from '../../firebase/config';
// import { collection, query, where, getDocs } from 'firebase/firestore';

interface AuthPageProps {
    initialMode?: 'login' | 'register';
}

const AuthPage = ({ initialMode = 'login' }: AuthPageProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();


// Modifica el handleSubmit en AuthPage
// En AuthPage.tsx
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setError('');

  try {
    setLoading(true);
    if (isLogin) {
      await login(email, password);
      navigate('/');
    } else {
      // ... (código de registro normal)
    }
  } catch (err: any) {
    if (err.code === 'PRE_REGISTERED_USER') {
      // Redirigir SIEMPRE que el error sea este
      navigate('/complete-registration', { state: { email } });
    } else {
      setError(err.message || 'Error desconocido');
    }
  } finally {
    setLoading(false);
  }
};

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1,
        when: "beforeChildren"
      } 
    },
    exit: { opacity: 0, y: -30, transition: { duration: 0.3 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f8f3e9] to-[#e8f4f0] flex items-center justify-center p-4 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-[#99D4D6]/20 blur-xl"></div>
        <div className="absolute -right-20 bottom-0 w-96 h-96 rounded-full bg-[#0C9383]/10 blur-xl"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-[#24A498]/15 blur-lg"></div>
      </div>

      <motion.div 
        className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-md p-8 relative z-10 border border-white/20"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >

        {isLogin && (
          <div className="absolute -top-4 -right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 shadow-md rotate-3 transform">
            <div className="text-xs font-mono text-yellow-800">
              <div className="font-bold mb-1">Admin Credentials:</div>
              <div>Email: ana@gmail.com</div>
              <div>Password: 123456</div>
            </div>
          </div>
        )}
        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <motion.div 
            className="flex justify-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-16 h-16 bg-gradient-to-r from-[#0C9383] to-[#99D4D6] rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl text-white">💆‍♀️</span>
            </div>
          </motion.div>
          <motion.h2 
            className="text-3xl font-bold bg-gradient-to-r from-[#0C9383] to-[#28edf0] bg-clip-text text-transparent"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {isLogin ? "Bienvenido de vuelta" : "Únete a nuestro Spa"}
          </motion.h2>
          <motion.p 
            className="text-gray-500 mt-2"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {isLogin ? "Ingresa para reservar tu tratamiento" : "Crea tu cuenta para comenzar"}
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={isLogin ? "login" : "register"}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
            onSubmit={handleSubmit}
          >
            {!isLogin && (
              <motion.div variants={itemVariants}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-[#e2e2e2] rounded-xl focus:ring-2 focus:ring-[#24A498] focus:border-transparent transition-all"
                    disabled={loading}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-400">👤</span>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-[#e2e2e2] rounded-xl focus:ring-2 focus:ring-[#24A498] focus:border-transparent transition-all"
                  disabled={loading}
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-400">✉️</span>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-[#e2e2e2] rounded-xl focus:ring-2 focus:ring-[#24A498] focus:border-transparent transition-all"
                  disabled={loading}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-400">🔒</span>
                </div>
              </div>
            </motion.div>

            {!isLogin && (
              <motion.div variants={itemVariants}>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Confirmar contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-[#e2e2e2] rounded-xl focus:ring-2 focus:ring-[#24A498] focus:border-transparent transition-all"
                    disabled={loading}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-400">🔒</span>
                  </div>
                </div>
              </motion.div>
            )}

            {!isLogin && (
              <motion.div variants={itemVariants} className="text-sm text-gray-500">
                Al registrarte, aceptas nuestros{' '}
                <Link to="/terms" className="text-[#0C9383] hover:underline">
                  Términos de servicio
                </Link>{' '}
                y{' '}
                <Link to="/privacy" className="text-[#0C9383] hover:underline">
                  Política de privacidad
                </Link>.
              </motion.div>
            )}

            {error && (
              <motion.div 
                className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="mr-2">❌</span>
                {error}
              </motion.div>
            )}

            <motion.div variants={itemVariants} className="pt-2">
              <motion.button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl text-white font-medium transition-all duration-300 ${
                  loading 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-[#0C9383] to-[#99D4D6] hover:from-[#0C9383]/90 hover:to-[#99D4D6]/90 shadow-lg hover:shadow-[#99D4D6]/30'
                } flex items-center justify-center`}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Procesando...
                  </>
                ) : (
                  <>
                    {isLogin ? (
                      <>
                        <LogIn size={20} className="mr-2" />
                        Iniciar sesión
                      </>
                    ) : (
                      <>
                        <UserPlus size={20} className="mr-2" />
                        Crear cuenta
                      </>
                    )}
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.form>
        </AnimatePresence>

        <motion.div 
          className="mt-6 text-center text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {isLogin ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}{" "}
          <button
            className="text-[#0C9383] font-medium hover:underline transition hover:text-[#24A498]"
            onClick={() => setIsLogin(!isLogin)}
            type="button"
            disabled={loading}
          >
            {isLogin ? "Regístrate" : "Inicia sesión"}
          </button>
        </motion.div>

        {/* Social login options */}
        <motion.div 
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/90 text-gray-500">O continúa con</span>
            </div>
          </div>

          <div className="mt-4 flex justify-center gap-3">
            <button
              className="w-full py-3 rounded-xl text-white font-medium transition-all duration-300 bg-gradient-to-r from-[#0C9383] to-[#99D4D6] hover:from-[#0C9383]/90 hover:to-[#99D4D6]/90 shadow-lg hover:shadow-[#99D4D6]/30"
              onClick={() => navigate('/complete-registration')}
              type="button"
              disabled={loading}
            >
              Completar registro
            </button>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
};

export default AuthPage;