import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    // 1. Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // If no user, kick them back to login
      router.replace('/login'); 
      return;
    }

    // 2. Fetch their role from the 'profiles' table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) console.error("Error fetching profile:", error);
    setProfile(data);
    setLoading(false);
  }

  // Debug Version of Sign Out
  async function handleSignOut() {
    console.log("🔴 Sign Out Button Clicked!");
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("❌ Supabase Error:", error.message);
        alert("Error signing out: " + error.message);
      } else {
        console.log("✅ Signed out from Supabase. Navigating to Login...");
        router.replace('/login'); 
      }
    } catch (err) {
      console.error("❌ Crash Error:", err);
    }
  }

  // LOADING STATE CHECK
  if (loading) {
    return (
      <View className="flex-1 bg-cream justify-center items-center">
        <ActivityIndicator size="large" color="#1A0B2E" />
      </View>
    );
  }

  // MAIN DASHBOARD UI
  return (
    <View className="flex-1 bg-cream items-center justify-center p-8">
      
      {/* Dynamic Welcome Message */}
      <Text className="text-obsidian text-3xl font-bold mb-4">
        {profile?.role === 'chef' ? '👨‍🍳 Chef Dashboard' : '😋 Food Feed'}
      </Text>

      <Text className="text-gray-500 text-lg text-center mb-8">
        {profile?.role === 'chef' 
          ? "You have 0 active orders.\nTime to cook!" 
          : "Hungry? Find the best\nhome-cooked meals near you."}
      </Text>

      {/* Debug Info (To prove it works) */}
      <View className="bg-gray-200 p-4 rounded-lg mb-8 w-full">
        <Text className="font-bold text-gray-600 mb-2">DATABASE DEBUG:</Text>
        <Text className="text-xs font-mono text-gray-500">User ID: {profile?.id}</Text>
        <Text className="text-xs font-mono text-gray-500">Role: {profile?.role?.toUpperCase()}</Text>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity 
        onPress={handleSignOut}
        className="bg-red-500 px-6 py-3 rounded-full"
      >
        <Text className="text-white font-bold">Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}