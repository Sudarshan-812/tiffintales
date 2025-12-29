import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Define theme constants locally to maintain consistency across tabs
const THEME = {
  colors: {
    primary: '#7E22CE', // Purple
    gray: '#9CA3AF',
    surface: '#FFFFFF',
    shadow: '#000000',
  },
  dimensions: {
    height: Platform.select({ ios: 85, android: 65 }),
    paddingBottom: Platform.select({ ios: 25, android: 10 }),
  },
};

/**
 * Helper component to render tab icons conditionally based on focus state.
 * @param {object} props
 * @param {boolean} props.focused - Whether the tab is currently active
 * @param {string} props.color - Color passed from the tab navigator
 * @param {string} props.iconDefault - Icon name when inactive
 * @param {string} props.iconFocused - Icon name when active
 */
const TabBarIcon = ({ focused, color, iconDefault, iconFocused }) => (
  <Ionicons
    name={focused ? iconFocused : iconDefault}
    size={24}
    color={color}
  />
);

/**
 * ChefLayout
 * Layout wrapper for the Chef side of the application.
 * Manages the bottom tab navigation for Orders, Menu, and Profile.
 */
export default function ChefLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: THEME.colors.primary,
        tabBarInactiveTintColor: THEME.colors.gray,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              color={color}
              focused={focused}
              iconDefault="receipt-outline"
              iconFocused="receipt"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="menu"
        options={{
          title: 'My Menu',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              color={color}
              focused={focused}
              iconDefault="restaurant-outline"
              iconFocused="restaurant"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              color={color}
              focused={focused}
              iconDefault="person-outline"
              iconFocused="person"
            />
          ),
        }}
      />

        <Tabs.Screen
        name="add"
        options={{
          title: 'Add Item',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              color={color}
              focused={focused}
              iconDefault="add-circle-outline"
              iconFocused="add-circle"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: THEME.colors.surface,
    borderTopWidth: 0,
    height: THEME.dimensions.height,
    paddingBottom: THEME.dimensions.paddingBottom,
    paddingTop: 10,
    shadowColor: THEME.colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});