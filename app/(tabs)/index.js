import { View, Text, ActivityIndicator, TouchableOpacity, FlatList, RefreshControl, Alert } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location'; // 1. Import Location
import DishCard from '../../components/DishCard';
import OrderCard from '../../components/OrderCard';
import { useAuthStore } from '../../lib/store';

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null); // 2. State for GPS
  const [errorMsg, setErrorMsg] = useState(null);

  const { cart, getCartTotal } = useAuthStore(); 
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = getCartTotal();

  useEffect(() => {
    fetchData();
    getUserLocation(); // 3. Get Location on Load
  }, []);

  // 📍 Function to ask permission and get coords
  async function getUserLocation() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      Alert.alert("Permission Denied", "We need your location to show nearby food.");
      return;
    }

    let userLocation = await Location.getCurrentPositionAsync({});
    setLocation(userLocation.coords);
    console.log("📍 User GPS:", userLocation.coords);
  }

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', user.id).single();
      setProfile(profileData);

      if (profileData.role === 'chef') {
        // Chef Logic
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`*, profiles:user_id(role), order_items(quantity, menu_items(name, price))`)
          .eq('chef_id', user.id)
          .neq('status', 'delivered')
          .order('created_at', { ascending: false });
        
        if (orderError) throw orderError;
        setDishes(orderData || []);
      } else {
        // 👨‍🎓 Student Logic: Fetch Menu + CHEF LOCATION
        const { data: feedData, error: feedError } = await supabase
          .from('menu_items')
          .select(`*, profiles:chef_id (latitude, longitude)`) // Fetching Chef Coords
          .order('created_at', { ascending: false });

        if (feedError) throw feedError;
        setDishes(feedData || []);
      }

    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
    getUserLocation();
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
                {/* Debug Text */}
                {location && <Text className="text-green-600 text-xs">GPS Active ✅</Text>}
              </View>
              <TouchableOpacity onPress={async () => { await supabase.auth.signOut(); router.replace('/login'); }}>
                <Text className="text-red-500 font-bold">Log Out</Text>
              </TouchableOpacity>
            </View>
            
            {profile?.role === 'chef' && (
              <TouchableOpacity onPress={() => router.push('/add-dish')} className="bg-obsidian p-4 rounded-xl mb-4 flex-row justify-center items-center shadow-md">
                <Text className="text-cream font-bold mr-2">+ Add New Dish</Text>
              </TouchableOpacity>
            )}
          </View>
        }

        renderItem={({ item }) => {
          if (profile?.role === 'chef') {
            return <OrderCard order={item} onUpdate={fetchData} />;
          } else {
            // 4. Pass User Location to DishCard
            return <DishCard dish={item} showAddButton={true} userLocation={location} />;
          }
        }}
      />

      {totalItems > 0 && profile?.role !== 'chef' && (
        <View className="absolute bottom-8 left-4 right-4">
          <TouchableOpacity onPress={() => router.push('/cart')} className="bg-obsidian p-4 rounded-xl flex-row justify-between items-center shadow-lg">
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