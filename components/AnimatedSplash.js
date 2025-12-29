import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  Easing
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Premium Dark Theme Palette
const COLORS = {
  background: '#111827',   // Obsidian
  surface: '#1F2937',      // Dark Gray
  white: '#FFFFFF',
  primary: '#C084FC',      // Bright Purple Accent
  gold: '#FBBF24',         // Subtle Gold
  textGray: '#9CA3AF',
  border: 'rgba(255, 255, 255, 0.1)',
};

/**
 * AnimatedSplash Component
 * A premium, dark-themed splash screen with staggered entrance animations.
 * @param {function} onFinish - Callback triggered when animation completes.
 */
export default function AnimatedSplash({ onFinish }) {
  // Animation Values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const bgRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Background Slow Rotation (Continuous)
    Animated.loop(
      Animated.timing(bgRotate, {
        toValue: 1,
        duration: 20000, // Very slow rotation
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 2. Entrance Sequence
    Animated.sequence([
      // A. Logo Pop In
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),

      // B. Text Slide Up (Staggered)
      Animated.parallel([
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),

      // C. Hold Phase (Showcase brand)
      Animated.delay(2000),

    ]).start(() => {
      if (onFinish) onFinish();
    });
  }, []);

  // Interpolations
  const rotateInterpolate = bgRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Decorative Background Elements */}
      <Animated.View style={[styles.bgCircleContainer, { transform: [{ rotate: rotateInterpolate }] }]}>
        <View style={[styles.bgCircle, styles.circleOne]} />
        <View style={[styles.bgCircle, styles.circleTwo]} />
      </Animated.View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        
        {/* Logo Section */}
        <Animated.View style={{ transform: [{ scale: logoScale }], opacity: logoOpacity }}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../assets/loginlogo.png')}
              style={styles.logoImage}
            />
          </View>
        </Animated.View>

        {/* Text Section */}
        <Animated.View 
          style={{ 
            opacity: textOpacity, 
            transform: [{ translateY: textTranslateY }],
            alignItems: 'center',
            marginTop: 32
          }}
        >
          <Text style={styles.brandTitle}>
            TIFFIN<Text style={styles.brandAccent}>TALES</Text>
          </Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.tagline}>
            HOMEMADE HAPPINESS
          </Text>
          
          <View style={styles.featuresRow}>
            <FeatureBadge icon="check-decagram" text="Fresh" />
            <View style={styles.dot} />
            <FeatureBadge icon="flash" text="Fast" />
            <View style={styles.dot} />
            <FeatureBadge icon="heart" text="Local" />
          </View>
        </Animated.View>

      </View>

      {/* Footer */}
      <Animated.View style={[styles.footer, { opacity: textOpacity }]}>
        <Text style={styles.footerText}>v1.0.2</Text>
      </Animated.View>
    </View>
  );
}

/**
 * Helper component for small feature text rows
 */
const FeatureBadge = ({ icon, text }) => (
  <View style={styles.featureItem}>
    <MaterialCommunityIcons name={icon} size={14} color={COLORS.primary} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  
  // Background Decorations
  bgCircleContainer: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  circleOne: {
    width: width * 0.8,
    height: width * 0.8,
    borderStyle: 'dashed',
  },
  circleTwo: {
    width: width * 1.2,
    height: width * 1.2,
    opacity: 0.5,
  },

  // Content
  contentContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  logoWrapper: {
    width: width * 0.45,
    height: width * 0.45,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },

  // Typography
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 2,
  },
  brandAccent: {
    color: COLORS.primary,
  },
  divider: {
    width: 40,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginVertical: 16,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
    letterSpacing: 4,
    marginBottom: 24,
  },
  
  // Features Row
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    color: COLORS.textGray,
    fontSize: 12,
    fontWeight: '500',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.textGray,
    marginHorizontal: 12,
    opacity: 0.5,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 12,
    fontWeight: '600',
  },
});