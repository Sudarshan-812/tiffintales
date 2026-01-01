import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  StatusBar,
  Dimensions
} from 'react-native';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../../lib/supabase';
import { getCurrentLocation } from '../../lib/location';

const COLORS = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  obsidian: '#0F172A',
  primary: '#7E22CE',
  primaryLight: '#F5F3FF',
  text: '#1E293B',
  subtext: '#64748B',
  border: '#E2E8F0',
  red: '#EF4444',
  gold: '#F59E0B',
  blue: '#3B82F6',
  green: '#10B981',
  switchTrackFalse: '#CBD5E1',
  switchThumb: '#FFFFFF',
  chefBadgeBg: '#FFFBEB',
  chefBadgeBorder: '#FEF3C7',
  userBadgeBg: '#F5F3FF',
  userBadgeBorder: '#E9D5FF',
  logoutBg: '#FFF1F2',
  logoutBorder: '#FFE4E6',
  shadow: '#000000',
  menuItemBg1: '#FFFBEB',
  menuItemBg2: '#EFF6FF',
};

const MenuItem = ({ icon, color, bg, label, subtext, onPress, hasSwitch, isDestructive, switchValue, onSwitchChange }) => (
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
      {subtext && <Text style={styles.menuSubtext}>{subtext}</Text>}
    </View>
    {hasSwitch ? (
      <Switch
        value={switchValue}
        onValueChange={onSwitchChange}
        trackColor={{ false: COLORS.switchTrackFalse, true: COLORS.primary }}
        thumbColor={COLORS.switchThumb}
      />
    ) : (
      <Ionicons name="chevron-forward" size={16} color={COLORS.subtext} />
    )}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setProfile({
        ...(data || {}),
        email: user.email,
        full_name: data?.full_name || 'User',
        role: data?.role || 'user',
        joined: new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      });
    } catch (error) {
      Alert.alert("Error", "Could not load profile.");
    }
  };

  const updateLocation = async () => {
    setLoading(true);
    try {
      const coords = await getCurrentLocation();
      if (!coords) throw new Error("Location permission denied.");

      const { error } = await supabase
        .from('profiles')
        .update({ latitude: coords.latitude, longitude: coords.longitude })
        .eq('id', profile.id);

      if (error) throw error;
      Alert.alert("Success 📍", "Kitchen coordinates updated!");
      getProfile();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* --- HERO HEADER --- */}
        <LinearGradient 
          colors={[COLORS.surface, COLORS.background]} 
          style={[styles.hero, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
               <Text style={styles.avatarText}>{profile?.full_name?.[0]?.toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.editBadge}>
                <Ionicons name="camera" size={14} color={COLORS.surface} />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{profile?.full_name}</Text>
          <Text style={styles.userEmail}>{profile?.email}</Text>
          
          <View style={[styles.roleBadge, profile?.role === 'chef' ? styles.chefTheme : styles.userTheme]}>
             <Ionicons 
                name={profile?.role === 'chef' ? "restaurant" : "person"} 
                size={12} 
                color={profile?.role === 'chef' ? COLORS.gold : COLORS.primary} 
             />
             <Text style={[styles.roleText, { color: profile?.role === 'chef' ? COLORS.gold : COLORS.primary }]}>
                {profile?.role === 'chef' ? 'Professional Chef' : 'Verified Member'}
             </Text>
          </View>
        </LinearGradient>

        {/* --- DASHBOARD STATS --- */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
             <Text style={styles.statValue}>{profile?.role === 'chef' ? '24' : '12'}</Text>
             <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
             <Text style={styles.statValue}>{profile?.joined || '...'}</Text>
             <Text style={styles.statLabel}>Joined Date</Text>
          </View>
        </View>

        {/* --- KITCHEN/ACCOUNT SECTION --- */}
        {profile?.role === 'chef' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>KITCHEN LOGISTICS</Text>
            <View style={styles.menuGroup}>
              <MenuItem
                icon="navigate-circle"
                color={COLORS.gold}
                bg={COLORS.menuItemBg1}
                label={loading ? "Syncing GPS..." : "Update Kitchen Location"}
                subtext={profile?.latitude ? "Location verified ✅" : "Set your GPS coordinates"}
                onPress={updateLocation}
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PREFERENCES</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="receipt"
              color={COLORS.blue}
              bg={COLORS.menuItemBg2}
              label="Order History"
              onPress={() => router.push('/(tabs)/orders')}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="notifications"
              color={COLORS.primary}
              bg={COLORS.primaryLight}
              label="Push Notifications"
              hasSwitch
              switchValue={notifications}
              onSwitchChange={setNotifications}
            />
          </View>
        </View>

        {/* --- LOGOUT --- */}
        <View style={styles.section}>
           <TouchableOpacity 
              style={styles.logoutBtn} 
              onPress={() => supabase.auth.signOut().then(() => router.replace('/welcome'))}
           >
              <Ionicons name="log-out-outline" size={20} color={COLORS.red} />
              <Text style={styles.logoutBtnText}>Sign Out</Text>
           </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  hero: {
    alignItems: 'center',
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.surface,
  },
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
    borderColor: COLORS.surface,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.obsidian,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.subtext,
    marginBottom: 15,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chefTheme: {
    backgroundColor: COLORS.chefBadgeBg,
    borderWidth: 1,
    borderColor: COLORS.chefBadgeBorder,
  },
  userTheme: {
    backgroundColor: COLORS.userBadgeBg,
    borderWidth: 1,
    borderColor: COLORS.userBadgeBorder,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 25,
    marginTop: -25,
    borderRadius: 24,
    paddingVertical: 20,
    elevation: 5,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.subtext,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: COLORS.border,
    alignSelf: 'center',
  },
  section: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.subtext,
    marginLeft: 10,
    marginBottom: 10,
    letterSpacing: 1.2,
  },
  menuGroup: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  menuSubtext: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 2,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 70,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.logoutBg,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.logoutBorder,
  },
  logoutBtnText: {
    color: COLORS.red,
    fontWeight: '800',
    fontSize: 16,
    marginLeft: 10,
  },
});