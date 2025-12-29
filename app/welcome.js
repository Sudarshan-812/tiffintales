import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Image
} from 'react-native';

// Third-party Imports
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Theme Constants
const COLORS = {
  background: '#FDFBF7',
  surface: '#FFFFFF',
  obsidian: '#111827',
  primary: '#7E22CE',
  primaryLight: '#F3E8FF',
  secondary: '#F97316',
  secondaryLight: '#FFEDD5',
  gray: '#6B7280',
  border: '#E5E7EB',
};

const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 40 };

const BENEFITS_DATA = [
  { icon: 'heart', label: 'Authentic', color: '#EF4444' },
  { icon: 'flash', label: 'Fast', color: '#F59E0B' },
  { icon: 'shield-checkmark', label: 'Hygienic', color: '#10B981' },
  { icon: 'star', label: 'Top Rated', color: '#3B82F6' },
];

/**
 * RoleCard Component
 * Displays a selectable role card (Eat vs. Cook).
 */
const RoleCard = ({
  title,
  subtitle,
  icon,
  backgroundColor,
  borderColor,
  textColor,
  onPress,
  features = [],
  animStyle
}) => (
  <Animated.View style={animStyle}>
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.roleCard, { backgroundColor, borderColor }]}
    >
      <View style={styles.iconSection}>
        <View style={[styles.iconCircle, { backgroundColor: '#FFFFFF' }]}>
          <Ionicons name={icon} size={32} color={textColor} />
        </View>
      </View>

      <View style={styles.textSection}>
        <Text style={[styles.roleTitle, { color: COLORS.obsidian }]}>{title}</Text>
        <Text style={[styles.roleSubtitle, { color: COLORS.gray }]}>{subtitle}</Text>

        <View style={styles.featuresList}>
          {features.map((feature, idx) => (
            <View key={idx} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={14} color={textColor} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.arrowSection}>
        <View style={[styles.arrowCircle, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
          <Ionicons name="arrow-forward" size={18} color={textColor} />
        </View>
      </View>
    </TouchableOpacity>
  </Animated.View>
);

/**
 * BenefitCard Component
 * Displays a single benefit grid item.
 */
const BenefitCard = ({ icon, label, color }) => (
  <View style={styles.benefitCard}>
    <View style={[styles.benefitIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.benefitLabel}>{label}</Text>
  </View>
);

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
      ]),
      // Gentle Sway Animation Loop
      Animated.loop(
        Animated.timing(rotateAnim, { toValue: 1, duration: 4000, useNativeDriver: true })
      ),
    ]).start();
  }, []);

  const handleLogin = () => {
    router.push('/login');
  };

  // Interpolations
  const logoRotation = rotateAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-3deg', '3deg', '-3deg']
  });

  const animatedCardStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }]
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ════ HERO SECTION ════ */}
        <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.heroBackground}>
            <View style={[styles.gradientCircle, styles.circle1]} />
            <View style={[styles.gradientCircle, styles.circle2]} />
          </View>

          {/* LOGO CONTAINER */}
          <View style={styles.logoContainer}>
            <Animated.Image
              source={require('../assets/loginlogo.png')}
              style={[styles.logoImage, { transform: [{ rotate: logoRotation }] }]}
              resizeMode="contain"
            />
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>✨ Homemade Happiness</Text>
          </View>
        </Animated.View>

        {/* ════ CONTENT SECTION ════ */}
        <Animated.View style={[styles.contentSection, { opacity: fadeAnim }]}>

          <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>
              Tiffin<Text style={{ color: COLORS.primary }}>Tales</Text>
            </Text>
            <Text style={styles.tagline}>
              Fresh meals, delivered with <Text style={{ color: COLORS.primary, fontWeight: '800' }}>love</Text>.
            </Text>
          </View>

          {/* ════ ROLE SELECTION ════ */}
          <View style={styles.rolesContainer}>
            <RoleCard
              title="I want to Eat"
              subtitle="Find affordable tiffins nearby"
              icon="fast-food"
              backgroundColor={COLORS.primaryLight}
              borderColor={COLORS.primary}
              textColor={COLORS.primary}
              features={['Fresh home-cooked meals', 'Affordable & nearby', 'Real-time tracking']}
              onPress={handleLogin}
              animStyle={animatedCardStyle}
            />
            <RoleCard
              title="I want to Cook"
              subtitle="Turn your kitchen into income"
              icon="restaurant"
              backgroundColor={COLORS.secondaryLight}
              borderColor={COLORS.secondary}
              textColor={COLORS.secondary}
              features={['Sell your recipes', 'Flexible schedule', 'Zero commission start']}
              onPress={handleLogin}
              animStyle={animatedCardStyle}
            />
          </View>

          {/* ════ BENEFITS GRID ════ */}
          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>Why choose us?</Text>
            <View style={styles.benefitsGrid}>
              {BENEFITS_DATA.map((benefit, idx) => (
                <BenefitCard
                  key={idx}
                  icon={benefit.icon}
                  label={benefit.label}
                  color={benefit.color}
                />
              ))}
            </View>
          </View>

        </Animated.View>
      </ScrollView>

      {/* ════ FOOTER ════ */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.footerDivider} />
        <View style={styles.footerContent}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40
  },
  // HERO
  heroSection: {
    height: height * 0.32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  heroBackground: {
    ...StyleSheet.absoluteFillObject
  },
  gradientCircle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.6
  },
  circle1: {
    width: 220,
    height: 220,
    backgroundColor: COLORS.primaryLight,
    top: -40,
    right: -40
  },
  circle2: {
    width: 160,
    height: 160,
    backgroundColor: COLORS.secondaryLight,
    bottom: 20,
    left: -40
  },
  logoContainer: {
    width: 130,
    height: 130,
    borderRadius: 32,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.15,
    shadowRadius: 25,
    shadowOffset: { height: 10, width: 0 },
    elevation: 10,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 25
  },
  badge: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  badgeText: {
    color: COLORS.obsidian,
    fontWeight: '700',
    fontSize: 11
  },
  // CONTENT
  contentSection: {
    paddingHorizontal: SPACING.xl,
    flex: 1
  },
  titleContainer: {
    marginBottom: SPACING.xl,
    alignItems: 'center'
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.obsidian,
    letterSpacing: -1,
    marginBottom: 4
  },
  tagline: {
    fontSize: 16,
    color: COLORS.gray,
    fontWeight: '500',
    textAlign: 'center'
  },
  // ROLE CARDS
  rolesContainer: {
    gap: SPACING.lg,
    marginBottom: SPACING.xl
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  iconSection: {
    marginRight: SPACING.md
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  textSection: {
    flex: 1
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2
  },
  roleSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2
  },
  featuresList: {
    marginTop: SPACING.md,
    gap: SPACING.xs
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  featureText: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '500'
  },
  arrowSection: {
    marginLeft: SPACING.sm
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  // BENEFITS
  benefitsSection: {
    marginBottom: SPACING.xl
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray,
    marginBottom: SPACING.md,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'space-between'
  },
  benefitCard: {
    width: (width - SPACING.xl * 2 - SPACING.md) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  benefitLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.obsidian
  },
  // FOOTER
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm
  },
  footerDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.lg
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  footerText: {
    color: COLORS.gray,
    fontSize: 14,
    fontWeight: '500'
  },
  footerLink: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 14
  },
});