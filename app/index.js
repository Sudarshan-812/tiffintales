import { View, Text } from 'react-native';
import { Link } from 'expo-router';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase'; 

export default function HomeScreen() {

  useEffect(() => {
    console.log('--- SUPABASE CHECK ---');
    console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Loaded ✅' : 'Missing ❌');
    console.log('Supabase Key:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Loaded ✅' : 'Missing ❌');
    console.log('----------------------');
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-black">
      <Text className="text-white text-3xl font-bold mb-4">
        TiffinTales 🍱
      </Text>
      <Text className="text-gray-400 text-lg mb-8">
        Home Cooked Food, Delivered.
      </Text>
      
      <Link href="/login" className="bg-orange-500 px-6 py-3 rounded-full">
        <Text className="text-white font-bold">Get Started</Text>
      </Link>
    </View>
  );
}