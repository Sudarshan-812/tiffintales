import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  Platform,
  ActivityIndicator
} from 'react-native';

// Third-party Imports
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Local Imports
import { supabase } from '../../lib/supabase';
import { getCurrentLocation } from '../../lib/location';

// 🎨 Brand Theme Constants
const COLORS = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  primary: '#7E22CE',
  primaryLight: '#F3E8FF',
  text: '#1E293B',
  subtext: '#64748B',
  border: '#E2E8F0',
  red: '#EF4444',
  redLight: '#FEF2F2',
  blueLight: '#DBEAFE',
  blue: '#2563EB',
  orangeLight: '#FFEDD5',
  orange: '#F97316',
  successBg: '#F0FDF4',
  successBorder: '#DCFCE7',
  successText: '#16A34A',
};

/**
 * MenuItem Component
 * Renders a row in the settings list with an icon, label, and optional switch or chevron.
 */
const MenuItem = ({ 
  icon, 
  color, 
  bg, 
  label, 
  subtext, 
  onPress, 
  hasSwitch, 
  isDestructive,
  switchValue,
  onSwitchChange 
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    disabled={hasSwitch}
    style={styles.menuItem}
  >
    <View style={[styles.iconBox, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={styles.menuTextContainer}>
      <Text style={[styles.menuLabel, isDestructive && { color: COLORS.red }]}>
        {label}
      </Text>
      {subtext && <Text style={styles.menuSubtext}>{subtext}</Text>}
    </View>
    {hasSwitch ? (
      <Switch
        value={switchValue}
        onValueChange={onSwitchChange}
        trackColor={{ false: '#CBD5E1', true: COLORS.primary }}
        thumbColor={'#fff'}
      />
    ) : (
      <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
    )}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // State
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // 🔄 Initial Load
  useEffect(() => {
    getProfile();
  }, []);

  /**
   * Fetches the current user's profile data from Supabase.
   */
  const getProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Handle unauthenticated state if necessary
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error for new users

      setProfile({
        ...(data || {}),
        email: user.email,
        full_name: data?.full_name || 'User', // Fallback
        role: data?.role || 'user',
        joined: new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      });

    } catch (error) {
      console.error("Profile Fetch Error:", error);
      Alert.alert("Error", "Could not load profile data.");
    }
  };

  /**
   * Handles user logout with confirmation.
   */
  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to exit?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) Alert.alert("Error", error.message);
          else router.replace('/welcome');
        }
      }
    ]);
  };

  /**
   * Updates the Chef's kitchen location in the database using device GPS.
   */
  const updateLocation = async () => {
    setLoading(true);
    try {
      const coords = await getCurrentLocation();
      if (!coords) throw new Error("Could not fetch GPS location. Please check permissions.");

      const { error } = await supabase
        .from('profiles')
        .update({
          latitude: coords.latitude,
          longitude: coords.longitude
        })
        .eq('id', profile.id);

      if (error) throw error;

      Alert.alert("Success 📍", "Kitchen location updated to your current position!");
      getProfile(); // Refresh local data to show badge

    } catch (error) {
      Alert.alert("Location Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* 👤 Header Section */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {profile?.email?.[0]?.toUpperCase() || 'U'}
            </Text>
            {profile?.role === 'chef' && (
              <View style={styles.chefBadge}>
                <Text style={styles.chefBadgeEmoji}>👨‍🍳</Text>
              </View>
            )}
          </View>
          <Text style={styles.userName}>{profile?.full_name}</Text>
          <Text style={styles.userHandle}>{profile?.email}</Text>

          {/* Chef Location Badge */}
          {profile?.role === 'chef' && profile?.latitude && (
            <View style={styles.locationTag}>
              <Ionicons name="location" size={10} color={COLORS.successText} />
              <Text style={styles.locationText}>Kitchen Location Set</Text>
            </View>
          )}
        </View>

        {/* 📊 Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.role === 'chef' ? '24' : '12'}</Text>
            <Text style={styles.statLabel}>{profile?.role === 'chef' ? 'Orders Received' : 'Orders Placed'}</Text>
          </View>
          <View style={styles.vertDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.joined || "..."}</Text>
            <Text style={styles.statLabel}>Member Since</Text>
          </View>
        </View>

        {/* 🚨 CHEF ONLY SECTION */}
        {profile?.role === 'chef' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>KITCHEN SETTINGS</Text>
            <View style={styles.sectionCard}>
              <MenuItem
                icon="navigate-circle"
                color={COLORS.orange}
                bg={COLORS.orangeLight}
                label={loading ? "Updating GPS..." : "Update Kitchen Location"}
                subtext="Set current location for delivery calc"
                onPress={updateLocation}
              />
            </View>
          </View>
        )}

        {/* 📦 Standard Account Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>MY ACCOUNT</Text>
          <View style={styles.sectionCard}>
            <MenuItem
              icon="receipt"
              color={COLORS.blue}
              bg={COLORS.blueLight}
              label="Order History"
              subtext="View past transactions"
              onPress={() => router.push('/(tabs)/orders')}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="settings"
              color={COLORS.primary}
              bg={COLORS.primaryLight}
              label="App Settings"
              subtext="Notifications, Language"
              hasSwitch={true}
              switchValue={notifications}
              onSwitchChange={setNotifications}
            />
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionCard}>
            <MenuItem
              icon="log-out"
              color={COLORS.red}
              bg={COLORS.redLight}
              label="Log Out"
              isDestructive={true}
              onPress={handleLogout}
            />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    paddingBottom: 100
  },
  // Header
  profileHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: COLORS.surface,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.primary
  },
  chefBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  chefBadgeEmoji: {
    fontSize: 10
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text
  },
  userHandle: {
    fontSize: 14,
    color: COLORS.subtext,
    marginTop: 2
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.successBorder
  },
  locationText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.successText,
    marginLeft: 4
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  statItem: {
    alignItems: 'center',
    width: '40%'
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.subtext,
    marginTop: 2
  },
  vertDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border
  },
  // Sections
  sectionContainer: {
    marginBottom: 24,
    paddingHorizontal: 20
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.subtext,
    marginBottom: 8,
    marginLeft: 8,
    letterSpacing: 1
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden'
  },
  // Menu Item
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 18
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 16
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text
  },
  menuSubtext: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 2
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 70
  },
});