import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Package,
  Users,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
} from "lucide-react";
import {
  Order,
  SalesReport,
  InventoryReport,
  ProductCategory,
} from "../../types/products";

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  todaySales: number;
  todayOrders: number;
}

const SalesDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    todaySales: 0,
    todayOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días atrás
    end: new Date(),
  });

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Obtener estadísticas generales
      const [ordersSnapshot, productsSnapshot, usersSnapshot] =
        await Promise.all([
          getDocs(collection(db, "orders")),
          getDocs(
            query(collection(db, "products"), where("isActive", "==", true))
          ),
          getDocs(
            query(collection(db, "users"), where("role", "==", "client"))
          ),
        ]);

      const orders = ordersSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Order)
      );
      const products = productsSnapshot.docs;
      const customers = usersSnapshot.docs;

      // Calcular estadísticas
      const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
      const totalOrders = orders.length;

      // Ventas de hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = orders.filter((order) => {
        const orderDate = order.createdAt?.toDate
          ? order.createdAt.toDate()
          : new Date(order.createdAt);
        return orderDate >= today;
      });
      const todaySales = todayOrders.reduce(
        (sum, order) => sum + order.total,
        0
      );

      // Órdenes recientes
      const recentOrdersData = orders
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate
            ? a.createdAt.toDate()
            : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate
            ? b.createdAt.toDate()
            : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 10);

      setStats({
        totalSales,
        totalOrders,
        totalProducts: products.length,
        totalCustomers: customers.length,
        todaySales,
        todayOrders: todayOrders.length,
      });

      setRecentOrders(recentOrdersData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSalesReport = () => {
    // Implementar generación de reporte de ventas
    console.log("Generando reporte de ventas...");
  };

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString("es-AR");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0C9383] to-[#01f891] pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C9383] to-[#01f891] pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tipo-dancing">
            Dashboard de Ventas
          </h1>
          <p className="text-white/80">
            Panel de control para gestión de ventas y productos
          </p>
        </div>

        {/* Filtros de fecha */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-white font-medium">Período:</label>
              <input
                type="date"
                value={dateRange.start.toISOString().split("T")[0]}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    start: new Date(e.target.value),
                  }))
                }
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
              />
              <span className="text-white">a</span>
              <input
                type="date"
                value={dateRange.end.toISOString().split("T")[0]}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    end: new Date(e.target.value),
                  }))
                }
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={generateSalesReport}
                className="flex items-center gap-2 bg-[#0C9383] text-white px-4 py-2 rounded-lg hover:bg-[#0a7a6b] transition-colors"
              >
                <Download size={20} />
                Exportar Reporte
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Ventas Totales</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(stats.totalSales)}
                </p>
              </div>
              <div className="bg-[#0C9383]/20 p-3 rounded-full">
                <DollarSign size={24} className="text-[#0C9383]" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Órdenes Totales</p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalOrders}
                </p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-full">
                <ShoppingBag size={24} className="text-blue-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Productos Activos</p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalProducts}
                </p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-full">
                <Package size={24} className="text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Clientes</p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalCustomers}
                </p>
              </div>
              <div className="bg-purple-500/20 p-3 rounded-full">
                <Users size={24} className="text-purple-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Ventas Hoy</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(stats.todaySales)}
                </p>
              </div>
              <div className="bg-yellow-500/20 p-3 rounded-full">
                <TrendingUp size={24} className="text-yellow-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Órdenes Hoy</p>
                <p className="text-2xl font-bold text-white">
                  {stats.todayOrders}
                </p>
              </div>
              <div className="bg-orange-500/20 p-3 rounded-full">
                <Calendar size={24} className="text-orange-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Órdenes recientes */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Órdenes Recientes</h2>
            <button className="text-white/70 hover:text-white transition-colors">
              Ver todas
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag size={48} className="text-white/30 mx-auto mb-4" />
              <p className="text-white/70">No hay órdenes recientes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left text-white/70 py-3">Orden</th>
                    <th className="text-left text-white/70 py-3">Cliente</th>
                    <th className="text-left text-white/70 py-3">Fecha</th>
                    <th className="text-left text-white/70 py-3">Método</th>
                    <th className="text-left text-white/70 py-3">Total</th>
                    <th className="text-left text-white/70 py-3">Estado</th>
                    <th className="text-left text-white/70 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, index) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="border-b border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 text-white font-medium">
                        {order.orderNumber}
                      </td>
                      <td className="py-4 text-white/80">{order.userId}</td>
                      <td className="py-4 text-white/80">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-4 text-white/80">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            order.paymentMethod === "efectivo"
                              ? "bg-green-500/20 text-green-300"
                              : order.paymentMethod === "debito"
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-purple-500/20 text-purple-300"
                          }`}
                        >
                          {order.paymentMethod === "efectivo"
                            ? "Efectivo"
                            : order.paymentMethod === "debito"
                            ? "Débito"
                            : "Crédito"}
                        </span>
                      </td>
                      <td className="py-4 text-white font-semibold">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            order.status === "completed"
                              ? "bg-green-500/20 text-green-300"
                              : order.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-300"
                              : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {order.status === "completed"
                            ? "Completada"
                            : order.status === "pending"
                            ? "Pendiente"
                            : "Cancelada"}
                        </span>
                      </td>
                      <td className="py-4">
                        <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                          <Eye size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
