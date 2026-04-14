import React from 'react';
import { Tabs } from 'expo-router';
import SlideTabBar from '../../components/SlideTabBar';

const TAB_CONFIG = [
  { icon: 'home-outline',    activeIcon: 'home',    label: 'Home'    },
  { icon: 'receipt-outline', activeIcon: 'receipt', label: 'Orders'  },
  { icon: 'person-outline',  activeIcon: 'person',  label: 'Profile' },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
      tabBar={(props) => <SlideTabBar {...props} tabConfig={TAB_CONFIG} />}
    >
      <Tabs.Screen name="index"   options={{ title: 'Home'    }} />
      <Tabs.Screen name="orders"  options={{ title: 'Orders'  }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
