import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./AuthContext";
import { Cart, CartItem, Product } from "../types/products";
import toast from "react-hot-toast";

interface CartContextType {
  cart: Cart | null;
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const { currentUser } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Crear o obtener el carrito del usuario
  useEffect(() => {
    if (!currentUser) {
      setCart(null);
      setCartItems([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "carts", currentUser.uid),
      async (doc) => {
        if (doc.exists()) {
          const cartData = doc.data() as Cart;
          setCart(cartData);
          setCartItems(cartData.items || []);
        } else {
          // Crear carrito vacío si no existe
          const newCart: Cart = {
            id: currentUser.uid,
            userId: currentUser.uid,
            items: [],
            total: 0,
            subtotal: 0,
            discount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await setDoc(doc(db, "carts", currentUser.uid), newCart);
          setCart(newCart);
          setCartItems([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching cart:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const addToCart = async (product: Product, quantity: number = 1) => {
    if (!currentUser) {
      toast.error("Debes iniciar sesión para agregar productos al carrito");
      return;
    }

    if (product.stock < quantity) {
      toast.error("No hay suficiente stock disponible");
      return;
    }

    try {
      const cartRef = doc(db, "carts", currentUser.uid);
      const cartSnap = await getDoc(cartRef);

      let cartData: Cart;
      if (cartSnap.exists()) {
        cartData = cartSnap.data() as Cart;
      } else {
        cartData = {
          id: currentUser.uid,
          userId: currentUser.uid,
          items: [],
          total: 0,
          subtotal: 0,
          discount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      // Verificar si el producto ya está en el carrito
      const existingItemIndex = cartData.items.findIndex(
        (item) => item.productId === product.id
      );

      if (existingItemIndex > -1) {
        // Actualizar cantidad del producto existente
        const newQuantity =
          cartData.items[existingItemIndex].quantity + quantity;
        if (newQuantity > product.stock) {
          toast.error("No hay suficiente stock disponible");
          return;
        }
        cartData.items[existingItemIndex].quantity = newQuantity;
      } else {
        // Agregar nuevo producto al carrito
        const newItem: CartItem = {
          productId: product.id,
          product,
          quantity,
          price: product.price,
        };
        cartData.items.push(newItem);
      }

      // Recalcular totales
      cartData.subtotal = cartData.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      cartData.total = cartData.subtotal - cartData.discount;
      cartData.updatedAt = new Date();

      await setDoc(cartRef, cartData);
      toast.success(`${product.name} agregado al carrito`);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Error al agregar producto al carrito");
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!currentUser || !cart) return;

    try {
      const cartRef = doc(db, "carts", currentUser.uid);
      const updatedItems = cart.items.filter(
        (item) => item.productId !== productId
      );

      const updatedCart: Cart = {
        ...cart,
        items: updatedItems,
        subtotal: updatedItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),
        total:
          updatedItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          ) - cart.discount,
        updatedAt: new Date(),
      };

      await setDoc(cartRef, updatedCart);
      toast.success("Producto eliminado del carrito");
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error("Error al eliminar producto del carrito");
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!currentUser || !cart || quantity < 1) return;

    try {
      const cartRef = doc(db, "carts", currentUser.uid);
      const updatedItems = cart.items.map((item) => {
        if (item.productId === productId) {
          // Verificar stock disponible
          if (quantity > item.product.stock) {
            toast.error("No hay suficiente stock disponible");
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      });

      const updatedCart: Cart = {
        ...cart,
        items: updatedItems,
        subtotal: updatedItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),
        total:
          updatedItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          ) - cart.discount,
        updatedAt: new Date(),
      };

      await setDoc(cartRef, updatedCart);
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Error al actualizar cantidad");
    }
  };

  const clearCart = async () => {
    if (!currentUser) return;

    try {
      const cartRef = doc(db, "carts", currentUser.uid);
      const emptyCart: Cart = {
        id: currentUser.uid,
        userId: currentUser.uid,
        items: [],
        total: 0,
        subtotal: 0,
        discount: 0,
        createdAt: cart?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      await setDoc(cartRef, emptyCart);
      toast.success("Carrito vaciado");
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Error al vaciar carrito");
    }
  };

  const getCartTotal = () => {
    return cart?.total || 0;
  };

  const getCartItemCount = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const value = {
    cart,
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount,
    loading,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
