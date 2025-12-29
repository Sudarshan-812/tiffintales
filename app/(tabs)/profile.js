import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator
} from 'react-native';

// Third-party Imports
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Local Imports
import { supabase } from '../../lib/supabase';
import { getCurrentLocation } from '../../lib/location';

// 🎨 Premium Obsidian + Cream Theme
const COLORS = {
  background: '#FDFBF7',      // Cream Background
  surface: '#FFFFFF',         // White Card
  obsidian: '#111827',        // Main Dark Color
  primary: '#7E22CE',         // Purple Accent
  primaryLight: '#F3E8FF',    // Light Purple
  text: '#1F293B',            // Dark Gray Text
  subtext: '#64748B',         // Light Gray Text
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
 * Renders a customizable row for settings/actions.
 * Extracted to prevent re-renders.
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

  // 🔄 Initial Data Load
  useEffect(() => {
    getProfile();
  }, []);

  /**
   * Fetches user profile data from Supabase.
   * Handles cases where profile row might not exist yet.
   */
  const getProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return; // Handle unauthenticated state if needed

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setProfile({
        ...(data || {}),
        email: user.email,
        full_name: data?.full_name || 'Foodie User',
        role: data?.role || 'user',
        joined: new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      });
    } catch (error) {
      Alert.alert('Error', 'Could not load profile data.');
    }
  };

  /**
   * Handles secure logout logic.
   */
  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to sign out?", [
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
   * Updates the Chef's kitchen location to current GPS coordinates.
   */
  const updateLocation = async () => {
    setLoading(true);
    try {
      const coords = await getCurrentLocation();
      if (!coords) throw new Error("Could not fetch GPS location.");

      const { error } = await supabase
        .from('profiles')
        .update({
          latitude: coords.latitude,
          longitude: coords.longitude
        })
        .eq('id', profile.id);

      if (error) throw error;

      Alert.alert("Success 📍", "Kitchen location updated to your current position!");
      getProfile(); // Refresh local state to show badge

    } catch (error) {
      Alert.alert("Location Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* 👤 Header Profile */}
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

          {/* Chef Location Tag */}
          {profile?.role === 'chef' && profile?.latitude && (
            <View style={styles.locationTag}>
              <Ionicons name="location" size={12} color={COLORS.successText} />
              <Text style={styles.locationText}>Kitchen Location Active</Text>
            </View>
          )}
        </View>

        {/* 📊 Quick Stats */}
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

        {/* 🚨 CHEF ONLY: Kitchen Settings */}
        {profile?.role === 'chef' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>KITCHEN SETTINGS</Text>
            <View style={styles.sectionCard}>
              <MenuItem
                icon="navigate-circle"
                color={COLORS.orange}
                bg={COLORS.orangeLight}
                label={loading ? "Updating GPS..." : "Update Kitchen Location"}
                subtext="Set current location for delivery calculations"
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
              icon="location"
              color={COLORS.primary}
              bg={COLORS.primaryLight}
              label="Saved Addresses"
              subtext="Manage delivery locations"
            />
          </View>
        </View>

        {/* ⚙️ Preferences */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.sectionCard}>
            <MenuItem
              icon="notifications"
              color={COLORS.obsidian}
              bg="#F3F4F6"
              label="Notifications"
              hasSwitch={true}
              switchValue={notifications}
              onSwitchChange={setNotifications}
            />
          </View>
        </View>

        {/* ⚠️ Logout Section */}
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

        <View style={styles.footerContainer}>
          <Text style={styles.versionText}>TiffinTales v1.0.2 • Made with ❤️</Text>
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
  // Profile Header
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
    marginBottom: 16,
    borderWidth: 3,
    borderColor: COLORS.surface,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5
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
    backgroundColor: COLORS.surface,
    padding: 6,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1
  },
  chefBadgeEmoji: {
    fontSize: 12
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.successBorder
  },
  locationText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.successText,
    marginLeft: 4
  },
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  statItem: {
    alignItems: 'center',
    width: '40%'
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.subtext,
    marginTop: 4,
    letterSpacing: 0.5
  },
  vertDivider: {
    width: 1,
    height: 30,
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
    marginBottom: 10,
    marginLeft: 8,
    letterSpacing: 1
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden'
  },
  // Menu Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
    marginLeft: 74
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 20
  },
  versionText: {
    fontSize: 12,
    color: COLORS.subtext,
    opacity: 0.6
  }
});