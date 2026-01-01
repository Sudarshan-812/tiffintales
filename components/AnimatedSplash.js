import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Platform
} from 'react-native';

import { StatusBar } from 'expo-status-bar';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// 🎨 Premium Dark Purple Palette
const COLORS = {
  bgStart: '#2E1065', // Deep Purple
  bgEnd: '#0F172A',   // Obsidian
  primary: '#C084FC', // Lavender Accent
  white: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.1)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
  textShadow: 'rgba(0,0,0,0.2)',
  taglineText: 'rgba(255, 255, 255, 0.8)',
  footerText: 'rgba(255,255,255,0.3)',
};

export default function AnimatedSplash({ onFinish }) {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Entrance (0.8s)
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)), // Slight bounce up for text
          useNativeDriver: true,
        }),
      ]),

      // 2. Hold (3s)
      Animated.delay(3000),

      // 3. Exit (0.5s)
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished && onFinish) onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 🟣 Background */}
      <LinearGradient
        colors={[COLORS.bgStart, COLORS.bgEnd]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View style={[styles.contentContainer, { opacity: opacityAnim }]}>
        
        {/* LOTTIE ANIMATION */}
        <Animated.View style={[styles.lottieWrapper, { transform: [{ scale: scaleAnim }] }]}>
          <LottieView
            source={{ uri: 'https://lottie.host/e02d6370-b109-4d7e-ba09-a8f72e71bef1/gI994HU1ud.lottie' }}
            autoPlay
            loop
            style={styles.lottie}
            resizeMode="contain"
          />
        </Animated.View>

        {/* TYPOGRAPHY SECTION */}
        <Animated.View 
          style={[
            styles.typographyContainer,
            { transform: [{ translateY: textTranslateY }] }
          ]}
        >
          {/* Main Title */}
          <Text style={styles.brandTitle}>
            Tiffin<Text style={styles.brandAccent}>Tales</Text>
          </Text>
          
          {/* Glass Pill Tagline */}
          <View style={styles.taglinePill}>
            <Text style={styles.taglineText}>HOMEMADE HAPPINESS</Text>
          </View>
        </Animated.View>

      </Animated.View>

      {/* Footer */}
      <Animated.View style={[styles.footer, { opacity: opacityAnim }]}>
        <Text style={styles.footerText}>v1.0.0</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bgEnd,
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  
  // Animation
  lottieWrapper: {
    width: width * 0.75, 
    height: width * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },

  // Typography
  typographyContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  brandTitle: {
    fontSize: 42,
    // iOS gets Avenir Next (Premium), Android gets sans-serif-medium
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    fontWeight: '700', 
    color: COLORS.white,
    letterSpacing: -1, // Tighter spacing looks more modern
    marginBottom: 16,
    textShadowColor: COLORS.textShadow,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  brandAccent: {
    color: COLORS.primary,
    fontWeight: '800', // Slightly heavier for the accent part
    fontStyle: 'italic', // Adds a bit of flair
  },
  
  // Tagline Glass Pill
  taglinePill: {
    backgroundColor: COLORS.glass,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  taglineText: {
    fontSize: 11,
    color: COLORS.taglineText,
    fontWeight: '700',
    letterSpacing: 2, // Wide spacing for tagline
    textTransform: 'uppercase',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 50,
  },
  footerText: {
    color: COLORS.footerText,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});