import { View, Text, ActivityIndicator, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase'; // <--- Only one set of dots
import { useRouter } from 'expo-router';
import DishCard from '../components/DishCard'; // <--- Only one set of dots
import { useAuthStore } from '../lib/store'; // <--- Only one set of dots

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Get Cart Data
  const { cart, getCartTotal } = useAuthStore(); 
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = getCartTotal();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', user.id).single();
      setProfile(profileData);

      let query = supabase.from('menu_items').select('*').order('created_at', { ascending: false });
      if (profileData.role === 'chef') {
        query = query.eq('chef_id', user.id);
      }
      
      const { data: dishData } = await query;
      setDishes(dishData || []);

    } catch (error) {
      console.error(error);
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
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }} // Extra padding for floating button
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View className="mb-6 mt-12">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-gray-500 text-xs font-bold tracking-widest uppercase">
                  {profile?.role === 'chef' ? 'KITCHEN DASHBOARD' : 'DELIVERING TO'}
                </Text>
                <Text className="text-obsidian text-2xl font-bold">
                  {profile?.role === 'chef' ? 'My Menu 👨‍🍳' : 'Vijayapura 📍'}
                </Text>
              </View>
              <TouchableOpacity onPress={async () => { await supabase.auth.signOut(); router.replace('/login'); }}>
                <Text className="text-red-500 font-bold">Log Out</Text>
              </TouchableOpacity>
            </View>

            {profile?.role === 'chef' && (
              <TouchableOpacity 
                onPress={() => router.push('/add-dish')}
                className="bg-obsidian p-4 rounded-xl mb-2 flex-row justify-center items-center shadow-md"
              >
                <Text className="text-cream font-bold mr-2">+ Add New Dish</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <DishCard dish={item} showAddButton={profile?.role !== 'chef'} />
        )}
        ListEmptyComponent={
          <Text className="text-center text-gray-400 mt-10">No dishes found.</Text>
        }
      />

      {/* FLOATING CART BUTTON (Only shows if items exist & User is NOT a Chef) */}
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