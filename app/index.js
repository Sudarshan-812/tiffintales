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
    <View className="flex-1 items-center justify-center bg-cream">
      <Text className="text-obsidian text-4xl font-bold mb-2 tracking-widest">
        TiffinTales 🍱
      </Text>
      <Text className="text-gray-400 text-lg mb-8">
        Home Cooked Food, Delivered.
      </Text>
      
      <Link href="/login" className="bg-obsidian px-10 py-4 rounded-full shadow-lg">
        <Text className="text-cream font-bold text-xl">Get Started</Text>
      </Link>


      <View className="absolute bottom-10">
        <Text className="text-gray-400 text-xs">POWERED BY SUDARSHAN</Text>
      </View>
    </View>
  );
}