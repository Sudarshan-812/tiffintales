import { create } from 'zustand';
import { supabase } from './supabase';
import { Alert } from 'react-native';
// 👇 IMPORT LOCATION HELPER
import { calculateDistance } from './location'; 

export const useAuthStore = create((set, get) => ({
  user: null,
  role: null,
  loading: false,
  cart: [],
  userLocation: null, // 📍 Store User GPS

  // --- AUTH ACTIONS ---
  checkSession: async () => {
    set({ loading: true });
    try {
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
    } catch (e) {
      console.log('Auth Error:', e);
      set({ loading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null, cart: [], userLocation: null });
  },

  // --- LOCATION ACTION --- 📍
  setUserLocation: (location) => set({ userLocation: location }),

  // --- CART ACTIONS --- 🛒
  addToCart: (item) => set((state) => {
    const currentCart = state.cart || [];
    
    // 1. CONFLICT CHECK
    if (currentCart.length > 0 && item.chef_id && currentCart[0].chef_id) {
      if (currentCart[0].chef_id !== item.chef_id) {
        Alert.alert(
          "Switching Kitchens?",
          "You can only order from one chef at a time. Clear current cart?",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Yes, Clear It", 
              onPress: () => set({ cart: [{ ...item, quantity: 1 }] }) 
            }
          ]
        );
        return {}; 
      }
    }

    // 2. EXISTING ITEM CHECK
    const existingItem = currentCart.find((i) => i.id === item.id);
    if (existingItem) {
      return {
        cart: currentCart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      };
    }

    // 3. NEW ITEM ADD
    return { cart: [...currentCart, { ...item, quantity: 1 }] };
  }),

  removeFromCart: (id) => set((state) => {
    const currentCart = state.cart || [];
    const existingItem = currentCart.find((i) => i.id === id);

    if (existingItem && existingItem.quantity > 1) {
      return {
        cart: currentCart.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity - 1 } : i
        ),
      };
    }
    return { cart: currentCart.filter((i) => i.id !== id) };
  }),

  clearCart: () => set({ cart: [] }),

  getCartTotal: () => {
    const cart = get().cart || [];
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  // 👇 DYNAMIC DELIVERY FEE LOGIC
  getDeliveryFee: () => {
    const { cart, userLocation } = get();
    
    // Default fee if no location or empty cart
    if (cart.length === 0 || !userLocation) return 40; 

    // Mock Chef Location (Vijayapura)
    const CHEF_COORDS = { latitude: 16.8302, longitude: 75.7100 }; 
    
    const dist = calculateDistance(
      userLocation.latitude, userLocation.longitude,
      CHEF_COORDS.latitude, CHEF_COORDS.longitude
    );

    const distanceKm = parseFloat(dist);
    const ratePerKm = 10;
    const minFee = 20;

    // Logic: ₹10 per km, but never less than ₹20
    const fee = Math.max(minFee, Math.round(distanceKm * ratePerKm));
    return fee;
  },

  // --- ORDER PLACEMENT --- ⚙️
  placeOrder: async () => {
    // This is the fallback if used directly, but we mainly use the manual logic in Cart.js now
    const state = get();
    // ... (Keep existing logic if needed, but Cart.js handles it now)
    return { success: false, error: "Use handlePaymentConfirm in Cart" };
  }
}));

export const useCart = useAuthStore;