import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  StatusBar,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';

// Third-party Imports
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Local Imports
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

// 🎨 Updated Premium Theme
const COLORS = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  obsidian: '#111827',
  primary: '#7E22CE',
  primaryLight: '#F3E8FF',
  text: '#1F293B',
  subtext: '#64748B',
  border: '#E2E8F0',
  red: '#EF4444',
  gold: '#F59E0B',
  blue: '#3B82F6',
  green: '#10B981',
};

const MenuItem = ({ icon, color, bg, label, subtext, onPress, hasSwitch, switchValue, onSwitchChange, badge, isDestructive }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.6}
    disabled={hasSwitch}
    style={styles.menuItem}
  >
    <View style={[styles.iconBox, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={styles.menuTextContainer}>
      <Text style={[styles.menuLabel, isDestructive && { color: COLORS.red }]}>{label}</Text>
      {subtext && <Text style={styles.menuSubtext} numberOfLines={1}>{subtext}</Text>}
    </View>
    {hasSwitch ? (
      <Switch
        value={switchValue}
        onValueChange={onSwitchChange}
        trackColor={{ false: '#CBD5E1', true: COLORS.primary }}
        thumbColor={'#fff'}
      />
    ) : badge ? (
      <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>
    ) : (
      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    )}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile({
        ...(data || {}),
        email: user.email,
        full_name: data?.full_name || 'Student User',
        joined: new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (!error) router.replace('/login');
        }
      }
    ]);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading && !profile) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* --- 👤 NEW HERO SECTION --- */}
        <View style={[styles.heroSection, { paddingTop: insets.top + 20 }]}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
               <Text style={styles.avatarText}>{getInitials(profile?.full_name)}</Text>
            </View>
            <TouchableOpacity style={styles.editBadge}>
                <Ionicons name="camera" size={14} color="white" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{profile?.full_name}</Text>
          <Text style={styles.userEmail}>{profile?.email}</Text>
          
          <View style={styles.membershipBadge}>
             <Ionicons name="ribbon" size={12} color={COLORS.gold} />
             <Text style={styles.membershipText}>Gold Student Member</Text>
          </View>
        </View>

        {/* --- 📊 STATS CARD --- */}
        <View style={styles.statsRow}>
            <View style={styles.statBox}>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
                <Text style={styles.statValue}>5</Text>
                <Text style={styles.statLabel}>Favorites</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
                <Text style={styles.statValue}>2.4k</Text>
                <Text style={styles.statLabel}>T-Points</Text>
            </View>
        </View>

        {/* --- 📦 MAIN MENU --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT SETTINGS</Text>
          <View style={styles.group}>
            <MenuItem
              icon="person-outline"
              color={COLORS.blue}
              bg="#E0F2FE"
              label="Personal Information"
              subtext="Edit your name and phone"
            />
            <View style={styles.divider} />
            <MenuItem
              icon="receipt-outline"
              color={COLORS.primary}
              bg={COLORS.primaryLight}
              label="Order History"
              onPress={() => router.push('/(tabs)/orders')}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="location-outline"
              color={COLORS.green}
              bg="#DCFCE7"
              label="Saved Addresses"
              subtext="Hostel, College, Gym"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PREFERENCES</Text>
          <View style={styles.group}>
            <MenuItem
              icon="notifications-outline"
              color={COLORS.gold}
              bg="#FEF3C7"
              label="Push Notifications"
              hasSwitch
              switchValue={notifications}
              onSwitchChange={setNotifications}
            />
             <View style={styles.divider} />
             <MenuItem
              icon="shield-checkmark-outline"
              color={COLORS.obsidian}
              bg="#F3F4F6"
              label="Privacy & Security"
            />
          </View>
        </View>

        {/* --- ⚠️ LOGOUT --- */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color={COLORS.red} />
          <Text style={styles.logoutBtnText}>Sign Out of TiffinTales</Text>
        </TouchableOpacity>
        
        <Text style={styles.version}>Version 1.2.0 • Made with ❤️ for Students</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // Hero Section
  heroSection: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingBottom: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.primaryLight,
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: 'white' },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.obsidian,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  userName: { fontSize: 24, fontWeight: '800', color: COLORS.obsidian, marginBottom: 4 },
  userEmail: { fontSize: 14, color: COLORS.subtext, marginBottom: 12 },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  membershipText: { fontSize: 11, fontWeight: '700', color: COLORS.gold, marginLeft: 5, textTransform: 'uppercase' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 25,
    marginTop: -25,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.obsidian },
  statLabel: { fontSize: 11, color: COLORS.subtext, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: '60%', backgroundColor: COLORS.border, alignSelf: 'center' },

  // Sections
  section: { marginTop: 30, paddingHorizontal: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: COLORS.subtext, marginLeft: 10, marginBottom: 10, letterSpacing: 1 },
  group: { backgroundColor: COLORS.surface, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 65 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuTextContainer: { flex: 1, marginLeft: 15 },
  menuLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  menuSubtext: { fontSize: 12, color: COLORS.subtext, marginTop: 2 },

  // Logout
  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 40,
    backgroundColor: '#FFF1F2',
    padding: 18,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  logoutBtnText: { color: COLORS.red, fontWeight: '800', fontSize: 16, marginLeft: 10 },
  version: { textAlign: 'center', marginTop: 20, color: COLORS.subtext, fontSize: 12, fontWeight: '600' }
});