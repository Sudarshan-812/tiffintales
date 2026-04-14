import React from 'react';
import { Tabs } from 'expo-router';
import SlideTabBar from '../../components/SlideTabBar';

const TAB_CONFIG = [
  { icon: 'receipt-outline',      activeIcon: 'receipt',      label: 'Orders'   },
  { icon: 'restaurant-outline',   activeIcon: 'restaurant',   label: 'Menu'     },
  { icon: 'add-circle-outline',   activeIcon: 'add-circle',   label: 'Add Dish' },
  { icon: 'person-outline',       activeIcon: 'person',       label: 'Account'  },
];

export default function ChefLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
      tabBar={(props) => <SlideTabBar {...props} tabConfig={TAB_CONFIG} />}
    >
      <Tabs.Screen name="index"   options={{ title: 'Orders'   }} />
      <Tabs.Screen name="menu"    options={{ title: 'Menu'     }} />
      <Tabs.Screen name="add"     options={{ title: 'Add Dish' }} />
      <Tabs.Screen name="profile" options={{ title: 'Account'  }} />
    </Tabs>
  );
}
