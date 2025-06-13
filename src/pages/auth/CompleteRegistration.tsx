/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const CompleteRegistrationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { registerPreRegisteredUser } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const email = location.state?.email || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Por favor completa ambos campos');
      return;
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    try {
      setLoading(true);
      await registerPreRegisteredUser(email, password);
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
            Completa tu registro
          </motion.h2>
          <motion.p 
            className="text-gray-500 mt-2"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Establece una contraseña para tu cuenta
          </motion.p>
        </div>

        <motion.form
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
          onSubmit={handleSubmit}
        >
          <motion.div variants={itemVariants}>
            <p className="mb-4 text-gray-600 text-center">Email: <span className="font-medium">{email}</span></p>
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
                'Completar Registro'
              )}
            </motion.button>
          </motion.div>
        </motion.form>
      </motion.div>
    </main>
  );
};

export default CompleteRegistrationPage;