import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useCart } from '../lib/store'; // Import your store
import { View } from 'react-native';

export default function RootLayout() {
  // 👇 Get the checkSession function from your store
  const checkSession = useCart((state) => state.checkSession);

  useEffect(() => {
    // 👇 Run this immediately when the app starts
    checkSession();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="cart" options={{ presentation: 'modal' }} />
    </Stack>
  );
}