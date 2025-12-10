import {Tabs } from 'expo-router';

export default function TabLayout() {
  return (
  <Tabs
    screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: `#1F29370`,bordertopWidth:0  },
        tabBarActiveTintColor: '#F97316', // Orange
        tabBarInactiveTintColor: 'gray',
    }}
     >

    <Tabs.Screen
      name="index"
      options={{ title: `Home`}}
      />

    <Tabs.Screen
      name="orders"
      options={{ title: `Orders` }}
    />

    <Tabs.Screen
      name="profile"
      options={{ title: `Profile` }}
    />

    </Tabs>
  );
}