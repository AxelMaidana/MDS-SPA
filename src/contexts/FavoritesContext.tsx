import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./AuthContext";
import { Favorite, Product } from "../types/products";
import toast from "react-hot-toast";

interface FavoritesContextType {
  favorites: Favorite[];
  addToFavorites: (product: Product) => Promise<void>;
  removeFromFavorites: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const { currentUser } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  // Obtener favoritos del usuario
  useEffect(() => {
    if (!currentUser) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    const favoritesQuery = query(
      collection(db, "favorites"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      favoritesQuery,
      (snapshot) => {
        const favoritesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Favorite[];
        setFavorites(favoritesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching favorites:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const addToFavorites = async (product: Product) => {
    if (!currentUser) {
      toast.error("Debes iniciar sesión para agregar a favoritos");
      return;
    }

    // Verificar si ya está en favoritos
    if (isFavorite(product.id)) {
      toast.info("Este producto ya está en tus favoritos");
      return;
    }

    try {
      const favorite: Favorite = {
        id: `${currentUser.uid}_${product.id}`,
        userId: currentUser.uid,
        productId: product.id,
        product,
        createdAt: new Date(),
      };

      await setDoc(doc(db, "favorites", favorite.id), favorite);
      toast.success(`${product.name} agregado a favoritos`);
    } catch (error) {
      console.error("Error adding to favorites:", error);
      toast.error("Error al agregar a favoritos");
    }
  };

  const removeFromFavorites = async (productId: string) => {
    if (!currentUser) return;

    try {
      const favoriteId = `${currentUser.uid}_${productId}`;
      await deleteDoc(doc(db, "favorites", favoriteId));
      toast.success("Producto eliminado de favoritos");
    } catch (error) {
      console.error("Error removing from favorites:", error);
      toast.error("Error al eliminar de favoritos");
    }
  };

  const isFavorite = (productId: string): boolean => {
    return favorites.some((favorite) => favorite.productId === productId);
  };

  const value = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    loading,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}
