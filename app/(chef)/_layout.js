import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#7E22CE',
  obsidian: '#0F172A',
  gray: '#94A3B8',
  surface: 'rgba(255, 255, 255, 0.98)',
  border: '#E2E8F0',
  shadow: '#000000',
};


const TabBarIcon = ({ focused, color, iconDefault, iconFocused }) => (
  <View style={styles.iconContainer}>
    {focused && <View style={styles.activeIndicator} />}
    <Ionicons
      name={focused ? iconFocused : iconDefault}
      size={focused ? 26 : 24} 
      color={color}
    />
  </View>
);

export default function ChefLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
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
            <TabBarIcon {...props} iconDefault="add-outline" iconFocused="add" />
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
    backgroundColor: COLORS.surface,
    height: Platform.OS === 'ios' ? 90 : 70,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    
    // Obsidian Top Separator
    borderTopWidth: 1.5,
    borderTopColor: COLORS.obsidian,
    
    // Shadow for elevation
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
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
    top: -13, 
    width: 24,
    height: 4,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
});