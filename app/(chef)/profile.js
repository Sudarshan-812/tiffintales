import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

import { supabase } from '../../lib/supabase';
import { getCurrentLocation } from '../../lib/location';
import { useCart } from '../../lib/store';
import { COLORS, SHADOW, RADIUS } from '../../lib/theme';

// ─── Menu Item Row ─────────────────────────────────────────────────────────────

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
      <Text style={[styles.menuLabel, isDestructive && { color: COLORS.error }]}>{label}</Text>
      {subtext ? <Text style={styles.menuSubtext}>{subtext}</Text> : null}
    </View>
    {hasSwitch ? (
      <Switch
        value={switchValue}
        onValueChange={onSwitchChange}
        trackColor={{ false: COLORS.muted, true: COLORS.primary }}
        thumbColor="#FFFFFF"
      />
    ) : (
      <Ionicons name="chevron-forward" size={16} color={COLORS.medium} />
    )}
  </TouchableOpacity>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChefProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useCart();

  const [profile,        setProfile]        = useState(null);
  const [orderCount,     setOrderCount]     = useState(0);
  const [loading,        setLoading]        = useState(false);
  const [notifications,  setNotifications]  = useState(true);

  useEffect(() => { getProfile(); }, []);

  const getProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, ordersRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('chef_id', user.id),
      ]);

      if (profileRes.error && profileRes.error.code !== 'PGRST116') throw profileRes.error;

      setProfile({
        ...(profileRes.data || {}),
        email: user.email,
        full_name: profileRes.data?.full_name || 'Chef',
        role: profileRes.data?.role || 'chef',
        joined: new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      });
      setOrderCount(ordersRes.count || 0);
    } catch {
      Alert.alert('Error', 'Could not load profile.');
    }
  };

  const updateLocation = async () => {
    setLoading(true);
    try {
      const coords = await getCurrentLocation();
      if (!coords) throw new Error('Location permission denied.');

      const { error } = await supabase
        .from('profiles')
        .update({ latitude: coords.latitude, longitude: coords.longitude })
        .eq('id', profile.id);

      if (error) throw error;
      Alert.alert('Success', 'Kitchen coordinates updated!');
      getProfile();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Exit your chef account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => { await signOut(); router.replace('/login'); },
      },
    ]);
  };

  const initials = profile?.full_name?.[0]?.toUpperCase() ?? '?';

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Hero ── */}
        <LinearGradient
          colors={[COLORS.primaryFaint, COLORS.background]}
          style={styles.hero}
        >
          {/* Header row */}
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroTag}>MY ACCOUNT</Text>
              <Text style={styles.heroTitle}>Account</Text>
            </View>
          </View>

          {/* Avatar */}
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={13} color="#FFF" />
            </View>
          </View>

          <Text style={styles.userName}>{profile?.full_name}</Text>
          <Text style={styles.userEmail}>{profile?.email}</Text>

          <View style={styles.chefBadge}>
            <Ionicons name="restaurant" size={11} color={COLORS.primary} />
            <Text style={styles.chefBadgeText}>Professional Chef</Text>
          </View>
        </LinearGradient>

        {/* ── Stats card ── */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{orderCount}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {orderCount > 0 ? `₹${(orderCount * 80).toLocaleString()}` : '₹0'}
            </Text>
            <Text style={styles.statLabel}>Est. Earned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{profile?.joined ?? '—'}</Text>
            <Text style={styles.statLabel}>Joined</Text>
          </View>
        </View>

        {/* ── Kitchen Logistics ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>KITCHEN LOGISTICS</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="navigate-circle"
              color="#F59E0B"
              bg="#FFFBEB"
              label={loading ? 'Syncing GPS…' : 'Update Kitchen Location'}
              subtext={profile?.latitude ? 'Location verified ✓' : 'Set your GPS coordinates'}
              onPress={updateLocation}
            />
          </View>
        </View>

        {/* ── Preferences ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PREFERENCES</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="receipt"
              color="#3B82F6"
              bg="#EFF6FF"
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

        {/* ── Sign Out ── */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <View style={styles.logoutIconBox}>
              <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
            </View>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 110 },

  // ── Hero ─────────────────────────────────────────────
  hero: {
    alignItems: 'center',
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  heroHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 12,
  },
  heroTag: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.obsidian,
    letterSpacing: -0.5,
  },
  avatarRing: {
    position: 'relative',
    marginBottom: 14,
    width: 96,
    height: 96,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 10,
  },
  avatarText: { fontSize: 34, fontWeight: '800', color: '#FFF' },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.obsidian,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.obsidian,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.medium,
    marginBottom: 14,
  },
  chefBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primaryFaint,
    gap: 5,
  },
  chefBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // ── Stats ────────────────────────────────────────────
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginTop: -16,
    borderRadius: RADIUS.xl,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: COLORS.light,
    ...SHADOW.lg,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 17, fontWeight: '800', color: COLORS.obsidian },
  statLabel: { fontSize: 10, color: COLORS.medium, fontWeight: '600', marginTop: 3, letterSpacing: 0.3 },
  statDivider: { width: 1, height: '55%', backgroundColor: COLORS.light, alignSelf: 'center' },

  // ── Sections ─────────────────────────────────────────
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.medium,
    marginLeft: 6,
    marginBottom: 10,
    letterSpacing: 1.4,
  },
  menuGroup: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.light,
    ...SHADOW.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuTextContainer: { flex: 1, marginLeft: 14 },
  menuLabel: { fontSize: 15, fontWeight: '700', color: COLORS.obsidian },
  menuSubtext: { fontSize: 12, color: COLORS.medium, marginTop: 2 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 70 },

  // ── Logout ───────────────────────────────────────────
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorLight,
    padding: 18,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 10,
  },
  logoutIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: { color: COLORS.error, fontWeight: '800', fontSize: 15 },
});
