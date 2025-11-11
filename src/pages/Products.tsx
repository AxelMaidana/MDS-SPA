import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  ShoppingCart,
  Heart,
  Star,
  Grid,
  List,
} from "lucide-react";
import { motion } from "framer-motion";
import { useProducts } from "../hooks/useProducts";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoritesContext";
import {
  ProductType,
  ProductCategory,
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
} from "../types/products";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<ProductType | "">("");
  const [selectedCategory, setSelectedCategory] = useState<
    ProductCategory | ""
  >("");
  const [sortBy, setSortBy] = useState<
    "name" | "price-asc" | "price-desc" | "newest"
  >("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const { products, loading, error } = useProducts({
    type: selectedType || undefined,
    category: selectedCategory || undefined,
    search: searchTerm || undefined,
  });

  const { addToCart, getCartItemCount } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

  // Filtrar y ordenar productos
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Ordenar productos
    switch (sortBy) {
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "newest":
      default:
        // Ya viene ordenado por fecha de creación
        break;
    }

    return filtered;
  }, [products, sortBy]);

  const handleAddToCart = async (product: any) => {
    await addToCart(product, 1);
  };

  const handleToggleFavorite = async (product: any) => {
    if (isFavorite(product.id)) {
      await removeFromFavorites(product.id);
    } else {
      await addToFavorites(product);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("");
    setSelectedCategory("");
    setSortBy("newest");
  };

  const getFilteredCategories = () => {
    if (!selectedType) return Object.values(PRODUCT_CATEGORIES);
    return Object.values(PRODUCT_CATEGORIES).filter(
      (cat) => cat.type === selectedType
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-800">
            <h2 className="text-2xl font-bold mb-4">
              Error al cargar productos
            </h2>
            <p className="text-lg">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            className="text-4xl md:text-5xl font-bold text-gray-800 mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Nuestros Productos
          </motion.h1>
          <motion.p
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Descubre nuestra selección cuidadosa de productos de estética y
            relajación para tu bienestar
          </motion.p>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtros móviles */}
            <div className="lg:hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <Filter size={20} />
                Filtros
              </button>
            </div>

            {/* Vista y ordenamiento */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
              >
                <option value="newest">Más recientes</option>
                <option value="name">Nombre A-Z</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
              </select>

              <div className="flex bg-gray-100 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-3 transition-colors ${
                    viewMode === "grid" ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                >
                  <Grid size={20} className="text-gray-700" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-3 transition-colors ${
                    viewMode === "list" ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                >
                  <List size={20} className="text-gray-700" />
                </button>
              </div>
            </div>
          </div>

          {/* Filtros expandibles */}
          <div className={`mt-4 ${showFilters ? "block" : "hidden lg:block"}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo de producto */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Tipo de Producto
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedType("")}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedType === ""
                        ? "bg-[#0C9383] text-white"
                        : "bg-gray-100 text-black hover:bg-gray-200"
                    }`}
                  >
                    Todos
                  </button>
                  {Object.entries(PRODUCT_TYPES).map(([key, type]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedType(key as ProductType)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        selectedType === key
                          ? "bg-[#0C9383] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {type.icon} {type.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Categoría
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedCategory === ""
                        ? "bg-[#0C9383] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Todas
                  </button>
                  {getFilteredCategories().map((category) => (
                    <button
                      key={category.id}
                      onClick={() =>
                        setSelectedCategory(category.id as ProductCategory)
                      }
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? "bg-[#0C9383] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {category.icon} {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Limpiar filtros */}
            <div className="mt-4">
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-red-500/50 text-white rounded-lg hover:bg-red-500/80 transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Carrito flotante */}
        <div className="fixed bottom-20 right-4 z-40">
          <Link
            to="/cart"
            className="bg-[#0C9383] text-white w-[60px] h-[60px] rounded-full shadow-xl hover:bg-[#0a7a6b] hover:shadow-2xl transition-all duration-300 flex items-center justify-center relative border-2 border-white/20"
          >
            <ShoppingCart size={24} />
            {getCartItemCount() > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg border-2 border-white">
                {getCartItemCount()}
              </span>
            )}
          </Link>
        </div>

        {/* Resultados */}
        <div className="mb-4">
          <p className="text-gray-800">
            {filteredProducts.length} producto
            {filteredProducts.length !== 1 ? "s" : ""} encontrado
            {filteredProducts.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Grid de productos */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-800 text-xl mb-4">
              No se encontraron productos
            </div>
            <p className="text-gray-600">
              Intenta ajustar los filtros o términos de búsqueda
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            }`}
          >
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden hover:bg-white/20 transition-all duration-300 hover:scale-105"
              >
                <Link to={`/products/${product.id}`}>
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={product.images[0] || "/product.png"}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleFavorite(product);
                        }}
                        className="p-2 bg-white shadow-sm rounded-full hover:bg-gray-50 transition-colors"
                      >
                        <Heart
                          size={20}
                          className={`transition-colors ${
                            isFavorite(product.id)
                              ? "text-red-500 fill-red-500"
                              : "text-gray-600"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </Link>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold text-gray-800">
                        ${product.price.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star
                        size={16}
                        className="text-yellow-400 fill-yellow-400"
                      />
                      <span className="text-gray-600 text-sm">4.8</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">
                      {product.stock > 0
                        ? `${product.stock} disponibles`
                        : "Sin stock"}
                    </span>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className="px-4 py-2 bg-[#0C9383] text-white rounded-lg hover:bg-[#0a7a6b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <ShoppingCart size={16} />
                      Agregar
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
