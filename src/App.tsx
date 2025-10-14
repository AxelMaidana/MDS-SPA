import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import AuthPage from "./pages/auth/AuthPage";
import CompleteRegistration from "./pages/auth/CompleteRegistration.tsx";

// Layout components
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import LoadingScreen from "./components/shared/LoadingScreen";

// Page components
import Home from "./pages/Home";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import About from "./pages/About";
import WorkingHere from "./pages/WorkingHere";
import N8nChatWidget from "./components/shared/N8nChatWidget";
// import Login from './pages/auth/Login';
// import Register from './pages/auth/Register';
import Profile from "./pages/client/Profile";
import Appointments from "./pages/client/Appointments";
import BookAppointment from "./pages/client/BookAppointment";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminServices from "./pages/admin/Services";
import AdminUsers from "./pages/admin/Users.tsx";
import AdminStaff from "./pages/admin/Staff.tsx";
import AdminProducts from "./pages/admin/Products.tsx";
import AdminProviders from "./pages/admin/Providers.tsx";
import StaffDashboard from "./pages/staff/Dashboard.tsx";
import StaffAppointments from "./pages/staff/Appointments.tsx";
import SalesDashboard from "./pages/sales/Dashboard.tsx";
import SalesInventory from "./pages/sales/Inventory.tsx";
import SalesReports from "./pages/sales/Reports.tsx";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";

function App() {
  const { currentUser, userRole, loading } = useAuth();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Simulate app initialization time
    if (!loading) {
      const timer = setTimeout(() => {
        setAppReady(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading || !appReady) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:productId" element={<ProductDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/working-here" element={<WorkingHere />} />

          {/* Auth routes */}
          <Route path="/login" element={<AuthPage />} />
          <Route
            path="/register"
            element={<AuthPage initialMode="register" />}
          />
          <Route
            path="/complete-registration"
            element={<CompleteRegistration />}
          />

          {/* Protected client routes */}
          <Route
            path="/profile"
            element={currentUser ? <Profile /> : <Navigate to="/login" />}
          />
          <Route
            path="/appointments"
            element={currentUser ? <Appointments /> : <Navigate to="/login" />}
          />
          <Route
            path="/book"
            element={
              currentUser ? <BookAppointment /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/cart"
            element={currentUser ? <Cart /> : <Navigate to="/login" />}
          />
          <Route
            path="/checkout"
            element={currentUser ? <Checkout /> : <Navigate to="/login" />}
          />
          <Route
            path="/order-confirmation"
            element={
              currentUser ? <OrderConfirmation /> : <Navigate to="/login" />
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              currentUser && userRole === "admin" ? (
                <AdminDashboard />
              ) : (
                <Navigate to={currentUser ? "/" : "/login"} />
              )
            }
          />
          <Route
            path="/admin/services"
            element={
              currentUser && userRole === "admin" ? (
                <AdminServices />
              ) : (
                <Navigate to={currentUser ? "/" : "/login"} />
              )
            }
          />
          <Route
            path="/admin/users"
            element={
              currentUser && userRole === "admin" ? (
                <AdminUsers />
              ) : (
                <Navigate to={currentUser ? "/" : "/login"} />
              )
            }
          />
          <Route
            path="/admin/staff"
            element={
              currentUser && userRole === "admin" ? (
                <AdminStaff />
              ) : (
                <Navigate to={currentUser ? "/" : "/login"} />
              )
            }
          />
          <Route
            path="/admin/products"
            element={
              currentUser && userRole === "admin" ? (
                <AdminProducts />
              ) : (
                <Navigate to={currentUser ? "/" : "/login"} />
              )
            }
          />
          <Route
            path="/admin/providers"
            element={
              currentUser && userRole === "admin" ? (
                <AdminProviders />
              ) : (
                <Navigate to={currentUser ? "/" : "/login"} />
              )
            }
          />

          {/* Staff routes */}
          <Route
            path="/staff"
            element={
              currentUser && userRole === "staff" ? (
                <StaffDashboard />
              ) : (
                <Navigate to={currentUser ? "/" : "/login"} />
              )
            }
          />
          <Route
            path="/staff/appointments"
            element={
              currentUser && userRole === "staff" ? (
                <StaffAppointments />
              ) : (
                <Navigate to={currentUser ? "/" : "/login"} />
              )
            }
          />

          {/* Sales routes */}
          <Route
            path="/sales"
            element={
              currentUser && userRole === "sales" ? (
                <SalesDashboard />
              ) : (
                <Navigate to={currentUser ? "/" : "/login"} />
              )
            }
          />
          <Route
            path="/sales/inventory"
            element={
              currentUser && userRole === "sales" ? (
                <SalesInventory />
              ) : (
                <Navigate to={currentUser ? "/" : "/login"} />
              )
            }
          />
          <Route
            path="/sales/reports"
            element={
              currentUser && userRole === "sales" ? (
                <SalesReports />
              ) : (
                <Navigate to={currentUser ? "/" : "/login"} />
              )
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <N8nChatWidget />
      </main>
      <Footer />
    </div>
  );
}

export default App;
