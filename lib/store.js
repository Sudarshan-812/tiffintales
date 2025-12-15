import { create } from 'zustand';
import { supabase } from './supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  role: null,
  loading: false,
  cart: [], // 🛒 The Shopping Cart

  // --- AUTH ACTIONS (Existing) ---
  checkSession: async () => {
    set({ loading: true });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      set({ user: session.user, role: profile?.role || 'customer', loading: false });
    } else {
      set({ loading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null, cart: [] }); // Clear cart on logout
  },

  // --- CART ACTIONS (New) --- 🛒
  
  // Add item to cart
  addToCart: (dish) => {
    const currentCart = get().cart;
    const existingItem = currentCart.find((item) => item.id === dish.id);

    if (existingItem) {
      // If item exists, just increase quantity
      set({
        cart: currentCart.map((item) =>
          item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        ),
      });
    } else {
      // If new item, add it with quantity 1
      set({ cart: [...currentCart, { ...dish, quantity: 1 }] });
    }
  },

  // Remove item from cart
  removeFromCart: (dishId) => {
    const currentCart = get().cart;
    const existingItem = currentCart.find((item) => item.id === dishId);

    if (existingItem.quantity > 1) {
      // Decrease quantity
      set({
        cart: currentCart.map((item) =>
          item.id === dishId ? { ...item, quantity: item.quantity - 1 } : item
        ),
      });
    } else {
      // Remove completely
      set({ cart: currentCart.filter((item) => item.id !== dishId) });
    }
  },

  // Clear entire cart
  clearCart: () => set({ cart: [] }),

  // Get Cart Total Price
  getCartTotal: () => {
    const currentCart = get().cart;
    return currentCart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}));