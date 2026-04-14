import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOW, RADIUS, SPACING } from '../lib/theme';

const { width, height } = Dimensions.get('window');

const BENEFITS = [
  { icon: 'heart',             label: 'Authentic',  color: '#EF4444' },
  { icon: 'flash',             label: 'Fast',       color: COLORS.warning },
  { icon: 'shield-checkmark',  label: 'Hygienic',   color: COLORS.success },
  { icon: 'star',              label: 'Top Rated',  color: COLORS.info },
];

// ─── Role Card ─────────────────────────────────────────────────────────────────

const RoleCard = ({ title, subtitle, icon, bg, accent, features, isActive, onPress, animStyle }) => {
  const pressAnim = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={[animStyle, { transform: [{ scale: pressAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={() => Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true, friction: 5 }).start()}
        onPressOut={() => Animated.spring(pressAnim, { toValue: 1,    useNativeDriver: true, friction: 5 }).start()}
        style={[styles.roleCard, { backgroundColor: bg, borderColor: isActive ? accent : COLORS.light }]}
      >
        <View style={[styles.roleIconBox, { backgroundColor: isActive ? accent : COLORS.surface }]}>
          <Ionicons name={icon} size={28} color={isActive ? '#FFF' : accent} />
        </View>

        <View style={styles.roleBody}>
          <Text style={styles.roleTitle}>{title}</Text>
          <Text style={styles.roleSubtitle}>{subtitle}</Text>
          <View style={styles.featureList}>
            {features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={13} color={accent} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.arrowBox, { backgroundColor: isActive ? accent : COLORS.surface }]}>
          <Ionicons
            name={isActive ? 'checkmark' : 'arrow-forward'}
            size={18}
            color={isActive ? '#FFF' : accent}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Benefit Chip ──────────────────────────────────────────────────────────────

const BenefitCard = ({ icon, label, color }) => (
  <View style={styles.benefitCard}>
    <View style={[styles.benefitIcon, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.benefitLabel}>{label}</Text>
  </View>
);

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const rockAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rockAnim, { toValue: 1,  duration: 2000, useNativeDriver: true }),
          Animated.timing(rockAnim, { toValue: -1, duration: 2000, useNativeDriver: true }),
          Animated.timing(rockAnim, { toValue: 0,  duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const handleSelect = (role) => {
    setSelected(role);
    setTimeout(() => router.push('/login'), 160);
  };

  const rockRotate = rockAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-4deg', '4deg'] });
  const cardAnim   = { opacity: fadeAnim, transform: [{ translateY: slideAnim }] };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Decorative blobs */}
      <View style={[styles.blob, styles.blobTR]} />
      <View style={[styles.blob, styles.blobBL]} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Hero ── */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Animated.View style={[styles.logoCard, { transform: [{ rotate: rockRotate }] }]}>
            <Text style={styles.logoEmoji}>🍱</Text>
          </Animated.View>

          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={11} color={COLORS.primary} />
            <Text style={styles.heroBadgeText}>Homemade Happiness</Text>
          </View>
        </Animated.View>

        {/* ── Title ── */}
        <Animated.View style={[styles.titleBlock, { opacity: fadeAnim }]}>
          <Text style={styles.mainTitle}>
            Tiffin<Text style={{ color: COLORS.primary }}>Tales</Text>
          </Text>
          <Text style={styles.tagline}>
            Fresh meals, delivered with{' '}
            <Text style={{ color: COLORS.primary, fontWeight: '800' }}>love</Text>.
          </Text>
        </Animated.View>

        {/* ── Role Cards ── */}
        <View style={styles.rolesWrap}>
          <RoleCard
            title="I want to Eat"
            subtitle="Find affordable tiffins nearby"
            icon="fast-food"
            bg={COLORS.primaryFaint}
            accent={COLORS.primary}
            features={['Fresh home-cooked meals', 'Affordable & nearby', 'Real-time tracking']}
            isActive={selected === 'eat'}
            onPress={() => handleSelect('eat')}
            animStyle={cardAnim}
          />
          <RoleCard
            title="I want to Cook"
            subtitle="Turn your kitchen into income"
            icon="restaurant"
            bg={COLORS.successLight}
            accent={COLORS.success}
            features={['Sell your recipes', 'Flexible schedule', 'Zero commission start']}
            isActive={selected === 'cook'}
            onPress={() => handleSelect('cook')}
            animStyle={cardAnim}
          />
        </View>

        {/* ── Benefits ── */}
        <Animated.View style={[styles.benefitsBlock, { opacity: fadeAnim }]}>
          <Text style={styles.benefitsTitle}>WHY CHOOSE US</Text>
          <View style={styles.benefitsGrid}>
            {BENEFITS.map((b, i) => (
              <BenefitCard key={i} icon={b.icon} label={b.label} color={b.color} />
            ))}
          </View>
        </Animated.View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.surface },
  scroll: { flexGrow: 1, paddingBottom: 40 },

  // Decorative blobs
  blob: { position: 'absolute', borderRadius: 999 },
  blobTR: {
    width: 260, height: 260,
    backgroundColor: COLORS.primaryLight,
    top: -80, right: -80,
    opacity: 0.5,
  },
  blobBL: {
    width: 180, height: 180,
    backgroundColor: COLORS.successLight,
    bottom: 100, left: -60,
    opacity: 0.5,
  },

  // ── Hero ─────────────────────────────────────────────
  hero: {
    height: height * 0.28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoCard: {
    width: 120, height: 120,
    borderRadius: RADIUS['2xl'],
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.light,
    ...SHADOW.lg,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.18,
  },
  logoEmoji: { fontSize: 58 },
  heroBadge: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.light,
    ...SHADOW.sm,
  },
  heroBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },

  // ── Title ────────────────────────────────────────────
  titleBlock: { alignItems: 'center', marginBottom: 28, paddingHorizontal: 24 },
  mainTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: COLORS.obsidian,
    letterSpacing: -1.2,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    color: COLORS.medium,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Role Cards ───────────────────────────────────────
  rolesWrap: { paddingHorizontal: 20, gap: 14, marginBottom: 28 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    ...SHADOW.sm,
  },
  roleIconBox: {
    width: 54, height: 54,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: COLORS.light,
  },
  roleBody:    { flex: 1 },
  roleTitle:   { fontSize: 16, fontWeight: '800', color: COLORS.obsidian, marginBottom: 2 },
  roleSubtitle:{ fontSize: 12, color: COLORS.medium, fontWeight: '500', marginBottom: 8 },
  featureList: { gap: 4 },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  featureText: { fontSize: 11, color: COLORS.medium, fontWeight: '500' },
  arrowBox: {
    width: 36, height: 36,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: COLORS.light,
  },

  // ── Benefits ─────────────────────────────────────────
  benefitsBlock: { paddingHorizontal: 20, marginBottom: 8 },
  benefitsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.medium,
    letterSpacing: 1.6,
    textAlign: 'center',
    marginBottom: 14,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  benefitCard: {
    width: (width - 40 - 12) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.light,
    ...SHADOW.xs,
  },
  benefitIcon: {
    width: 44, height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitLabel: { fontSize: 13, fontWeight: '700', color: COLORS.obsidian },

  // ── Footer ───────────────────────────────────────────
  footer: { paddingHorizontal: 20, paddingTop: 20 },
  footerDivider: { height: 1, backgroundColor: COLORS.border, marginBottom: 16 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 14, color: COLORS.medium, fontWeight: '500' },
  footerLink: { fontSize: 14, color: COLORS.primary, fontWeight: '800' },
});
