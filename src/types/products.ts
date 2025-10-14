// Tipos para el sistema de productos del spa

export type ProductType = "estetica" | "relajacion";
export type ProductCategory =
  // Estética
  | "skincare"
  | "serum"
  | "cremas"
  // Relajación
  | "sales-bano"
  | "aceites-esenciales"
  | "velas";

export type PaymentMethod = "efectivo" | "debito" | "credito";

export interface Product {
  id: string;
  name: string;
  description: string;
  type: ProductType;
  category: ProductCategory;
  price: number;
  stock: number;
  images: string[];
  features: string[];
  ingredients?: string[];
  usage?: string;
  benefits?: string[];
  createdAt: any; // Firebase timestamp
  updatedAt: any; // Firebase timestamp
  isActive: boolean;
  providerId: string;
  sku: string;
}

export interface ProductCategoryInfo {
  id: string;
  name: string;
  type: ProductType;
  description: string;
  icon: string;
}

export interface Provider {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  createdAt: any;
  updatedAt: any;
  isActive: boolean;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number; // Precio al momento de agregar al carrito
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  subtotal: number;
  discount: number;
  discountType?: "efectivo" | "cliente-frecuente";
  createdAt: any;
  updatedAt: any;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountType?: "efectivo" | "cliente-frecuente";
  total: number;
  paymentMethod: PaymentMethod;
  status: "pending" | "completed" | "cancelled";
  createdAt: any;
  completedAt?: any;
  orderNumber: string;
  notes?: string;
  isOnline: boolean; // true para ventas online, false para punto de venta
  salesPersonId?: string; // ID del responsable de ventas para ventas en punto de venta
}

export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  createdAt: any;
}

export interface SalesReport {
  date: string;
  totalSales: number;
  cashSales: number;
  debitSales: number;
  creditSales: number;
  ordersCount: number;
  productTypeBreakdown: {
    estetica: number;
    relajacion: number;
  };
  categoryBreakdown: Record<ProductCategory, number>;
}

export interface InventoryReport {
  productId: string;
  productName: string;
  category: ProductCategory;
  type: ProductType;
  currentStock: number;
  minStock: number;
  lastUpdated: any;
}

// Constantes para las categorías
export const PRODUCT_CATEGORIES: Record<ProductCategory, ProductCategoryInfo> =
  {
    // Estética
    skincare: {
      id: "skincare",
      name: "Skincare",
      type: "estetica",
      description: "Productos para el cuidado de la piel",
      icon: "🧴",
    },
    serum: {
      id: "serum",
      name: "Sérums",
      type: "estetica",
      description: "Sérums concentrados para tratamientos específicos",
      icon: "💧",
    },
    cremas: {
      id: "cremas",
      name: "Cremas",
      type: "estetica",
      description: "Cremas hidratantes y tratamientos",
      icon: "🧴",
    },
    // Relajación
    "sales-bano": {
      id: "sales-bano",
      name: "Sales de Baño",
      type: "relajacion",
      description: "Sales relajantes para baños terapéuticos",
      icon: "🧂",
    },
    "aceites-esenciales": {
      id: "aceites-esenciales",
      name: "Aceites Esenciales",
      type: "relajacion",
      description: "Aceites aromáticos para relajación y bienestar",
      icon: "🫒",
    },
    velas: {
      id: "velas",
      name: "Velas",
      type: "relajacion",
      description: "Velas aromáticas para crear ambiente relajante",
      icon: "🕯️",
    },
  };

export const PRODUCT_TYPES = {
  estetica: {
    name: "Estética",
    description: "Productos para el cuidado y tratamiento de la piel",
    icon: "✨",
  },
  relajacion: {
    name: "Relajación",
    description: "Productos para relajación y bienestar",
    icon: "🕯️",
  },
} as const;
