import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const THEME = {
  colors: {
    primary: '#7E22CE', // Deep Purple
    obsidian: '#0F172A', // Dark Professional Accent
    gray: '#94A3B8',    // Inactive Slate
    surface: 'rgba(255, 255, 255, 0.98)', // High-fidelity surface
    border: '#E2E8F0',
  },
};

/**
 * High-Quality Tab Icon
 * Uniform sizing with a simple "+" for the Add section.
 */
const TabBarIcon = ({ focused, color, iconDefault, iconFocused }) => (
  <View style={styles.iconContainer}>
    {focused && <View style={styles.activeIndicator} />}
    <Ionicons
      name={focused ? iconFocused : iconDefault}
      size={focused ? 26 : 24} // Simple + is 26 for visual weight balance
      color={color}
    />
  </View>
);

export default function ChefLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: THEME.colors.primary,
        tabBarInactiveTintColor: THEME.colors.gray,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Orders',
          tabBarIcon: (props) => (
            <TabBarIcon {...props} iconDefault="receipt-outline" iconFocused="receipt" />
          ),
        }}
      />

      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: (props) => (
            <TabBarIcon {...props} iconDefault="restaurant-outline" iconFocused="restaurant" />
          ),
        }}
      />

      <Tabs.Screen
        name="add"
        options={{
          title: 'Add Dish',
          tabBarIcon: (props) => (
            <TabBarIcon {...props} iconDefault="add-outline" iconFocused="add" /> // ✅ Simple + Icon
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Account',
          tabBarIcon: (props) => (
            <TabBarIcon {...props} iconDefault="person-outline" iconFocused="person" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: THEME.colors.surface,
    height: Platform.OS === 'ios' ? 90 : 70,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    
    // 🌑 Obsidian Top Separator
    borderTopWidth: 1.5,
    borderTopColor: THEME.colors.obsidian, 
    
    // Shadow for elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '800', // Heavy weight for professional look
    marginTop: 4,
    textTransform: 'uppercase', // Dashboard aesthetic
    letterSpacing: 0.5,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  activeIndicator: {
    position: 'absolute',
    top: -13, // Aligns perfectly with the obsidian top border
    width: 24,
    height: 4,
    backgroundColor: THEME.colors.primary,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
});