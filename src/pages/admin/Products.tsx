import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase/config";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Package,
  AlertTriangle,
  CheckCircle,
  Filter,
  X,
  Upload,
  Loader2,
} from "lucide-react";
import {
  Product,
  ProductType,
  ProductCategory,
  PRODUCT_CATEGORIES,
} from "../../types/products";
import toast from "react-hot-toast";

interface ProductFilters {
  search: string;
  type: ProductType | "";
  category: ProductCategory | "";
  status: "all" | "active" | "inactive";
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  type: ProductType;
  category: ProductCategory;
  stock: number;
  sku: string;
  images: string[];
  features: string[];
  benefits: string[];
  ingredients: string[];
  usageInstructions: string;
  isActive: boolean;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [filters, setFilters] = useState<ProductFilters>({
    search: "",
    type: "",
    category: "",
    status: "all",
  });

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: 0,
    type: "estetica",
    category: "skincare",
    stock: 0,
    sku: "",
    images: [],
    features: [],
    benefits: [],
    ingredients: [],
    usageInstructions: "",
    isActive: true,
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
        where("isActive", "!=", null)
      );

      const snapshot = await getDocs(productsQuery);
      const productsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];

      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Error al cargar productos");
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

    // Filtro por estado
    switch (filters.status) {
      case "active":
        filtered = filtered.filter((product) => product.isActive);
        break;
      case "inactive":
        filtered = filtered.filter((product) => !product.isActive);
        break;
      case "all":
      default:
        break;
    }

    setFilteredProducts(filtered);
  };

  const handleToggleStatus = async (
    productId: string,
    currentStatus: boolean
  ) => {
    try {
      const productRef = doc(db, "products", productId);
      await updateDoc(productRef, {
        isActive: !currentStatus,
        updatedAt: new Date(),
      });

      // Actualizar estado local
      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId
            ? { ...product, isActive: !currentStatus, updatedAt: new Date() }
            : product
        )
      );

      toast.success(
        `Producto ${!currentStatus ? "activado" : "desactivado"} exitosamente`
      );
    } catch (error) {
      console.error("Error updating product status:", error);
      toast.error("Error al actualizar el producto");
    }
  };

  const handleDeleteProduct = async (
    productId: string,
    productName: string
  ) => {
    if (
      !confirm(
        `¿Estás seguro de que quieres eliminar "${productName}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, "products", productId));

      // Actualizar estado local
      setProducts((prev) => prev.filter((product) => product.id !== productId));

      toast.success("Producto eliminado exitosamente");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error al eliminar el producto");
    }
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
      status: "all",
    });
  };

  const getFilteredCategories = () => {
    if (!filters.type) return Object.values(PRODUCT_CATEGORIES);
    return Object.values(PRODUCT_CATEGORIES).filter(
      (cat) => cat.type === filters.type
    );
  };

  const generateSKU = () => {
    const prefix = formData.type === "estetica" ? "EST" : "REL";
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `${prefix}-${randomNum}`;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles(files);

      const previews = files.map((file) => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "stock" ? Number(value) : value,
    }));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.description ||
      !formData.price ||
      !formData.stock
    ) {
      toast.error("Por favor complete todos los campos requeridos");
      return;
    }

    if (imageFiles.length === 0) {
      toast.error("Por favor seleccione al menos una imagen");
      return;
    }

    setFormLoading(true);

    try {
      // Subir imágenes
      const imageUrls: string[] = [];
      for (const file of imageFiles) {
        const imageRef = ref(storage, `products/${Date.now()}-${file.name}`);
        const snapshot = await uploadBytes(imageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        imageUrls.push(downloadURL);
      }

      // Generar SKU si no se proporcionó
      const sku = formData.sku || generateSKU();

      // Crear producto
      const productData = {
        ...formData,
        sku,
        images: imageUrls,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "products"), productData);

      toast.success("Producto agregado exitosamente");
      setShowAddModal(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Error al agregar el producto");
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      type: "estetica",
      category: "skincare",
      stock: 0,
      sku: "",
      images: [],
      features: [],
      benefits: [],
      ingredients: [],
      usageInstructions: "",
      isActive: true,
    });
    setImageFiles([]);
    setImagePreviews([]);
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

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 tipo-dancing">
              Gestión de Productos
            </h1>
            <p className="text-gray-600">
              Administra el catálogo de productos del spa
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#0C9383] text-white px-6 py-3 rounded-xl hover:bg-[#0a7a6b] transition-colors mt-4 md:mt-0"
          >
            <Plus size={20} />
            Agregar Producto
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Búsqueda */}
            <div className="lg:col-span-2">
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

            {/* Estado */}
            <div>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: e.target.value as any,
                  }))
                }
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
          </div>

          {/* Botón limpiar filtros */}
          <div className="flex justify-between items-center">
            <div className="text-gray-600">
              {filteredProducts.length} producto
              {filteredProducts.length !== 1 ? "s" : ""} encontrado
              {filteredProducts.length !== 1 ? "s" : ""}
            </div>
            <button
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Tabla de productos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-gray-700 py-4 px-6">
                    Producto
                  </th>
                  <th className="text-left text-gray-700 py-4 px-6">SKU</th>
                  <th className="text-left text-gray-700 py-4 px-6">
                    Categoría
                  </th>
                  <th className="text-left text-gray-700 py-4 px-6">Precio</th>
                  <th className="text-left text-gray-700 py-4 px-6">Stock</th>
                  <th className="text-left text-gray-700 py-4 px-6">Estado</th>
                  <th className="text-left text-gray-700 py-4 px-6">
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
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={product.images[0] || "/product.png"}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="text-gray-800 font-medium">
                              {product.name}
                            </div>
                            <div className="text-gray-600 text-sm line-clamp-1">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-700 font-mono text-sm">
                        {product.sku}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{categoryInfo.icon}</span>
                          <span className="text-gray-700">
                            {categoryInfo.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-800 font-semibold">
                        ${product.price.toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-800 font-medium">
                            {product.stock}
                          </span>
                          <div
                            className={`flex items-center gap-1 ${stockStatus.color}`}
                          >
                            {stockStatus.status === "good" ? (
                              <CheckCircle size={14} />
                            ) : (
                              <AlertTriangle size={14} />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() =>
                            handleToggleStatus(product.id, product.isActive)
                          }
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            product.isActive
                              ? "bg-green-500/20 text-green-300 hover:bg-green-500/30"
                              : "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                          }`}
                        >
                          {product.isActive ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                            <Eye size={16} />
                          </button>
                          <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteProduct(product.id, product.name)
                            }
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No se encontraron productos</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">
                Agregar Nuevo Producto
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={formLoading}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información básica */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Información Básica
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                      placeholder="Ej: Crema Hidratante Premium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                      placeholder="Describe el producto..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Precio *
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleFormChange}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stock *
                      </label>
                      <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleFormChange}
                        min="0"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                      placeholder="Se generará automáticamente si se deja vacío"
                    />
                  </div>
                </div>

                {/* Categorización */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Categorización
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Producto *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                      required
                    >
                      <option value="estetica">Estética</option>
                      <option value="relajacion">Relajación</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                      required
                    >
                      {Object.values(PRODUCT_CATEGORIES)
                        .filter((cat) => cat.type === formData.type)
                        .map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      name="isActive"
                      value={formData.isActive.toString()}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isActive: e.target.value === "true",
                        }))
                      }
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>

                  {/* Imágenes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Imágenes *
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                      required
                    />

                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={formLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#0C9383] text-white rounded-lg hover:bg-[#0a7a6b] transition-colors flex items-center gap-2"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      Agregar Producto
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
