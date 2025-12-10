import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-black">
      <Text className="text-white text-3xl font-bold mb-4">
        TiffinTales 🍱
      </Text>
      <Text className="text-gray-400 text-lg mb-8">
        Home Cooked Food, Delivered.
      </Text>
      
      {/* This Link acts like an <a> tag in HTML */}
      <Link href="/login" className="bg-orange-500 px-6 py-3 rounded-full">
        <Text className="text-white font-bold">START</Text>
      </Link>
    </View>
  );
}