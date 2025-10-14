import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  AlertCircle,
  User,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { PaymentMethod, Order } from "../types/products";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase/config";
import toast from "react-hot-toast";

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  notes?: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, clearCart, getCartTotal } = useCart();
  const { currentUser, userData } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: currentUser?.displayName?.split(" ")[0] || "",
    lastName: currentUser?.displayName?.split(" ").slice(1).join(" ") || "",
    email: currentUser?.email || "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Partial<CheckoutFormData>>({});

  // Obtener método de pago desde la navegación
  useEffect(() => {
    if (location.state?.paymentMethod) {
      setPaymentMethod(location.state.paymentMethod);
    }
  }, [location.state]);

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Partial<CheckoutFormData> = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "El nombre es requerido";
    if (!formData.lastName.trim())
      newErrors.lastName = "El apellido es requerido";
    if (!formData.email.trim()) newErrors.email = "El email es requerido";
    if (!formData.phone.trim()) newErrors.phone = "El teléfono es requerido";
    if (!formData.address.trim())
      newErrors.address = "La dirección es requerida";
    if (!formData.city.trim()) newErrors.city = "La ciudad es requerida";
    if (!formData.postalCode.trim())
      newErrors.postalCode = "El código postal es requerido";

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Verificar si es cliente frecuente (3+ servicios en últimos 30 días)
  const checkFrequentCustomer = async (): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const appointmentsQuery = query(
        collection(db, "appointments"),
        where("userId", "==", currentUser.uid),
        where("status", "==", "completed"),
        where("completedAt", ">=", thirtyDaysAgo)
      );

      const snapshot = await getDocs(appointmentsQuery);
      return snapshot.size >= 3;
    } catch (error) {
      console.error("Error checking frequent customer:", error);
      return false;
    }
  };

  // Procesar compra
  const handleCheckout = async () => {
    if (!validateForm() || !currentUser || cartItems.length === 0) {
      return;
    }

    setIsProcessing(true);

    try {
      // Verificar si es cliente frecuente
      const isFrequentCustomer = await checkFrequentCustomer();

      // Calcular totales
      const subtotal = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      let discount = 0;
      let discountType: "efectivo" | "cliente-frecuente" | undefined;

      // Aplicar descuentos
      if (paymentMethod === "efectivo") {
        discount = subtotal * 0.1; // 10% descuento efectivo
        discountType = "efectivo";
      } else if (isFrequentCustomer) {
        discount = subtotal * 0.15; // 15% descuento cliente frecuente
        discountType = "cliente-frecuente";
      }

      const total = subtotal - discount;

      // Generar número de orden
      const orderNumber = `ORD-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 5)
        .toUpperCase()}`;

      // Crear orden
      const order: Order = {
        id: "",
        userId: currentUser.uid,
        items: cartItems,
        subtotal,
        discount,
        discountType,
        total,
        paymentMethod,
        status: "pending",
        createdAt: new Date(),
        orderNumber,
        notes: formData.notes,
        isOnline: true,
        // Para ventas online, no hay salesPersonId
      };

      // Guardar orden en Firestore
      const orderRef = doc(collection(db, "orders"));
      await setDoc(orderRef, {
        ...order,
        id: orderRef.id,
        createdAt: serverTimestamp(),
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
        },
      });

      // Limpiar carrito
      await clearCart();

      toast.success("¡Compra realizada exitosamente!");

      // Navegar a confirmación
      navigate("/order-confirmation", {
        state: {
          orderNumber,
          total,
          paymentMethod,
          discountType,
          isFrequentCustomer,
        },
      });
    } catch (error) {
      console.error("Error processing checkout:", error);
      toast.error("Error al procesar la compra. Inténtalo de nuevo.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle size={64} className="text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              No hay productos en tu carrito
            </h2>
            <p className="text-gray-600 mb-6">
              Agrega algunos productos para continuar con la compra
            </p>
            <button
              onClick={() => navigate("/products")}
              className="bg-[#0C9383] text-white px-6 py-3 rounded-xl hover:bg-[#0a7a6b] transition-colors"
            >
              Ver Productos
            </button>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = getCartTotal();

  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/cart")}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            Volver al Carrito
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario */}
          <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <User size={24} />
                Información de Contacto
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.firstName ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-[#0C9383] focus:border-transparent`}
                    placeholder="Tu nombre"
                  />
                  {errors.firstName && (
                    <p className="text-red-300 text-sm mt-1">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.lastName ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-[#0C9383] focus:border-transparent`}
                    placeholder="Tu apellido"
                  />
                  {errors.lastName && (
                    <p className="text-red-300 text-sm mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-white font-medium mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-[#0C9383] focus:border-transparent`}
                  placeholder="tu@email.com"
                />
                {errors.email && (
                  <p className="text-red-300 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-white font-medium mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-[#0C9383] focus:border-transparent`}
                  placeholder="+54 9 11 1234-5678"
                />
                {errors.phone && (
                  <p className="text-red-300 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <MapPin size={24} />
                Dirección de Envío
              </h2>

              <div className="mt-4">
                <label className="block text-white font-medium mb-2">
                  Dirección *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.address ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-[#0C9383] focus:border-transparent`}
                  placeholder="Calle y número"
                />
                {errors.address && (
                  <p className="text-red-300 text-sm mt-1">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.city ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-[#0C9383] focus:border-transparent`}
                    placeholder="Buenos Aires"
                  />
                  {errors.city && (
                    <p className="text-red-300 text-sm mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Código Postal *
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) =>
                      setFormData({ ...formData, postalCode: e.target.value })
                    }
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.postalCode ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-[#0C9383] focus:border-transparent`}
                    placeholder="1234"
                  />
                  {errors.postalCode && (
                    <p className="text-red-300 text-sm mt-1">
                      {errors.postalCode}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-white font-medium mb-2">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                  rows={3}
                  placeholder="Instrucciones especiales para la entrega..."
                />
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 sticky top-24">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Resumen del Pedido
              </h3>

              {/* Productos */}
              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex justify-between text-gray-700"
                  >
                    <span className="flex-1">
                      {item.product.name} x {item.quantity}
                    </span>
                    <span>
                      ${(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Desglose de precios */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>

                {paymentMethod === "efectivo" && (
                  <div className="flex justify-between text-green-300">
                    <span>Descuento efectivo (10%)</span>
                    <span>-${(subtotal * 0.1).toLocaleString()}</span>
                  </div>
                )}

                <hr className="border-gray-300" />

                <div className="flex justify-between text-xl font-bold text-gray-800">
                  <span>Total</span>
                  <span>${total.toLocaleString()}</span>
                </div>
              </div>

              {/* Botón de compra */}
              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full bg-[#0C9383] text-white py-4 px-6 rounded-xl font-semibold hover:bg-[#0a7a6b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard size={24} />
                    Confirmar Compra
                  </>
                )}
              </button>

              {/* Información de seguridad */}
              <div className="mt-6 text-sm text-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>Compra 100% segura</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>Envío gratuito en compras superiores a $10.000</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>Garantía de satisfacción</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
