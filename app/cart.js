import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../lib/store';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function CartScreen() {
  const router = useRouter();
  const { cart, getCartTotal, clearCart, removeFromCart } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const total = getCartTotal();
  const deliveryFee = 20;
  const grandTotal = total + deliveryFee;

  // Placeholder for "Place Order" logic (We will fill this in Step 3)
  // REAL Place Order Logic
  async function handlePlaceOrder() {
    setLoading(true);

    try {
      // 1. Get User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "You must be logged in.");
        return;
      }

      // 2. Get the Chef ID (Assumption: All items are from same chef for now)
      // If cart is empty, this won't run anyway.
      const chefId = cart[0].chef_id; 

      // 3. Create the Order Row
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            user_id: user.id,
            chef_id: chefId,
            total_price: grandTotal,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // 4. Create Order Items Rows
      const itemsToInsert = cart.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // 5. Success!
      clearCart(); // Wipe the cart
      Alert.alert("Success! 🎉", "Your order has been placed.");
      router.replace('/(tabs)'); // Go back home

    } catch (error) {
      console.error("Order Error:", error);
      Alert.alert("Order Failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  if (cart.length === 0) {
    return (
      <View className="flex-1 bg-cream justify-center items-center p-8">
        <Text className="text-obsidian text-2xl font-bold mb-4">Cart is Empty 😔</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-obsidian px-6 py-3 rounded-full">
          <Text className="text-cream font-bold">Browse Food</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      {/* Header */}
      <View className="flex-row items-center p-6 border-b border-gray-200 bg-white">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-bold ml-4 text-obsidian">Your Order</Text>
      </View>

      <ScrollView className="flex-1 p-6">
        {/* Order Items */}
        <Text className="font-bold text-gray-500 mb-4 uppercase tracking-widest">Items</Text>
        {cart.map((item) => (
          <View key={item.id} className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center flex-1">
              <View className="bg-gray-200 w-8 h-8 rounded items-center justify-center mr-3">
                <Text className="font-bold text-obsidian">{item.quantity}x</Text>
              </View>
              <View>
                <Text className="font-bold text-obsidian text-lg">{item.name}</Text>
                <Text className="text-gray-500 text-xs">₹{item.price} per item</Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <Text className="font-bold text-obsidian mr-4">₹{item.price * item.quantity}</Text>
              <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Bill Details */}
        <View className="mt-6 pt-6 border-t border-gray-200">
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Item Total</Text>
            <Text className="font-bold text-obsidian">₹{total}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Delivery Fee</Text>
            <Text className="font-bold text-obsidian">₹{deliveryFee}</Text>
          </View>
          <View className="flex-row justify-between mt-4 pt-4 border-t border-dashed border-gray-300">
            <Text className="text-xl font-bold text-obsidian">Grand Total</Text>
            <Text className="text-xl font-bold text-obsidian">₹{grandTotal}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View className="p-6 bg-white border-t border-gray-100">
        <TouchableOpacity 
          onPress={handlePlaceOrder}
          disabled={loading}
          className="bg-obsidian py-4 rounded-xl items-center shadow-lg"
        >
          {loading ? (
             <ActivityIndicator color="white" />
          ) : (
             <Text className="text-cream font-bold text-lg">Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}