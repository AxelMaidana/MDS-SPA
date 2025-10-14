import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Building,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Provider } from "../../types/products";
import toast from "react-hot-toast";

interface ProviderFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
}

const AdminProviders = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [formData, setFormData] = useState<ProviderFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    contactPerson: "",
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [providers, searchTerm]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const providersQuery = collection(db, "providers");
      const snapshot = await getDocs(providersQuery);

      const providersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Provider[];

      setProviders(providersData);
    } catch (error) {
      console.error("Error fetching providers:", error);
      toast.error("Error al cargar proveedores");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...providers];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (provider) =>
          provider.name.toLowerCase().includes(search) ||
          provider.email.toLowerCase().includes(search) ||
          provider.contactPerson.toLowerCase().includes(search) ||
          provider.address.toLowerCase().includes(search)
      );
    }

    setFilteredProviders(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      if (editingProvider) {
        // Actualizar proveedor existente
        const providerRef = doc(db, "providers", editingProvider.id);
        await updateDoc(providerRef, {
          ...formData,
          updatedAt: new Date(),
        });

        // Actualizar estado local
        setProviders((prev) =>
          prev.map((provider) =>
            provider.id === editingProvider.id
              ? { ...provider, ...formData, updatedAt: new Date() }
              : provider
          )
        );

        toast.success("Proveedor actualizado exitosamente");
      } else {
        // Crear nuevo proveedor
        const newProvider = {
          ...formData,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const docRef = await addDoc(collection(db, "providers"), newProvider);

        // Actualizar estado local
        setProviders((prev) => [...prev, { id: docRef.id, ...newProvider }]);

        toast.success("Proveedor creado exitosamente");
      }

      // Limpiar formulario
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        contactPerson: "",
      });
      setEditingProvider(null);
      setShowForm(false);
    } catch (error) {
      console.error("Error saving provider:", error);
      toast.error("Error al guardar el proveedor");
    }
  };

  const handleEdit = (provider: Provider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      email: provider.email,
      phone: provider.phone,
      address: provider.address,
      contactPerson: provider.contactPerson,
    });
    setShowForm(true);
  };

  const handleDelete = async (providerId: string, providerName: string) => {
    if (
      !confirm(
        `¿Estás seguro de que quieres eliminar el proveedor "${providerName}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, "providers", providerId));

      // Actualizar estado local
      setProviders((prev) =>
        prev.filter((provider) => provider.id !== providerId)
      );

      toast.success("Proveedor eliminado exitosamente");
    } catch (error) {
      console.error("Error deleting provider:", error);
      toast.error("Error al eliminar el proveedor");
    }
  };

  const handleToggleStatus = async (
    providerId: string,
    currentStatus: boolean
  ) => {
    try {
      const providerRef = doc(db, "providers", providerId);
      await updateDoc(providerRef, {
        isActive: !currentStatus,
        updatedAt: new Date(),
      });

      // Actualizar estado local
      setProviders((prev) =>
        prev.map((provider) =>
          provider.id === providerId
            ? { ...provider, isActive: !currentStatus, updatedAt: new Date() }
            : provider
        )
      );

      toast.success(
        `Proveedor ${!currentStatus ? "activado" : "desactivado"} exitosamente`
      );
    } catch (error) {
      console.error("Error updating provider status:", error);
      toast.error("Error al actualizar el proveedor");
    }
  };

  const cancelEdit = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      contactPerson: "",
    });
    setEditingProvider(null);
    setShowForm(false);
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tipo-dancing">
              Gestión de Proveedores
            </h1>
            <p className="text-white/80">
              Administra los proveedores de productos
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#0C9383] text-white px-6 py-3 rounded-xl hover:bg-[#0a7a6b] transition-colors mt-4 md:mt-0"
          >
            <Plus size={20} />
            Agregar Proveedor
          </button>
        </div>

        {/* Formulario */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8"
          >
            <h3 className="text-xl font-bold text-white mb-6">
              {editingProvider ? "Editar Proveedor" : "Nuevo Proveedor"}
            </h3>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-white font-medium mb-2">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                  placeholder="Nombre de la empresa"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Persona de Contacto
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactPerson: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                  placeholder="Nombre del contacto"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                  placeholder="email@proveedor.com"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                  placeholder="+54 9 11 1234-5678"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-white font-medium mb-2">
                  Dirección
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                  rows={3}
                  placeholder="Dirección completa"
                />
              </div>

              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  className="bg-[#0C9383] text-white px-6 py-3 rounded-lg hover:bg-[#0a7a6b] transition-colors"
                >
                  {editingProvider ? "Actualizar" : "Crear"} Proveedor
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-white/20 text-white px-6 py-3 rounded-lg hover:bg-white/30 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Filtros */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Buscar proveedores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0C9383] focus:border-transparent"
                />
              </div>
            </div>

            <div className="text-white/70">
              {filteredProviders.length} proveedor
              {filteredProviders.length !== 1 ? "es" : ""} encontrado
              {filteredProviders.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Lista de proveedores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((provider, index) => (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 hover:bg-white/15 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#0C9383]/20 p-3 rounded-full">
                    <Building size={24} className="text-[#0C9383]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {provider.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {provider.isActive ? (
                        <CheckCircle size={16} className="text-green-400" />
                      ) : (
                        <AlertCircle size={16} className="text-red-400" />
                      )}
                      <span
                        className={`text-sm ${
                          provider.isActive ? "text-green-300" : "text-red-300"
                        }`}
                      >
                        {provider.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {provider.contactPerson && (
                  <div className="flex items-center gap-3 text-white/80">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                    </div>
                    <span className="text-sm">{provider.contactPerson}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 text-white/80">
                  <Mail size={16} className="text-white/60" />
                  <span className="text-sm">{provider.email}</span>
                </div>

                <div className="flex items-center gap-3 text-white/80">
                  <Phone size={16} className="text-white/60" />
                  <span className="text-sm">{provider.phone}</span>
                </div>

                {provider.address && (
                  <div className="flex items-start gap-3 text-white/80">
                    <MapPin
                      size={16}
                      className="text-white/60 mt-0.5 flex-shrink-0"
                    />
                    <span className="text-sm">{provider.address}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(provider)}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors text-sm"
                >
                  <Edit size={16} />
                  Editar
                </button>
                <button
                  onClick={() =>
                    handleToggleStatus(provider.id, provider.isActive)
                  }
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    provider.isActive
                      ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                      : "bg-green-500/20 text-green-300 hover:bg-green-500/30"
                  }`}
                >
                  {provider.isActive ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => handleDelete(provider.id, provider.name)}
                  className="p-2 text-white/70 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredProviders.length === 0 && (
          <div className="text-center py-12">
            <Building size={48} className="text-white/30 mx-auto mb-4" />
            <p className="text-white/70">No se encontraron proveedores</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProviders;
