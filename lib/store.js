import { create } from 'zustand';
import { supabase } from './supabase';

export const useAuthStore = create((set) => ({
  user: null,
  role: null, // 'chef' or 'customer'
  loading: false,

  // 1. Check if user is already logged in
  checkSession: async () => {
    set({ loading: true });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // If logged in, fetch their role from the 'profiles' table
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

  // 2. Sign Out
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null });
  }
}));