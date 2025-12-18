import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// 🎨 THEME: Obsidian + Cream + Gold
const COLORS = {
  obsidian: '#1A0B2E', // Dark Purple/Black
  cream: '#FDFBF7',    // Warm White
  gold: '#F59E0B',     // Accent Gold
  gray: '#9CA3AF',
  surface: '#FFFFFF',
  activeBg: '#F3E8FF', // Very light purple tint for active state
};

const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

// 🎯 CUSTOM TAB BAR
const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: COLORS.surface,
        borderTopWidth: 0, 
        paddingBottom: Platform.OS === 'ios' ? 30 : 12,
        paddingTop: 12,
        paddingHorizontal: SPACING.lg,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        // Heavy Shadow for "Floating" feel
        shadowColor: COLORS.obsidian,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20, 
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <View key={route.key} style={{ flex: 1, alignItems: 'center' }}>
            <View
              onTouchEnd={onPress}
              style={{
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 20,
                borderRadius: 20,
                // Active BG is now Cream/Light Purple instead of Green
                backgroundColor: isFocused ? COLORS.activeBg : 'transparent', 
              }}
            >
              {options.tabBarIcon ? (
                options.tabBarIcon({
                  // Active Icon is Obsidian, Inactive is Gray
                  color: isFocused ? COLORS.obsidian : COLORS.gray, 
                  focused: isFocused,
                  size: 24,
                })
              ) : null}
              
              {/* Gold Dot Indicator for Active State */}
              {isFocused && (
                 <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.gold, marginTop: 4 }} />
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}