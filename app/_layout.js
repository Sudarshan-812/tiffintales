import { Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import AnimatedSplash from '../components/AnimatedSplash'; // 👈 Import it

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  // 1. If App is NOT ready, show Splash
  if (!appReady) {
    return (
      <AnimatedSplash 
        onFinish={() => setAppReady(true)} // 👈 When animation ends, set appReady = true
      />
    );
  }

  // 2. Once Ready, Show the Actual App
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
    </Stack>
  );
}