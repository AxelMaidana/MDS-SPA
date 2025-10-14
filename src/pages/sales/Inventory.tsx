import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../firebase/config";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Package,
  AlertTriangle,
  CheckCircle,
  Eye,
} from "lucide-react";
import {
  Product,
  ProductType,
  ProductCategory,
  PRODUCT_CATEGORIES,
} from "../../types/products";

interface InventoryFilters {
  search: string;
  type: ProductType | "";
  category: ProductCategory | "";
  stockStatus: "all" | "low" | "out";
}

const InventoryPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<InventoryFilters>({
    search: "",
    type: "",
    category: "",
    stockStatus: "all",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsQuery = query(
        collection(db, "products"),
        where("isActive", "==", true),
        orderBy("name")
      );

      const snapshot = await getDocs(productsQuery);
      const productsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];

      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Filtro de búsqueda
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.sku.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por tipo
    if (filters.type) {
      filtered = filtered.filter((product) => product.type === filters.type);
    }

    // Filtro por categoría
    if (filters.category) {
      filtered = filtered.filter(
        (product) => product.category === filters.category
      );
    }

    // Filtro por estado de stock
    switch (filters.stockStatus) {
      case "low":
        filtered = filtered.filter(
          (product) => product.stock > 0 && product.stock <= 10
        );
        break;
      case "out":
        filtered = filtered.filter((product) => product.stock === 0);
        break;
      case "all":
      default:
        break;
    }

    setFilteredProducts(filtered);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0)
      return { status: "out", label: "Sin stock", color: "text-red-400" };
    if (stock <= 10)
      return { status: "low", label: "Stock bajo", color: "text-yellow-400" };
    return { status: "good", label: "En stock", color: "text-green-400" };
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      type: "",
      category: "",
      stockStatus: "all",
    });
  };

  const getFilteredCategories = () => {
    if (!filters.type) return Object.values(PRODUCT_CATEGORIES);
    return Object.values(PRODUCT_CATEGORIES).filter(
      (cat) => cat.type === filters.type
    );
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
            Consulta de Inventario
          </h1>
          <p className="text-white/80">
            Consulta la existencia de productos por tipo, categoría y nombre
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Búsqueda */}
            <div className="lg:col-span-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                />
              </div>
            </div>

            {/* Tipo de producto */}
            <div>
              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    type: e.target.value as ProductType | "",
                  }))
                }
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
              >
                <option value="">Todos los tipos</option>
                <option value="estetica">Estética</option>
                <option value="relajacion">Relajación</option>
              </select>
            </div>

            {/* Categoría */}
            <div>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    category: e.target.value as ProductCategory | "",
                  }))
                }
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
              >
                <option value="">Todas las categorías</option>
                {getFilteredCategories().map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado de stock */}
            <div>
              <select
                value={filters.stockStatus}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    stockStatus: e.target.value as any,
                  }))
                }
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="low">Stock bajo (≤10)</option>
                <option value="out">Sin stock</option>
              </select>
            </div>
          </div>

          {/* Botón limpiar filtros */}
          <div className="flex justify-between items-center">
            <div className="text-white/70">
              {filteredProducts.length} producto
              {filteredProducts.length !== 1 ? "s" : ""} encontrado
              {filteredProducts.length !== 1 ? "s" : ""}
            </div>
            <button
              onClick={clearFilters}
              className="text-white/70 hover:text-white transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Alertas de stock bajo */}
        {filteredProducts.some((p) => p.stock <= 10 && p.stock > 0) && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} className="text-yellow-400" />
              <div>
                <h4 className="text-yellow-200 font-semibold">
                  Productos con stock bajo
                </h4>
                <p className="text-yellow-100 text-sm">
                  Hay{" "}
                  {
                    filteredProducts.filter((p) => p.stock <= 10 && p.stock > 0)
                      .length
                  }{" "}
                  productos con stock bajo o agotándose
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de productos */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left text-white/70 py-4 px-6">
                    Producto
                  </th>
                  <th className="text-left text-white/70 py-4 px-6">SKU</th>
                  <th className="text-left text-white/70 py-4 px-6">
                    Categoría
                  </th>
                  <th className="text-left text-white/70 py-4 px-6">Precio</th>
                  <th className="text-left text-white/70 py-4 px-6">Stock</th>
                  <th className="text-left text-white/70 py-4 px-6">Estado</th>
                  <th className="text-left text-white/70 py-4 px-6">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => {
                  const stockStatus = getStockStatus(product.stock);
                  const categoryInfo = PRODUCT_CATEGORIES[product.category];

                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={product.images[0] || "/product.png"}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="text-white font-medium">
                              {product.name}
                            </div>
                            <div className="text-white/60 text-sm line-clamp-1">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-white/80 font-mono text-sm">
                        {product.sku}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{categoryInfo.icon}</span>
                          <span className="text-white/80">
                            {categoryInfo.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-white font-semibold">
                        ${product.price.toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-white font-medium">
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {stockStatus.status === "good" ? (
                            <CheckCircle size={16} className="text-green-400" />
                          ) : stockStatus.status === "low" ? (
                            <AlertTriangle
                              size={16}
                              className="text-yellow-400"
                            />
                          ) : (
                            <AlertTriangle size={16} className="text-red-400" />
                          )}
                          <span className={`text-sm ${stockStatus.color}`}>
                            {stockStatus.label}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                          <Eye size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package size={48} className="text-white/30 mx-auto mb-4" />
              <p className="text-white/70">No se encontraron productos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
