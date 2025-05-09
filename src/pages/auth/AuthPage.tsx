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
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setError('');

  if (isLogin) {
    // Validaciones básicas solo en iniciar sesión
    if (!email || !password) {
      setError('Por favor, rellena todos los campos');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  // Validaciones básicas solo en completar el registro
  if (!email || !password) {
    setError('Por favor, rellena todos los campos');
    return;
  }

  try {
    setLoading(true);
    await register(email, password, name);
    navigate('/');
  } catch (err: any) {
    setError(err.message);
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
              <div>Email: admin@gmail.com</div>
              <div>Password: admin123</div>
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
                  required
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

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-200 rounded-xl bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0110 4.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.933.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.14 18.163 20 14.418 20 10c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
              </svg>
            </button>

            <button
              type="button"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-200 rounded-xl bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
};

export default AuthPage;