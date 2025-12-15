import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../lib/store'; // Import Store

export default function DishCard({ dish, showAddButton = true }) {
  // Get Cart functions
  const { cart, addToCart, removeFromCart } = useAuthStore();

  // Check if this specific dish is already in the cart
  const cartItem = cart.find((item) => item.id === dish.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <View className="bg-white rounded-2xl mb-6 shadow-sm border border-gray-100 overflow-hidden">
      
      {/* Food Image */}
      <Image 
        source={{ uri: dish.image_url }} 
        style={{ width: '100%', height: 200 }} 
        className="w-full h-48"
        resizeMode="cover"
      />

      {/* Content */}
      <View className="p-4">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 mr-4">
            <Text className="text-xl font-bold text-obsidian mb-1">{dish.name}</Text>
            <Text className="text-gray-500 text-sm leading-5" numberOfLines={2}>
              {dish.description}
            </Text>
          </View>
          <Text className="text-lg font-bold text-obsidian">₹{dish.price}</Text>
        </View>

        {/* Footer */}
        <View className="flex-row justify-between items-center mt-4">
          
          {/* Rating */}
          <View className="flex-row items-center">
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text className="text-gray-600 font-bold ml-1">4.5</Text>
          </View>

          {/* Add to Cart Logic */}
          {showAddButton && (
            <View>
              {quantity === 0 ? (
                // Button 1: "ADD +"
                <TouchableOpacity 
                  onPress={() => addToCart(dish)}
                  className="bg-obsidian px-4 py-2 rounded-full"
                >
                  <Text className="text-cream font-bold text-xs">ADD +</Text>
                </TouchableOpacity>
              ) : (
                // Button 2: "- 1 +" (Counter)
                <View className="flex-row items-center bg-gray-100 rounded-full px-2 py-1">
                  <TouchableOpacity onPress={() => removeFromCart(dish.id)} className="px-2">
                    <Text className="text-obsidian font-bold text-lg">-</Text>
                  </TouchableOpacity>
                  
                  <Text className="text-obsidian font-bold mx-2">{quantity}</Text>
                  
                  <TouchableOpacity onPress={() => addToCart(dish)} className="px-2">
                    <Text className="text-obsidian font-bold text-lg">+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}