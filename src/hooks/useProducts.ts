import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Product, ProductType, ProductCategory } from "../types/products";

export function useProducts(filters?: {
  type?: ProductType;
  category?: ProductCategory;
  search?: string;
  limitCount?: number;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        let q = query(
          collection(db, "products"),
          where("isActive", "==", true),
          orderBy("createdAt", "desc")
        );

        // Aplicar filtros
        if (filters?.type) {
          q = query(q, where("type", "==", filters.type));
        }

        if (filters?.category) {
          q = query(q, where("category", "==", filters.category));
        }

        if (filters?.limitCount) {
          q = query(q, limit(filters.limitCount));
        }

        const snapshot = await getDocs(q);
        let productsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];

        // Filtro de búsqueda por texto (se hace en el cliente)
        if (filters?.search) {
          const searchTerm = filters.search.toLowerCase();
          productsData = productsData.filter(
            (product) =>
              product.name.toLowerCase().includes(searchTerm) ||
              product.description.toLowerCase().includes(searchTerm) ||
              product.features.some((feature) =>
                feature.toLowerCase().includes(searchTerm)
              )
          );
        }

        setProducts(productsData);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Error al cargar productos");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters?.type, filters?.category, filters?.search, filters?.limitCount]);

  return { products, loading, error };
}

export function useProduct(productId: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const productDoc = await getDoc(doc(db, "products", productId));

        if (productDoc.exists()) {
          const productData = {
            id: productDoc.id,
            ...productDoc.data(),
          } as Product;
          setProduct(productData);
        } else {
          setError("Producto no encontrado");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Error al cargar producto");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  return { product, loading, error };
}

export function useFeaturedProducts() {
  return useProducts({ limitCount: 6 });
}

export function useProductsByType(type: ProductType) {
  return useProducts({ type });
}

export function useProductsByCategory(category: ProductCategory) {
  return useProducts({ category });
}
