import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { motion } from "framer-motion";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
} from "lucide-react";
import {
  Order,
  SalesReport,
  ProductCategory,
  PRODUCT_CATEGORIES,
} from "../../types/products";

interface ReportFilters {
  startDate: string;
  endDate: string;
  reportType: "daily" | "range";
}

interface SalesData {
  totalSales: number;
  totalOrders: number;
  cashSales: number;
  debitSales: number;
  creditSales: number;
  categoryBreakdown: Record<ProductCategory, number>;
  typeBreakdown: {
    estetica: number;
    relajacion: number;
  };
  dailySales: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
}

const ReportsPage = () => {
  const [salesData, setSalesData] = useState<SalesData>({
    totalSales: 0,
    totalOrders: 0,
    cashSales: 0,
    debitSales: 0,
    creditSales: 0,
    categoryBreakdown: {} as Record<ProductCategory, number>,
    typeBreakdown: { estetica: 0, relajacion: 0 },
    dailySales: [],
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reportType: "range",
  });

  useEffect(() => {
    generateReport();
  }, [filters]);

  const generateReport = async () => {
    try {
      setLoading(true);

      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);

      // Obtener órdenes del período
      const ordersQuery = query(
        collection(db, "orders"),
        where("createdAt", ">=", Timestamp.fromDate(startDate)),
        where("createdAt", "<=", Timestamp.fromDate(endDate)),
        orderBy("createdAt", "desc")
      );

      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];

      // Calcular estadísticas
      const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
      const totalOrders = orders.length;

      // Desglose por método de pago
      const cashSales = orders
        .filter((order) => order.paymentMethod === "efectivo")
        .reduce((sum, order) => sum + order.total, 0);

      const debitSales = orders
        .filter((order) => order.paymentMethod === "debito")
        .reduce((sum, order) => sum + order.total, 0);

      const creditSales = orders
        .filter((order) => order.paymentMethod === "credito")
        .reduce((sum, order) => sum + order.total, 0);

      // Desglose por categoría y tipo
      const categoryBreakdown = {} as Record<ProductCategory, number>;
      const typeBreakdown = { estetica: 0, relajacion: 0 };

      orders.forEach((order) => {
        order.items.forEach((item) => {
          const category = item.product.category;
          const type = item.product.type;

          categoryBreakdown[category] =
            (categoryBreakdown[category] || 0) + item.price * item.quantity;
          typeBreakdown[type] += item.price * item.quantity;
        });
      });

      // Ventas diarias
      const dailySalesMap = new Map<
        string,
        { sales: number; orders: number }
      >();

      orders.forEach((order) => {
        const date = order.createdAt?.toDate
          ? order.createdAt.toDate()
          : new Date(order.createdAt);
        const dateStr = date.toISOString().split("T")[0];

        if (!dailySalesMap.has(dateStr)) {
          dailySalesMap.set(dateStr, { sales: 0, orders: 0 });
        }

        const dayData = dailySalesMap.get(dateStr)!;
        dayData.sales += order.total;
        dayData.orders += 1;
      });

      const dailySales = Array.from(dailySalesMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setSalesData({
        totalSales,
        totalOrders,
        cashSales,
        debitSales,
        creditSales,
        categoryBreakdown,
        typeBreakdown,
        dailySales,
      });
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // Implementar exportación de reporte
    console.log("Exporting report...");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-AR");
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
            Informes de Ventas
          </h1>
          <p className="text-white/80">
            Análisis de flujo de caja y ventas por período
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-white font-medium mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={generateReport}
                className="flex items-center gap-2 bg-[#0C9383] text-white px-4 py-3 rounded-lg hover:bg-[#0a7a6b] transition-colors"
              >
                <Filter size={20} />
                Generar
              </button>
              <button
                onClick={exportReport}
                className="flex items-center gap-2 bg-white/20 text-white px-4 py-3 rounded-lg hover:bg-white/30 transition-colors"
              >
                <Download size={20} />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Resumen general */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Total Vendido</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(salesData.totalSales)}
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
                <p className="text-white/70 text-sm">Total Órdenes</p>
                <p className="text-2xl font-bold text-white">
                  {salesData.totalOrders}
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
                <p className="text-white/70 text-sm">Promedio por Orden</p>
                <p className="text-2xl font-bold text-white">
                  {salesData.totalOrders > 0
                    ? formatCurrency(
                        salesData.totalSales / salesData.totalOrders
                      )
                    : "$0"}
                </p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-full">
                <TrendingUp size={24} className="text-green-400" />
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
                <p className="text-white/70 text-sm">Período</p>
                <p className="text-lg font-bold text-white">
                  {formatDate(filters.startDate)} -{" "}
                  {formatDate(filters.endDate)}
                </p>
              </div>
              <div className="bg-purple-500/20 p-3 rounded-full">
                <Calendar size={24} className="text-purple-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Desglose por método de pago */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <BarChart3 size={24} />
              Desglose por Método de Pago
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-white">Efectivo</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">
                    {formatCurrency(salesData.cashSales)}
                  </div>
                  <div className="text-white/60 text-sm">
                    {salesData.totalSales > 0
                      ? (
                          (salesData.cashSales / salesData.totalSales) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-white">Débito</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">
                    {formatCurrency(salesData.debitSales)}
                  </div>
                  <div className="text-white/60 text-sm">
                    {salesData.totalSales > 0
                      ? (
                          (salesData.debitSales / salesData.totalSales) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center py-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-white">Crédito</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">
                    {formatCurrency(salesData.creditSales)}
                  </div>
                  <div className="text-white/60 text-sm">
                    {salesData.totalSales > 0
                      ? (
                          (salesData.creditSales / salesData.totalSales) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <PieChart size={24} />
              Desglose por Tipo de Producto
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                  <span className="text-white">Estética</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">
                    {formatCurrency(salesData.typeBreakdown.estetica)}
                  </div>
                  <div className="text-white/60 text-sm">
                    {salesData.totalSales > 0
                      ? (
                          (salesData.typeBreakdown.estetica /
                            salesData.totalSales) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center py-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                  <span className="text-white">Relajación</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">
                    {formatCurrency(salesData.typeBreakdown.relajacion)}
                  </div>
                  <div className="text-white/60 text-sm">
                    {salesData.totalSales > 0
                      ? (
                          (salesData.typeBreakdown.relajacion /
                            salesData.totalSales) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desglose por categoría */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-6">
            Desglose por Categoría
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(salesData.categoryBreakdown).map(
              ([category, amount]) => {
                const categoryInfo =
                  PRODUCT_CATEGORIES[category as ProductCategory];
                if (!categoryInfo) return null;

                return (
                  <div key={category} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{categoryInfo.icon}</span>
                      <span className="text-white font-medium">
                        {categoryInfo.name}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(amount)}
                    </div>
                    <div className="text-white/60 text-sm">
                      {salesData.totalSales > 0
                        ? ((amount / salesData.totalSales) * 100).toFixed(1)
                        : 0}
                      % del total
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Ventas diarias */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Ventas Diarias</h3>

          {salesData.dailySales.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={48} className="text-white/30 mx-auto mb-4" />
              <p className="text-white/70">
                No hay datos de ventas para el período seleccionado
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left text-white/70 py-3">Fecha</th>
                    <th className="text-left text-white/70 py-3">Ventas</th>
                    <th className="text-left text-white/70 py-3">Órdenes</th>
                    <th className="text-left text-white/70 py-3">Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.dailySales.map((day, index) => (
                    <tr
                      key={day.date}
                      className="border-b border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 text-white">
                        {formatDate(day.date)}
                      </td>
                      <td className="py-3 text-white font-semibold">
                        {formatCurrency(day.sales)}
                      </td>
                      <td className="py-3 text-white/80">{day.orders}</td>
                      <td className="py-3 text-white/80">
                        {day.orders > 0
                          ? formatCurrency(day.sales / day.orders)
                          : "$0"}
                      </td>
                    </tr>
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

export default ReportsPage;
