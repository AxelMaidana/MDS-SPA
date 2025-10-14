import { useLocation, Link } from "react-router-dom";
import { CheckCircle, Package, Truck, Home, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

interface OrderConfirmationState {
  orderNumber: string;
  total: number;
  paymentMethod: string;
  discountType?: "efectivo" | "cliente-frecuente";
  isFrequentCustomer: boolean;
}

const OrderConfirmation = () => {
  const location = useLocation();
  const state = location.state as OrderConfirmationState;

  if (!state) {
    return (
      <div className="min-h-screen bg-white pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Información de orden no encontrada
            </h2>
            <Link
              to="/products"
              className="bg-[#0C9383] text-white px-6 py-3 rounded-xl hover:bg-[#0a7a6b] transition-colors"
            >
              Ver Productos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "efectivo":
        return "Efectivo";
      case "debito":
        return "Débito";
      case "credito":
        return "Crédito";
      default:
        return method;
    }
  };

  const getDiscountLabel = (discountType?: string) => {
    switch (discountType) {
      case "efectivo":
        return "Descuento por pago en efectivo (10%)";
      case "cliente-frecuente":
        return "Descuento cliente frecuente (15%)";
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header de éxito */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle size={48} className="text-green-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tipo-dancing">
              ¡Compra Realizada!
            </h1>
            <p className="text-lg text-white/80">
              Tu pedido ha sido procesado exitosamente
            </p>
          </motion.div>

          {/* Información de la orden */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              Detalles de tu Pedido
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/20">
                <span className="text-white/70">Número de Orden:</span>
                <span className="text-white font-semibold">
                  {state.orderNumber}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-white/20">
                <span className="text-white/70">Método de Pago:</span>
                <span className="text-white font-semibold">
                  {getPaymentMethodLabel(state.paymentMethod)}
                </span>
              </div>

              {getDiscountLabel(state.discountType) && (
                <div className="flex justify-between items-center py-3 border-b border-white/20">
                  <span className="text-white/70">Descuento:</span>
                  <span className="text-green-300 font-semibold">
                    {getDiscountLabel(state.discountType)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center py-3">
                <span className="text-white/70 text-lg">Total Pagado:</span>
                <span className="text-white font-bold text-xl">
                  ${state.total.toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Proceso de entrega */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8"
          >
            <h3 className="text-xl font-bold text-white mb-6">
              Próximos Pasos
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-[#0C9383] rounded-full p-3">
                  <Package size={24} className="text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">
                    Preparando tu pedido
                  </h4>
                  <p className="text-white/70 text-sm">
                    Estamos preparando tus productos con cuidado
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 opacity-60">
                <div className="bg-white/20 rounded-full p-3">
                  <Truck size={24} className="text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">En camino</h4>
                  <p className="text-white/70 text-sm">
                    Te notificaremos cuando esté en camino
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 opacity-60">
                <div className="bg-white/20 rounded-full p-3">
                  <Home size={24} className="text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Entregado</h4>
                  <p className="text-white/70 text-sm">
                    Recibirás tus productos en tu domicilio
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Información adicional */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8"
          >
            <h3 className="text-lg font-bold text-white mb-4">¿Qué sigue?</h3>
            <ul className="space-y-2 text-white/80">
              <li>
                • Recibirás un email de confirmación con todos los detalles
              </li>
              <li>• Te contactaremos para coordinar la entrega</li>
              <li>• El tiempo de entrega estimado es de 2-3 días hábiles</li>
              <li>• Si tienes alguna consulta, no dudes en contactarnos</li>
            </ul>
          </motion.div>

          {/* Botones de acción */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              to="/products"
              className="flex-1 bg-[#0C9383] text-white py-4 px-6 rounded-xl font-semibold hover:bg-[#0a7a6b] transition-colors flex items-center justify-center gap-3"
            >
              <ShoppingBag size={24} />
              Seguir Comprando
            </Link>

            <Link
              to="/"
              className="flex-1 bg-white/20 text-white py-4 px-6 rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center justify-center gap-3"
            >
              <Home size={24} />
              Ir al Inicio
            </Link>
          </motion.div>

          {/* Mensaje especial para clientes frecuentes */}
          {state.isFrequentCustomer && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="mt-8 bg-green-500/20 border border-green-500/50 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle size={24} className="text-green-400" />
                <h4 className="text-green-200 font-semibold">
                  ¡Cliente Frecuente!
                </h4>
              </div>
              <p className="text-green-100">
                Gracias por tu fidelidad. Has recibido un descuento especial del
                15% por ser un cliente frecuente. ¡Sigue disfrutando de nuestros
                servicios y productos!
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
