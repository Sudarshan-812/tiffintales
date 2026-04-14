import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../lib/store';
import { COLORS, SHADOW, RADIUS } from '../../lib/theme';

// ─── Menu Row ─────────────────────────────────────────────────────────────────

const MenuRow = ({ icon, iconColor, iconBg, label, sublabel, onPress, rightElement }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.6}
    style={styles.menuRow}
  >
    <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <View style={styles.menuText}>
      <Text style={styles.menuLabel}>{label}</Text>
      {sublabel ? <Text style={styles.menuSub} numberOfLines={1}>{sublabel}</Text> : null}
    </View>
    {rightElement || <Ionicons name="chevron-forward" size={15} color={COLORS.muted} />}
  </TouchableOpacity>
);

// ─── Stat Box ─────────────────────────────────────────────────────────────────

const StatBox = ({ value, label, icon, iconColor }) => (
  <View style={styles.statBox}>
    <View style={[styles.statIcon, { backgroundColor: iconColor + '18' }]}>
      <Ionicons name={icon} size={16} color={iconColor} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useCart();

  const [profile,       setProfile]       = useState(null);
  const [orderCount,    setOrderCount]    = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [notifications, setNotifications] = useState(true);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, ordersRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      setProfile({
        ...(profileRes.data || {}),
        email: user.email,
        full_name: profileRes.data?.full_name || 'User',
        joined: new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      });
      setOrderCount(ordersRes.count || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadProfile(); }, []));

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  const getInitials = (name = 'U') =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading && !profile) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const name = profile?.full_name || 'User';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Hero ───────────────────────────────── */}
        <View style={[styles.hero, { paddingTop: insets.top + 28 }]}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(name)}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.cameraBadge}>
              <Ionicons name="camera" size={13} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.heroName}>{name}</Text>
          <Text style={styles.heroEmail}>{profile?.email || 'Guest User'}</Text>

          <View style={styles.memberBadge}>
            <Ionicons name="ribbon" size={12} color={COLORS.warning} />
            <Text style={styles.memberText}>GOLD MEMBER</Text>
            <View style={styles.memberDot} />
            <Text style={styles.memberSince}>since {profile?.joined || '—'}</Text>
          </View>
        </View>

        {/* ── Stats ─────────────────────────────── */}
        <View style={styles.statsCard}>
          <StatBox
            value={orderCount}
            label="Orders"
            icon="receipt-outline"
            iconColor={COLORS.primary}
          />
          <View style={styles.statDivider} />
          <StatBox
            value="0"
            label="Favorites"
            icon="heart-outline"
            iconColor={COLORS.error}
          />
          <View style={styles.statDivider} />
          <StatBox
            value={orderCount * 10}
            label="T-Points"
            icon="star-outline"
            iconColor={COLORS.warning}
          />
        </View>

        {/* ── Refer Banner ──────────────────────── */}
        <TouchableOpacity style={styles.referBanner} activeOpacity={0.85}>
          <View style={styles.referLeft}>
            <Text style={styles.referEmoji}>🎁</Text>
            <View>
              <Text style={styles.referTitle}>Refer & Earn</Text>
              <Text style={styles.referSub}>Get ₹50 for each friend you invite</Text>
            </View>
          </View>
          <View style={styles.referArrow}>
            <Ionicons name="arrow-forward" size={15} color={COLORS.primary} />
          </View>
        </TouchableOpacity>

        {/* ── Account ───────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.group}>
            <MenuRow
              icon="person-outline"
              iconColor={COLORS.info}
              iconBg={COLORS.infoLight}
              label="Personal Information"
              sublabel="Edit name, phone & email"
            />
            <View style={styles.rowDivider} />
            <MenuRow
              icon="receipt-outline"
              iconColor={COLORS.primary}
              iconBg={COLORS.primaryLight}
              label="Order History"
              sublabel={`${orderCount} order${orderCount !== 1 ? 's' : ''} placed`}
              onPress={() => router.push('/(tabs)/orders')}
            />
            <View style={styles.rowDivider} />
            <MenuRow
              icon="location-outline"
              iconColor={COLORS.success}
              iconBg={COLORS.successLight}
              label="Saved Addresses"
              sublabel="Hostel, College, Home"
            />
            <View style={styles.rowDivider} />
            <MenuRow
              icon="wallet-outline"
              iconColor={COLORS.warning}
              iconBg={COLORS.warningLight}
              label="Payment Methods"
              sublabel="UPI, Cards"
            />
          </View>
        </View>

        {/* ── Preferences ───────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PREFERENCES</Text>
          <View style={styles.group}>
            <MenuRow
              icon="notifications-outline"
              iconColor={COLORS.warning}
              iconBg={COLORS.warningLight}
              label="Push Notifications"
              rightElement={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: COLORS.light, true: COLORS.primary }}
                  thumbColor={COLORS.surface}
                  ios_backgroundColor={COLORS.light}
                />
              }
            />
            <View style={styles.rowDivider} />
            <MenuRow
              icon="shield-checkmark-outline"
              iconColor={COLORS.dark}
              iconBg={COLORS.border}
              label="Privacy & Security"
            />
            <View style={styles.rowDivider} />
            <MenuRow
              icon="help-circle-outline"
              iconColor={COLORS.medium}
              iconBg={COLORS.border}
              label="Help & Support"
            />
          </View>
        </View>

        {/* ── Sign Out ──────────────────────────── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <View style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          </View>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>TiffinTales v1.2.0 · Made with ❤️ for students</Text>

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: COLORS.background },
  loader:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  scroll:  { paddingBottom: 100 },

  // ── Hero ────────────────────────────────────────────
  hero: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingBottom: 30,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    ...SHADOW.md,
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatarRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#FFF' },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.obsidian,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: COLORS.surface,
  },
  heroName:  { fontSize: 22, fontWeight: '900', color: COLORS.obsidian, marginBottom: 4 },
  heroEmail: { fontSize: 13, color: COLORS.medium, fontWeight: '500', marginBottom: 14 },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 5,
  },
  memberText:  { fontSize: 10, fontWeight: '800', color: COLORS.warning, letterSpacing: 0.8 },
  memberDot:   { width: 3, height: 3, borderRadius: 2, backgroundColor: COLORS.warning, opacity: 0.5 },
  memberSince: { fontSize: 10, color: COLORS.warning, fontWeight: '500', opacity: 0.8 },

  // ── Stats ────────────────────────────────────────────
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 24,
    marginTop: -24,
    borderRadius: RADIUS['2xl'],
    padding: 20,
    ...SHADOW.lg,
    borderWidth: 1,
    borderColor: COLORS.light,
  },
  statBox:    { flex: 1, alignItems: 'center' },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue:   { fontSize: 18, fontWeight: '900', color: COLORS.obsidian },
  statLabel:   { fontSize: 11, color: COLORS.medium, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, alignSelf: 'stretch', marginVertical: 4, backgroundColor: COLORS.border },

  // ── Refer Banner ────────────────────────────────────
  referBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryFaint,
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  referLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  referEmoji: { fontSize: 30 },
  referTitle: { fontSize: 15, fontWeight: '800', color: COLORS.obsidian, marginBottom: 2 },
  referSub:   { fontSize: 12, color: COLORS.medium, fontWeight: '500' },
  referArrow: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Sections ─────────────────────────────────────────
  section: { marginTop: 28, paddingHorizontal: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.gray,
    letterSpacing: 1.4,
    marginLeft: 6,
    marginBottom: 10,
  },
  group: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.light,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: { flex: 1, marginLeft: 14 },
  menuLabel: { fontSize: 15, fontWeight: '700', color: COLORS.dark },
  menuSub:   { fontSize: 12, color: COLORS.medium, marginTop: 1, fontWeight: '500' },
  rowDivider: { height: 1, backgroundColor: COLORS.border, marginLeft: 70 },

  // ── Sign Out ─────────────────────────────────────────
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorLight,
    marginHorizontal: 20,
    marginTop: 36,
    padding: 17,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 12,
  },
  logoutIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: { color: COLORS.error, fontWeight: '800', fontSize: 16 },

  // ── Version ──────────────────────────────────────────
  version: {
    textAlign: 'center',
    marginTop: 20,
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
  },
});
