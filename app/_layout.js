import React, { useState } from 'react';

import { Stack } from 'expo-router';

import AnimatedSplash from '../components/AnimatedSplash';

/**
 * RootLayout
 * Entry point for the application navigation.
 * Handles the transition from the custom animated splash screen to the main navigation stack.
 */
export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);

  // Render the custom animated splash screen until it signals completion
  if (!isAppReady) {
    return (
      <AnimatedSplash 
        onFinish={() => setIsAppReady(true)} 
      />
    );
  }

  // Mount the main application navigation
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
    </Stack>
  );
}