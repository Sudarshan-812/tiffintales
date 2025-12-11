import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChef, setIsChef] = useState(false); // Toggle state

  // The Logic to Sign Up
  async function handleSignUp() {
    setLoading(true);
    // 1. Create User in Supabase Auth
    const { data: { user }, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert("Error", error.message);
      setLoading(false);
      return;
    }

    // 2. Create Profile Row with Role
    if (user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: user.id, 
            role: isChef ? 'chef' : 'customer',
            phone: '0000000000' // Placeholder for now
          }
        ]);

      if (profileError) {
        Alert.alert("Database Error", profileError.message);
      } else {
        Alert.alert("Success", "Account created! You are logged in.");
        router.replace('/(tabs)');
      }
    }
    setLoading(false);
  }

  // The Logic to Login (Simple for now)
  async function handleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) Alert.alert("Login Failed", error.message);
    else router.replace('/(tabs)');
    
    setLoading(false);
  }

  return (
    <View className="flex-1 bg-cream p-8 justify-center">
      <Text className="text-obsidian text-4xl font-bold mb-2">Welcome.</Text>
      <Text className="text-gray-500 text-lg mb-8">
        {isChef ? "Join as a Home Chef 👨‍🍳" : "Hungry? Let's eat. 😋"}
      </Text>

      {/* Role Toggle */}
      <View className="flex-row mb-8 bg-gray-200 rounded-full p-1">
        <TouchableOpacity 
          className={`flex-1 py-3 rounded-full items-center ${!isChef ? 'bg-obsidian shadow-md' : 'bg-transparent'}`}
          onPress={() => setIsChef(false)}
        >
          <Text className={`${!isChef ? 'text-cream font-bold' : 'text-gray-500'}`}>Student</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className={`flex-1 py-3 rounded-full items-center ${isChef ? 'bg-obsidian shadow-md' : 'bg-transparent'}`}
          onPress={() => setIsChef(true)}
        >
          <Text className={`${isChef ? 'text-cream font-bold' : 'text-gray-500'}`}>Home Chef</Text>
        </TouchableOpacity>
      </View>

      {/* Inputs */}
      <View className="space-y-4">
        <View>
          <Text className="text-obsidian mb-2 font-medium">Email</Text>
          <TextInput 
            className="bg-white p-4 rounded-xl border border-gray-200 text-obsidian"
            placeholder="you@example.com" 
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View>
          <Text className="text-obsidian mb-2 font-medium">Password</Text>
          <TextInput 
            className="bg-white p-4 rounded-xl border border-gray-200 text-obsidian"
            placeholder="••••••" 
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>
      </View>

      {/* Buttons */}
      <View className="mt-8 space-y-4">
        {loading ? (
          <ActivityIndicator color="#1A0B2E" />
        ) : (
          <>
            <TouchableOpacity 
              onPress={handleLogin}
              className="bg-obsidian p-4 rounded-xl items-center shadow-lg"
            >
              <Text className="text-cream font-bold text-lg">Login</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleSignUp}
              className="border-2 border-obsidian p-4 rounded-xl items-center"
            >
              <Text className="text-obsidian font-bold text-lg">Create Account</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}