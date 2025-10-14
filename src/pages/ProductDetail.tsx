import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  ShoppingCart,
  Star,
  Check,
  Minus,
  Plus,
  Share2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useProduct } from "../hooks/useProducts";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoritesContext";
import { PRODUCT_CATEGORIES } from "../types/products";

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const { product, loading, error } = useProduct(productId || "");
  const { addToCart, getCartItemCount } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleAddToCart = async () => {
    if (!product) return;

    await addToCart(product, quantity);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleToggleFavorite = async () => {
    if (!product) return;

    if (isFavorite(product.id)) {
      await removeFromFavorites(product.id);
    } else {
      await addToFavorites(product);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (product && newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return <Navigate to="/products" replace />;
  }

  const categoryInfo = PRODUCT_CATEGORIES[product.category];

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Imágenes */}
          <div className="space-y-4">
            {/* Imagen principal */}
            <div className="aspect-square bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
              <img
                src={product.images[selectedImageIndex] || "/product.png"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Miniaturas */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden ${
                      selectedImageIndex === index
                        ? "ring-2 ring-white"
                        : "opacity-70 hover:opacity-100"
                    } transition-opacity`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Categoría */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{categoryInfo.icon}</span>
                <span className="text-gray-600 text-sm">
                  {categoryInfo.name} •{" "}
                  {categoryInfo.type === "estetica" ? "Estética" : "Relajación"}
                </span>
              </div>

              {/* Nombre */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                {product.name}
              </h1>

              {/* Descripción */}
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Precio */}
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-800">
                  ${product.price.toLocaleString()}
                </span>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className="text-yellow-400 fill-yellow-400"
                      />
                    ))}
                  </div>
                  <span className="text-gray-600">(4.8) • 24 reseñas</span>
                </div>
              </div>

              {/* Stock */}
              <div className="flex items-center gap-2 mb-6">
                {product.stock > 0 ? (
                  <>
                    <Check className="text-green-400" size={20} />
                    <span className="text-green-400 font-medium">
                      {product.stock} disponibles
                    </span>
                  </>
                ) : (
                  <span className="text-red-400 font-medium">Sin stock</span>
                )}
              </div>

              {/* Cantidad */}
              {product.stock > 0 && (
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-gray-700 font-medium">Cantidad:</span>
                  <div className="flex items-center bg-gray-100 border border-gray-200 rounded-lg">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="p-3 hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      <Minus size={20} className="text-gray-600" />
                    </button>
                    <span className="px-4 py-3 text-gray-800 font-medium min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= product.stock}
                      className="p-3 hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      <Plus size={20} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-[#0C9383] text-white py-4 px-6 rounded-xl font-semibold hover:bg-[#0a7a6b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  <ShoppingCart size={24} />
                  Agregar al Carrito
                  {getCartItemCount() > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                      {getCartItemCount()}
                    </span>
                  )}
                </button>

                <button
                  onClick={handleToggleFavorite}
                  className="p-4 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition-colors"
                >
                  <Heart
                    size={24}
                    className={`transition-colors ${
                      isFavorite(product.id)
                        ? "text-red-500 fill-red-500"
                        : "text-gray-600"
                    }`}
                  />
                </button>

                <button
                  onClick={handleShare}
                  className="p-4 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <Share2 size={24} className="text-gray-600" />
                </button>
              </div>

              {/* Mensaje de éxito */}
              {showSuccessMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-green-200"
                >
                  ¡Producto agregado al carrito exitosamente!
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Características */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Características
            </h3>
            <ul className="space-y-2">
              {product.features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 text-gray-700"
                >
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Beneficios */}
          {product.benefits && product.benefits.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Beneficios
              </h3>
              <ul className="space-y-2">
                {product.benefits.map((benefit, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-3 text-gray-700"
                  >
                    <Star size={16} className="text-yellow-400 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ingredientes */}
          {product.ingredients && product.ingredients.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Ingredientes
              </h3>
              <p className="text-gray-700">{product.ingredients.join(", ")}</p>
            </div>
          )}

          {/* Instrucciones de uso */}
          {product.usage && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Instrucciones de Uso
              </h3>
              <p className="text-gray-700">{product.usage}</p>
            </div>
          )}
        </div>

        {/* Productos relacionados */}
        <div className="mt-12">
          <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Productos Relacionados
          </h3>
          <div className="text-center">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-[#0C9383] text-white px-6 py-3 rounded-xl hover:bg-[#0a7a6b] transition-colors"
            >
              Ver todos los productos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
