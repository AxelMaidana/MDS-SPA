import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  CreditCardIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { PaymentMethod } from "../types/products";
import toast from "react-hot-toast";

const Cart = () => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemCount,
  } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>("efectivo");

  const handleQuantityChange = async (
    productId: string,
    newQuantity: number
  ) => {
    if (newQuantity < 1) {
      await removeFromCart(productId);
    } else {
      await updateQuantity(productId, newQuantity);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    await removeFromCart(productId);
  };

  const handleClearCart = async () => {
    await clearCart();
  };

  const handleCheckout = () => {
    if (!currentUser) {
      toast.error("Debes iniciar sesión para continuar");
      navigate("/login");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Tu carrito está vacío");
      return;
    }

    // Navegar al proceso de compra
    navigate("/checkout", { state: { paymentMethod: selectedPaymentMethod } });
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
              Volver a Productos
            </Link>
          </div>

          {/* Carrito vacío */}
          <div className="text-center py-16">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 max-w-md mx-auto">
              <ShoppingCart size={64} className="text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Tu carrito está vacío
              </h2>
              <p className="text-gray-600 mb-6">
                Agrega algunos productos para comenzar tu compra
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-[#0C9383] text-white px-6 py-3 rounded-xl hover:bg-[#0a7a6b] transition-colors"
              >
                <ShoppingCart size={20} />
                Ver Productos
              </Link>
            </div>
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
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            Volver a Productos
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 tipo-dancing">
            Mi Carrito
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              {getCartItemCount()} producto{getCartItemCount() !== 1 ? "s" : ""}
            </span>
            <button
              onClick={handleClearCart}
              className="text-red-300 hover:text-red-200 transition-colors"
            >
              Limpiar carrito
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de productos */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 border border-gray-200 rounded-2xl p-6"
              >
                <div className="flex gap-4">
                  {/* Imagen del producto */}
                  <Link to={`/products/${item.productId}`}>
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.product.images[0] || "/product.png"}
                        alt={item.product.name}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </Link>

                  {/* Información del producto */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.productId}`}>
                      <h3 className="font-semibold text-gray-800 text-lg mb-1 hover:text-[#0C9383] transition-colors">
                        {item.product.name}
                      </h3>
                    </Link>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {item.product.description}
                    </p>
                    <div className="text-xl font-bold text-gray-800">
                      ${item.price.toLocaleString()}
                    </div>
                  </div>

                  {/* Controles de cantidad y precio */}
                  <div className="flex flex-col items-end gap-3">
                    {/* Cantidad */}
                    <div className="flex items-center bg-gray-100 border border-gray-200 rounded-lg">
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item.productId,
                            item.quantity - 1
                          )
                        }
                        className="p-2 hover:bg-gray-200 transition-colors"
                      >
                        <Minus size={16} className="text-gray-600" />
                      </button>
                      <span className="px-3 py-2 text-gray-800 font-medium min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item.productId,
                            item.quantity + 1
                          )
                        }
                        disabled={item.quantity >= item.product.stock}
                        className="p-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        <Plus size={16} className="text-gray-600" />
                      </button>
                    </div>

                    {/* Precio total del item */}
                    <div className="text-xl font-bold text-gray-800">
                      ${(item.price * item.quantity).toLocaleString()}
                    </div>

                    {/* Botón eliminar */}
                    <button
                      onClick={() => handleRemoveItem(item.productId)}
                      className="p-2 text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Resumen del pedido */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 sticky top-24">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Resumen del Pedido
              </h3>

              {/* Método de pago */}
              <div className="mb-6">
                <h4 className="text-gray-700 font-medium mb-3">
                  Método de Pago
                </h4>
                <div className="space-y-2">
                  {[
                    {
                      value: "efectivo",
                      label: "Efectivo",
                      icon: Banknote,
                      discount: "10% descuento",
                    },
                    { value: "debito", label: "Débito", icon: CreditCardIcon },
                    { value: "credito", label: "Crédito", icon: CreditCard },
                  ].map((method) => (
                    <button
                      key={method.value}
                      onClick={() =>
                        setSelectedPaymentMethod(method.value as PaymentMethod)
                      }
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                        selectedPaymentMethod === method.value
                          ? "bg-[#0C9383] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <method.icon size={20} />
                        <span>{method.label}</span>
                        {method.discount && (
                          <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                            {method.discount}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Desglose de precios */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>

                {selectedPaymentMethod === "efectivo" && (
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
                className="w-full bg-[#0C9383] text-white py-4 px-6 rounded-xl font-semibold hover:bg-[#0a7a6b] transition-colors flex items-center justify-center gap-3"
              >
                <CreditCard size={24} />
                Proceder al Pago
              </button>

              {/* Información adicional */}
              <div className="mt-6 text-sm text-gray-600">
                <p className="mb-2">
                  • Envío gratuito en compras superiores a $10.000
                </p>
                <p className="mb-2">
                  • Descuento del 15% para clientes frecuentes
                </p>
                <p>• Garantía de satisfacción del 100%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
