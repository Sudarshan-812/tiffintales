import { create } from 'zustand';
import { Alert } from 'react-native';
import { supabase } from './supabase';
import { calculateDistance } from './location';

// Configuration Constants
const DELIVERY_RATE_PER_KM = 10;
const MIN_DELIVERY_FEE = 20;
const DEFAULT_DELIVERY_FEE = 40;

/**
 * Global State Store
 * Manages Authentication, User Location, and Shopping Cart.
 */
export const useCart = create((set, get) => ({
  // State
  user: null,
  role: null,
  loading: false,
  cart: [],
  userLocation: null,

  /**
   * Checks the current Supabase session and fetches the user profile.
   */
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
        
        set({ 
          user: session.user, 
          role: profile?.role || 'customer', 
          loading: false 
        });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      // Silently fail auth check to allow public browsing
      set({ loading: false });
    }
  },

  /**
   * Signs the user out and clears sensitive state.
   */
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null, cart: [], userLocation: null });
  },

  /**
   * Updates the user's GPS location.
   * @param {object} location - { latitude, longitude }
   */
  setUserLocation: (location) => set({ userLocation: location }),

  /**
   * Adds an item to the cart.
   * Handles logic to prevent ordering from multiple chefs simultaneously.
   * @param {object} item - The menu item to add
   */
  addToCart: (item) => set((state) => {
    const currentCart = state.cart || [];
    
    // 1. Conflict Check: Ensure all items belong to the same chef
    if (currentCart.length > 0 && item.chef_id) {
      const currentChefId = currentCart[0].chef_id;
      
      if (currentChefId !== item.chef_id) {
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
        return {}; // Return nothing, wait for Alert interaction
      }
    }

    // 2. Existing Item Check: Increment quantity
    const existingItem = currentCart.find((i) => i.id === item.id);
    if (existingItem) {
      return {
        cart: currentCart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      };
    }

    // 3. New Item: Add to array
    return { cart: [...currentCart, { ...item, quantity: 1 }] };
  }),

  /**
   * Removes an item or decrements its quantity.
   * @param {string} id - The menu item ID
   */
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

  /**
   * Clears the entire cart.
   */
  clearCart: () => set({ cart: [] }),

  /**
   * Calculates the total price of items in the cart.
   * @returns {number} Total price
   */
  getCartTotal: () => {
    const cart = get().cart || [];
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  /**
   * Calculates dynamic delivery fee based on GPS distance.
   * Uses the Chef's location from the first item in the cart.
   * @returns {number} Delivery fee in currency units
   */
  getDeliveryFee: () => {
    const { cart, userLocation } = get();
    
    // Safety checks
    if (cart.length === 0 || !userLocation) return DEFAULT_DELIVERY_FEE; 

    // Attempt to get Chef's location from the first cart item
    const chefProfile = cart[0].profiles; 
    
    if (!chefProfile || !chefProfile.latitude || !chefProfile.longitude) {
      return DEFAULT_DELIVERY_FEE;
    }

    // Calculate real distance
    const dist = calculateDistance(
      userLocation.latitude, userLocation.longitude,
      chefProfile.latitude, chefProfile.longitude
    );

    const distanceKm = parseFloat(dist);
    
    // Logic: Rate per km, clamped to a minimum fee
    const fee = Math.max(MIN_DELIVERY_FEE, Math.round(distanceKm * DELIVERY_RATE_PER_KM));
    return fee;
  },
}));