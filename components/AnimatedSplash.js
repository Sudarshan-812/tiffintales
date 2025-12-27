import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Easing,
  Dimensions,
  Image
} from 'react-native';
import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// 🎨 PREMIUM THEME
const COLORS = {
  background: '#111827',
  text: '#FFFFFF',
  accent: '#C084FC',    // Bright Purple
  gold: '#FBBF24',      // Gold
  danger: '#F87171',    // Soft Red
  success: '#34D399',   // Green
  glass: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.15)',
  glow: '#C084FC',
};

const SPACING = { sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export default function AnimatedSplash({ onFinish }) {
  
  // 🎬 ANIMATION VALUES
  const masterOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const contentTranslateY = useRef(new Animated.Value(40)).current; // Start slightly lower
  
  // Background Floating Icons
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1️⃣ Background Float Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // 2️⃣ Master Entrance Sequence
    Animated.sequence([
      // A. Everything fades in and slides up together
      Animated.parallel([
        Animated.timing(masterOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // B. Wait for you to examine (4 Seconds)
      Animated.delay(4000),

    ]).start(() => {
      if (onFinish) onFinish();
    });
  }, []);

  // Interpolate floats for background icons
  const floatY1 = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const floatY2 = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 🌫️ Background Subtle Icons */}
      <Animated.View style={[styles.bgIconTop, { transform: [{ translateY: floatY1 }] }]}>
        <MaterialCommunityIcons name="silverware-fork-knife" size={80} color={COLORS.accent} style={{ opacity: 0.05 }} />
      </Animated.View>
      <Animated.View style={[styles.bgIconBottom, { transform: [{ translateY: floatY2 }] }]}>
        <MaterialCommunityIcons name="chef-hat" size={90} color={COLORS.gold} style={{ opacity: 0.05 }} />
      </Animated.View>

      {/* 🚀 MAIN CONTENT WRAPPER */}
      <Animated.View 
        style={{ 
          opacity: masterOpacity, 
          transform: [{ translateY: contentTranslateY }],
          alignItems: 'center',
          width: '100%'
        }}
      >
        
        {/* 1. LOGO */}
        <Animated.View style={{ transform: [{ scale: logoScale }], marginBottom: SPACING.xl }}>
          <Image 
            source={require('../assets/loginlogo.png')}
            style={{ width: width * 0.5, height: width * 0.5, resizeMode: 'contain' }}
          />
        </Animated.View>

        {/* 2. TITLE */}
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.title}>
            TIFFIN<Text style={{ color: COLORS.accent }}>TALES</Text>
          </Text>
          <View style={styles.badge}>
            <Ionicons name="heart" size={16} color={COLORS.danger} style={{ marginRight: 6 }} />
            <Text style={styles.badgeText}>Homemade with Love</Text>
          </View>
        </View>

        {/* 3. TAGLINE */}
        <View style={{ marginTop: SPACING.xl, alignItems: 'center' }}>
          <Text style={styles.taglinePremium}>HOMEMADE HAPPINESS</Text>
          <Text style={styles.subTextPremium}>Fresh • Affordable • Authentic</Text>
        </View>

      </Animated.View>

      {/* 4. BOTTOM ICONS (Fade In with Master) */}
      <Animated.View 
        style={[
          styles.iconRow, 
          { 
            opacity: masterOpacity,
            transform: [{ translateY: contentTranslateY }] 
          }
        ]}
      >
        <View style={styles.iconCirclePremium}>
          <MaterialCommunityIcons name="bike" size={28} color={COLORS.accent} />
        </View>
        <View style={styles.iconCirclePremium}>
          <MaterialCommunityIcons name="food" size={28} color={COLORS.success} />
        </View>
        <View style={styles.iconCirclePremium}>
          <MaterialCommunityIcons name="heart" size={28} color={COLORS.danger} />
        </View>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  // Background Icons Positions
  bgIconTop: { position: 'absolute', top: '15%', left: '10%' },
  bgIconBottom: { position: 'absolute', bottom: '20%', right: '10%' },

  // Typography
  title: { 
    fontSize: width * 0.14, 
    fontWeight: '900', 
    color: COLORS.text, 
    letterSpacing: -1,
    textShadowColor: COLORS.glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    textAlign: 'center',
  },

  badge: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  badgeText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  taglinePremium: { 
    color: COLORS.text, 
    fontSize: 18, 
    fontWeight: '800', 
    letterSpacing: 4,
    textAlign: 'center',
  },

  subTextPremium: { 
    color: '#CBD5E1', 
    fontSize: 12, 
    marginTop: SPACING.md, 
    letterSpacing: 2,
    fontWeight: '500',
    textTransform: 'uppercase',
  },

  // Bottom Icons
  iconRow: { 
    position: 'absolute', 
    bottom: 80, 
    flexDirection: 'row', 
    gap: SPACING.xl 
  },

  iconCirclePremium: {
    width: 64, 
    height: 64, 
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.12)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1.5, 
    borderColor: 'rgba(255, 255, 255, 0.3)', 
    
    // Glow Shadows
    shadowColor: COLORS.accent, 
    shadowOpacity: 0.6,    
    shadowRadius: 25,      
    shadowOffset: { width: 0, height: 0 },
    elevation: 15,
  },
});