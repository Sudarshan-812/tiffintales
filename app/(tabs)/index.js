import { View, Text, ActivityIndicator, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useEffect, useState, useCallback } from 'react'; // Added useCallback
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import DishCard from '../../components/DishCard'; // Import the card

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [dishes, setDishes] = useState([]); // State for food
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Pull to refresh

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // 1. Get User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login'); 
        return;
      }

      // 2. Get Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profileData);

      // 3. Get Dishes based on Role
      let query = supabase.from('menu_items').select('*').order('created_at', { ascending: false });
      
      if (profileData.role === 'chef') {
        // If Chef, only show MY dishes
        query = query.eq('chef_id', user.id);
      }
      
      const { data: dishData, error: dishError } = await query;
      
      if (dishError) throw dishError;
      setDishes(dishData);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Pull to Refresh Logic
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
    <View className="flex-1 bg-cream pt-12 px-4">
      
      {/* Header */}
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

      {/* Chef: Add Dish Button */}
      {profile?.role === 'chef' && (
        <TouchableOpacity 
          onPress={() => router.push('/add-dish')}
          className="bg-obsidian p-4 rounded-xl mb-6 flex-row justify-center items-center shadow-md"
        >
          <Text className="text-cream font-bold mr-2">+ Add New Dish</Text>
        </TouchableOpacity>
      )}

      {/* The Food Feed */}
      <FlatList
        data={dishes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DishCard dish={item} showAddButton={profile?.role !== 'chef'} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center mt-10">
            <Text className="text-gray-400">No dishes found.</Text>
            {profile?.role === 'chef' && <Text className="text-obsidian mt-2">Add your first dish!</Text>}
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}