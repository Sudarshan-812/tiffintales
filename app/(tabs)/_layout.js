import React from 'react';
import { Platform, StyleSheet } from 'react-native';

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#7E22CE',
  obsidian: '#111827',
  gray: '#9CA3AF',
  surface: '#FFFFFF',
  shadow: '#000000',
};

// Platform specific dimensions to ensure consistent look
const LAYOUT = {
  tabBarHeight: Platform.OS === 'ios' ? 85 : 65,
  paddingBottom: Platform.OS === 'ios' ? 25 : 10,
};

/**
 * Helper component to render tab icons
 * automatically switches between filled and outline versions.
 */
const TabBarIcon = ({ focused, color, iconName }) => {
  const name = focused ? iconName : `${iconName}-outline`;
  return <Ionicons name={name} size={24} color={color} />;
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon focused={focused} color={color} iconName="home" />
          ),
        }}
      />
      
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon focused={focused} color={color} iconName="receipt" />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon focused={focused} color={color} iconName="person" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 0,
    height: LAYOUT.tabBarHeight,
    paddingBottom: LAYOUT.paddingBottom,
    paddingTop: 10,
    
    // Shadow Styling
    elevation: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
});