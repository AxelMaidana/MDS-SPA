import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Calendar, Home, Info, Phone, Scissors, Building } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

const Header = () => {
  const { currentUser, userRole, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement>(null);


  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  

  // Close mobile menu when path changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { label: 'Inicio', to: '/', icon: <Home size={20} /> },
    ...(currentUser && userRole !== 'staff' ? [{
      label: 'Mis turnos', 
      to: '/appointments', 
      icon: <Calendar size={20} />
    }] : []),
    ...(userRole !== 'staff' ? [{
      label: 'Servicios', 
      to: '/services', 
      icon: <Scissors size={20} />
    }] : []),
    { label: 'Sobre Nosotros', to: '/about', icon: <Info size={20} /> },
    { label: 'Contactanos', to: '/contact', icon: <Phone size={20} /> },
    ...(userRole !== 'staff' ? [{
      label: 'Trabaja con nosotros', 
      to: '/working-here', 
      icon: <Building size={20} />
    }] : []),
  ];

  const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);

  const headerClasses = `fixed top-0 z-50 w-full bg-gradient-to-r from-[#0C9383] to-[#01f891]/50 backdrop-blur-md rounded-br-2xl transition-all duration-300 ${
    scrolled ? 'py-2' : 'py-3'
  }`;

  return (
    <>
      {/* Navbar */}
      <header className={headerClasses}>
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo and sidebar button */}
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center p-2 text-sm text-white rounded-lg lg:hidden hover:bg-[#0C9383]/50"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <Link to="/" className="flex ms-2 md:me-24">
                <img src="/logo.png" className="h-10 me-3" alt="Logo" />
              </Link>
            </div>

            <Link to="/" className="tipo-dancing">
              <motion.span 
                className="text-3xl md:text-4xl font-semibold hidden md:flex text-white"
                whileHover={{ scale: 1.05 }}
              >
                Sentirse Bien
              </motion.span>
            </Link> 

            {/* Auth section */}
            <div className="flex items-center space-x-4 mr-4">
              {!currentUser ? (
                <Link
                  to="/login"
                  className="text-sm text-white px-4 py-2 rounded-md bg-gradient-to-r from-[#0C9383] to-[#01f891] 
                             bg-[length:200%_100%] bg-left hover:bg-right transition-all duration-500 ease-in-out"
                >
                  Sign in
                </Link>
              ) : (
                <div className="relative">
                  <button
                    onClick={toggleUserMenu}
                    className="flex text-sm bg-[#E9EDC9] rounded-full focus:ring-4 focus:ring-gray-700"
                  >
                    <img 
                      className="w-8 h-8 rounded-full" 
                      src={currentUser.photoURL || "https://ui-avatars.com/api/?name=" + currentUser.displayName} 
                      alt="User" 
                    />
                  </button>

                  {userMenuOpen && (
                    <motion.div 
                      ref={userMenuRef}
                      className="absolute right-4 mt-4 w-44 z-50 bg-[#1F1F1F] text-white border border-[#1F1F1F] rounded-xl shadow-sm"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="px-4 mt-2">
                        <p className="text-sm font-medium truncate">{currentUser.email}</p>
                        <p className="text-sm opacity-60">{currentUser.displayName || "Cliente"}</p>
                      </div>
                      <hr className="my-2 border-white/10"/>
                      <ul className="py-1">
                        {userRole === 'admin' && (
                          <li>
                            <Link to="/admin" className="block px-4 py-2 text-sm hover:bg-[#323232]">
                              Admin Dashboard
                            </Link>
                          </li>
                        )}
                        {userRole === 'staff' && (
                          <li>
                            <Link to="/staff" className="block px-4 py-2 text-sm hover:bg-[#323232]">
                              Staff Dashboard
                            </Link>
                          </li>
                        )}
                        <li>
                          <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-[#323232]">
                            Profile
                          </Link>
                        </li>
                        <li>
                          <button 
                            onClick={logout}
                            className="flex items-center w-full px-4 py-2 text-sm hover:bg-[#323232] text-left"
                          >
                            <LogOut size={16} className="mr-2" />
                            Log Out
                          </button>
                        </li>
                      </ul>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 h-screen pt-20 bg-[#1F1F1F]/40 backdrop-blur-md transition-all duration-300 overflow-hidden ${mobileMenuOpen ? 'w-64' : 'w-0'} lg:w-14 lg:hover:w-64`}>
        <div className="h-full px-3 pb-4 overflow-hidden ">
          <ul className="space-y-2 font-medium tipo-quicksand ">
            {navItems.map(({ label, to, icon }, index) => (
              <li key={label}>
                <Link to={to} className="flex items-center p-2 rounded-lg text-white hover:bg-[#323232] hover:scale-105 duration-200">
                  <span className="w-6 h-6">{icon}</span>
                  <span className="ms-5 whitespace-nowrap">{label}</span>
                </Link>
                {index < navItems.length - 1 && (
                  <hr className="border-t-[1px] border-[#ffffff] opacity-10 mx-3 mt-2" />
                )}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Overlay oscuro para cerrar el sidebar en mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-900 opacity-50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Header;