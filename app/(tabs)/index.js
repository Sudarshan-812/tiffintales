import { View, Text, ActivityIndicator, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import DishCard from '../../components/DishCard';
import OrderCard from '../../components/OrderCard'; // Import the new Ticket Component
import { useAuthStore } from '../../lib/store';

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [dishes, setDishes] = useState([]); // Stores either Dishes (Student) or Orders (Chef)
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Cart State (for Floating Button)
  const { cart, getCartTotal } = useAuthStore(); 
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = getCartTotal();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // 1. Get Current User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      // 2. Get Profile Role
      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', user.id).single();
      setProfile(profileData);

      // 3. FETCH DATA BASED ON ROLE
      if (profileData.role === 'chef') {
        // 👨‍🍳 CHEF MODE: Fetch Incoming Orders (Deep Join)
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            profiles:user_id (role), 
            order_items (
              quantity,
              menu_items (name, price)
            )
          `)
          .eq('chef_id', user.id)
          .neq('status', 'delivered') // Hide completed orders
          .order('created_at', { ascending: false }); // Newest first
        
        if (orderError) throw orderError;
        setDishes(orderData || []); // We reuse 'dishes' state to store Orders
        
      } else {
        // 👨‍🎓 STUDENT MODE: Fetch Food Feed
        const { data: feedData, error: feedError } = await supabase
          .from('menu_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (feedError) throw feedError;
        setDishes(feedData || []);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-cream justify-center items-center">
        <ActivityIndicator size="large" color="#1A0B2E" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      
      <FlatList
        data={dishes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        
        // --- HEADER ---
        ListHeaderComponent={
          <View className="mb-6 mt-12">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-gray-500 text-xs font-bold tracking-widest uppercase">
                  {profile?.role === 'chef' ? 'KITCHEN DISPLAY' : 'DELIVERING TO'}
                </Text>
                <Text className="text-obsidian text-2xl font-bold">
                  {profile?.role === 'chef' ? 'Incoming Orders 👨‍🍳' : 'Vijayapura 📍'}
                </Text>
              </View>
              <TouchableOpacity onPress={async () => { await supabase.auth.signOut(); router.replace('/login'); }}>
                <Text className="text-red-500 font-bold">Log Out</Text>
              </TouchableOpacity>
            </View>

            {/* Chef "Add Dish" Button */}
            {profile?.role === 'chef' && (
              <TouchableOpacity 
                onPress={() => router.push('/add-dish')}
                className="bg-obsidian p-4 rounded-xl mb-4 flex-row justify-center items-center shadow-md"
              >
                <Text className="text-cream font-bold mr-2">+ Add New Dish</Text>
              </TouchableOpacity>
            )}
          </View>
        }

        // --- THE LIST ITEMS (Switches based on Role) ---
        renderItem={({ item }) => {
          if (profile?.role === 'chef') {
            // 👨‍🍳 Chef sees Tickets
            return <OrderCard order={item} onUpdate={fetchData} />;
          } else {
            // 👨‍🎓 Student sees Food
            return <DishCard dish={item} showAddButton={true} />;
          }
        }}

        ListEmptyComponent={
          <View className="items-center mt-10">
            <Text className="text-gray-400 mb-2">
              {profile?.role === 'chef' ? "No active orders yet." : "No dishes found."}
            </Text>
            {profile?.role === 'chef' && <Text className="text-gray-500 text-sm">Relax, Chef! ☕</Text>}
          </View>
        }
      />

      {/* --- FLOATING CART BUTTON (Only for Students) --- */}
      {totalItems > 0 && profile?.role !== 'chef' && (
        <View className="absolute bottom-8 left-4 right-4">
          <TouchableOpacity 
            onPress={() => router.push('/cart')}
            className="bg-obsidian p-4 rounded-xl flex-row justify-between items-center shadow-lg"
          >
            <View className="flex-row items-center">
              <View className="bg-cream w-8 h-8 rounded-full items-center justify-center mr-3">
                <Text className="text-obsidian font-bold">{totalItems}</Text>
              </View>
              <Text className="text-cream font-bold text-lg">View Cart</Text>
            </View>
            <Text className="text-cream font-bold text-lg">₹{totalPrice}</Text>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}