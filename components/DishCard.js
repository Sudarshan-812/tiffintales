import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { useCart } from '../lib/store'; // 👈 FIXED IMPORT (was useAuthStore)
import { Ionicons } from '@expo/vector-icons';

export default function DishCard({ dish, showAddButton = true, userLocation }) {
  const { addToCart } = useCart(); // 👈 Use the correct hook

  // 1. Calculate Distance (Haversine Formula)
  function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    
    const R = 6371; // Earth Radius in KM
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
  }

  // 2. Get Coordinates
  // Note: Ensure your 'profiles' join is working, otherwise these are undefined
  const chefLat = dish.profiles?.latitude;
  const chefLon = dish.profiles?.longitude;
  
  let distance = 0;
  let isTooFar = false;

  // 3. Check Distance
  if (userLocation && chefLat) {
    distance = calculateDistance(userLocation.latitude, userLocation.longitude, chefLat, chefLon);
    if (distance > 5) isTooFar = true; 
  }

  const handlePress = () => {
    if (isTooFar) {
      Alert.alert("Too Far", "This chef is over 5km away.");
      return;
    }
    console.log("Adding dish:", dish.name); // 👈 Debug log
    addToCart(dish);
  };

  return (
    <View className="bg-white rounded-2xl mb-6 shadow-sm border border-gray-100 overflow-hidden">
      <Image 
        source={{ uri: dish.image_url || 'https://via.placeholder.com/400x300' }} 
        className="w-full h-48 bg-gray-200"
      />
      
      {/* Distance Badge */}
      {userLocation && chefLat && (
        <View className="absolute top-4 right-4 bg-white px-2 py-1 rounded-lg shadow-md flex-row items-center">
            <Ionicons name="location-sharp" size={12} color={isTooFar ? "red" : "green"} />
            <Text className={`text-xs font-bold ml-1 ${isTooFar ? "text-red-500" : "text-green-600"}`}>
                {distance.toFixed(1)} km
            </Text>
        </View>
      )}

      <View className="p-4">
        <View className="flex-row justify-between items-start mb-2">
            <Text className="text-xl font-bold text-obsidian flex-1 mr-2">{dish.name}</Text>
            <Text className="text-lg font-bold text-obsidian">₹{dish.price}</Text>
        </View>
        
        <Text className="text-gray-500 text-sm mb-4" numberOfLines={2}>
            {dish.description || "Home cooked meal."}
        </Text>

        {showAddButton && (
            <TouchableOpacity 
                onPress={handlePress}
                className={`p-4 rounded-xl flex-row justify-center items-center ${isTooFar ? 'bg-gray-300' : 'bg-obsidian'}`}
                disabled={isTooFar}
            >
                <Text className={`font-bold text-lg ${isTooFar ? 'text-gray-500' : 'text-cream'}`}>
                    {isTooFar ? 'Too Far' : 'Add to Cart'}
                </Text>
                {!isTooFar && <Ionicons name="cart" size={20} color="#FDFBF7" style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
        )}
      </View>
    </View>
  );
}