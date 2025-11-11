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
  const [customerType, setCustomerType] = useState<
    "Regular" | "Frecuente" | "Nuevo"
  >("Nuevo");
  const [purchaseAmountCondition, setPurchaseAmountCondition] = useState<
    "mayor-igual-20k" | "menor-20k"
  >("menor-20k");

  // Obtener método de pago desde la navegación
  useEffect(() => {
    if (location.state?.paymentMethod) {
      setPaymentMethod(location.state.paymentMethod);
    }
  }, [location.state]);

  // Determinar tipo de cliente y condición de monto de compra
  useEffect(() => {
    const cartTotal = getCartTotal();

    // Determinar condición de monto de compra
    if (cartTotal >= 20000) {
      setPurchaseAmountCondition("mayor-igual-20k");
    } else {
      setPurchaseAmountCondition("menor-20k");
    }

    // Determinar tipo de cliente
    if (currentUser) {
      checkFrequentCustomer().then((isFrequent) => {
        if (isFrequent) {
          setCustomerType("Frecuente");
        } else {
          setCustomerType("Regular");
        }
      });
    } else {
      setCustomerType("Nuevo");
    }
  }, [cartItems, currentUser, getCartTotal]);

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Partial<CheckoutFormData> = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "El nombre es requerido";
    if (!formData.lastName.trim())
      newErrors.lastName = "El apellido es requerido";
    if (!formData.email.trim()) newErrors.email = "El email es requerido";
    if (!formData.phone.trim()) newErrors.phone = "El teléfono es requerido";

    // Solo validar dirección si no es pago en efectivo
    if (paymentMethod !== "efectivo") {
      if (!formData.address.trim())
        newErrors.address = "La dirección es requerida";
      if (!formData.city.trim()) newErrors.city = "La ciudad es requerida";
      if (!formData.postalCode.trim())
        newErrors.postalCode = "El código postal es requerido";
    }

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
      let discountType:
        | "efectivo"
        | "cliente-frecuente"
        | "cliente-regular"
        | "bienvenida"
        | undefined;

      // Aplicar descuentos según tabla de condiciones (solo un descuento aplica)
      if (paymentMethod === "efectivo") {
        discount = subtotal * 0.1; // 10% descuento efectivo
        discountType = "efectivo";
      } else {
        // Descuentos según tipo de cliente y monto de compra
        if (customerType === "Frecuente") {
          if (purchaseAmountCondition === "mayor-igual-20k") {
            discount = subtotal * 0.2; // 20% descuento para cliente frecuente con compra ≥ $20.000
            discountType = "cliente-frecuente";
          } else {
            discount = subtotal * 0.1; // 10% descuento para cliente frecuente con compra < $20.000
            discountType = "cliente-frecuente";
          }
        } else if (customerType === "Regular") {
          if (purchaseAmountCondition === "mayor-igual-20k") {
            discount = subtotal * 0.1; // 10% descuento para cliente regular con compra ≥ $20.000
            discountType = "cliente-regular";
          }
          // Sin descuento para cliente regular con compra < $20.000
        } else if (customerType === "Nuevo") {
          if (purchaseAmountCondition === "mayor-igual-20k") {
            discount = subtotal * 0.05; // 5% descuento de bienvenida para cliente nuevo con compra ≥ $20.000
            discountType = "bienvenida";
          }
          // Sin descuento para cliente nuevo con compra < $20.000
        }
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
        discountType: discountType as
          | "efectivo"
          | "cliente-frecuente"
          | undefined,
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
      const orderData = {
        ...order,
        id: orderRef.id,
        createdAt: serverTimestamp(),
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          // Solo incluir información de dirección si no es pago en efectivo
          ...(paymentMethod !== "efectivo" && {
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
          }),
          notes: formData.notes,
        },
      };

      await setDoc(orderRef, orderData);

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
                <label className="block text-gray-700 font-medium mb-2">
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
                <label className="block text-gray-700 font-medium mb-2">
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

            {/* Condiciones del Cliente */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <CheckCircle size={24} />
                Condiciones del Cliente
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Tipo de Cliente
                  </label>
                  <div className="px-4 py-3 bg-white rounded-lg border border-gray-300">
                    <span
                      className={`font-semibold ${
                        customerType === "Frecuente"
                          ? "text-green-600"
                          : customerType === "Regular"
                          ? "text-blue-600"
                          : "text-orange-600"
                      }`}
                    >
                      {customerType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {customerType === "Frecuente" &&
                      `Cliente con 3+ servicios en los últimos 30 días • ${
                        purchaseAmountCondition === "mayor-igual-20k"
                          ? "20%"
                          : "10%"
                      } descuento`}
                    {customerType === "Regular" &&
                      `Cliente registrado con historial • ${
                        purchaseAmountCondition === "mayor-igual-20k"
                          ? "10%"
                          : "sin"
                      } descuento`}
                    {customerType === "Nuevo" &&
                      `Cliente sin cuenta o primer compra • ${
                        purchaseAmountCondition === "mayor-igual-20k"
                          ? "5%"
                          : "sin"
                      } descuento`}
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Monto de Compra
                  </label>
                  <div className="px-4 py-3 bg-white rounded-lg border border-gray-300">
                    <span
                      className={`font-semibold ${
                        purchaseAmountCondition === "mayor-igual-20k"
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    >
                      {purchaseAmountCondition === "mayor-igual-20k"
                        ? "≥ $20.000"
                        : "< $20.000"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {purchaseAmountCondition === "mayor-igual-20k" &&
                      "Compra mayor o igual a $20.000"}
                    {purchaseAmountCondition === "menor-20k" &&
                      "Compra menor a $20.000"}
                  </p>
                </div>
              </div>
            </div>

            {/* Dirección de Envío - Solo mostrar si no es pago en efectivo */}
            {paymentMethod !== "efectivo" && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <MapPin size={24} />
                  Dirección de Envío
                </h2>

                <div className="mt-4">
                  <label className="block text-gray-700 font-medium mb-2">
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
                    <p className="text-red-300 text-sm mt-1">
                      {errors.address}
                    </p>
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
                  <label className="block text-gray-700 font-medium mb-2">
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
            )}

            {/* Mensaje para pago en efectivo */}
            {paymentMethod === "efectivo" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-yellow-800 mb-4 flex items-center gap-3">
                  Pago en Efectivo
                </h2>
                <p className="text-yellow-700 mb-4">
                  Has seleccionado pagar en efectivo. Por favor, acércate a
                  nuestra sucursal para retirar tu pedido y realizar el pago.
                </p>
                <div className="bg-yellow-100 p-4 rounded-lg">
                  <p className="text-yellow-800 font-semibold mb-2">
                    Horario de atención:
                  </p>
                  <p className="text-yellow-700">
                    Lunes a Viernes: 9:00 - 18:00
                  </p>
                  <p className="text-yellow-700">Sábados: 9:00 - 13:00</p>
                </div>
              </div>
            )}
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

                {/* Mostrar descuentos aplicados */}
                {paymentMethod === "efectivo" && (
                  <div className="flex justify-between text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                    <span> Descuento por pago en efectivo (10%)</span>
                    <span className="font-semibold">
                      -${(subtotal * 0.1).toLocaleString()}
                    </span>
                  </div>
                )}

                {customerType === "Frecuente" &&
                  paymentMethod !== "efectivo" && (
                    <div className="flex justify-between text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                      <span>
                        Descuento cliente frecuente (
                        {purchaseAmountCondition === "mayor-igual-20k"
                          ? "20%"
                          : "10%"}
                        )
                      </span>
                      <span className="font-semibold">
                        -$
                        {(
                          subtotal *
                          (purchaseAmountCondition === "mayor-igual-20k"
                            ? 0.2
                            : 0.1)
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}

                {customerType === "Regular" &&
                  paymentMethod !== "efectivo" &&
                  purchaseAmountCondition === "mayor-igual-20k" && (
                    <div className="flex justify-between text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                      <span> Descuento cliente regular (10%)</span>
                      <span className="font-semibold">
                        -${(subtotal * 0.1).toLocaleString()}
                      </span>
                    </div>
                  )}

                {customerType === "Nuevo" &&
                  paymentMethod !== "efectivo" &&
                  purchaseAmountCondition === "mayor-igual-20k" && (
                    <div className="flex justify-between text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                      <span> Descuento de bienvenida (5%)</span>
                      <span className="font-semibold">
                        -${(subtotal * 0.05).toLocaleString()}
                      </span>
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
                    {paymentMethod === "efectivo" ? (
                      <>
                        <CheckCircle size={24} />
                        Confirmar Retiro en Sucursal
                      </>
                    ) : (
                      <>
                        <CreditCard size={24} />
                        Confirmar Compra
                      </>
                    )}
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
