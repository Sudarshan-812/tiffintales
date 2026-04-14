/**
 * SlideTabBar
 * Touch-hold-and-slide tab bar with smooth spring animations.
 * Usage: pass as `tabBar` prop in Expo Router <Tabs>.
 *
 * Props:
 *   state, descriptors, navigation  — from Expo Router
 *   tabConfig  — array of { icon, activeIcon, label }
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW } from '../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_HEIGHT  = Platform.OS === 'ios' ? 84 : 66;
const PAD_BOTTOM  = Platform.OS === 'ios' ? 24 : 8;
const PILL_W      = 52;
const PILL_H      = 32;

export default function SlideTabBar({ state, descriptors, navigation, tabConfig }) {
  const routes   = state.routes;
  const numTabs  = routes.length;
  const TAB_W    = SCREEN_WIDTH / numTabs;

  // ─── Animated values ──────────────────────────────────────────────────────

  // Pill slides horizontally; base = centre of tab 0
  const pillX     = useRef(new Animated.Value(state.index * TAB_W)).current;
  const pillScale = useRef(new Animated.Value(1)).current;

  // Per-tab icon lift + scale
  const iconScale = useRef(routes.map((_, i) =>
    new Animated.Value(i === state.index ? 1.15 : 1)
  )).current;
  const iconLift  = useRef(routes.map((_, i) =>
    new Animated.Value(i === state.index ? -4 : 0)
  )).current;

  const [hovered, setHovered] = useState(null);
  const dragging   = useRef(false);
  const activeIdx  = useRef(state.index);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

  const idxFromX = (pageX) => clamp(Math.floor(pageX / TAB_W), 0, numTabs - 1);

  // Pill target X = centre of tab - half pill width
  const pillTarget = (i) => i * TAB_W + (TAB_W - PILL_W) / 2;

  const springPill = (i) => {
    Animated.spring(pillX, {
      toValue: pillTarget(i),
      useNativeDriver: true,
      friction: 6,
      tension: 120,
    }).start();
  };

  const snapIcons = (focusedIdx) => {
    routes.forEach((_, i) => {
      const on = i === focusedIdx;
      Animated.spring(iconScale[i], {
        toValue: on ? 1.15 : 1,
        useNativeDriver: true,
        friction: 5,
        tension: 150,
      }).start();
      Animated.spring(iconLift[i], {
        toValue: on ? -4 : 0,
        useNativeDriver: true,
        friction: 5,
        tension: 150,
      }).start();
    });
  };

  const pressIn = () => {
    Animated.spring(pillScale, {
      toValue: 0.88,
      useNativeDriver: true,
      friction: 6,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(pillScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  // ─── Sync pill when navigation changes externally ──────────────────────────

  useEffect(() => {
    if (!dragging.current) {
      activeIdx.current = state.index;
      springPill(state.index);
      snapIcons(state.index);
    }
  }, [state.index]);

  // Initialise positions without animation
  useEffect(() => {
    pillX.setValue(pillTarget(state.index));
    snapIcons(state.index);
  }, []);

  // ─── Track pill in real-time while dragging ────────────────────────────────

  const movePillTo = (idx) => {
    Animated.timing(pillX, {
      toValue: pillTarget(idx),
      duration: 60,
      useNativeDriver: true,
    }).start();
    snapIcons(idx);
  };

  // ─── PanResponder ─────────────────────────────────────────────────────────

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  (_, g) => Math.abs(g.dx) > 4,

      onPanResponderGrant: (evt) => {
        dragging.current = false;
        pressIn();
        const idx = idxFromX(evt.nativeEvent.pageX);
        setHovered(idx);
      },

      onPanResponderMove: (evt, g) => {
        if (Math.abs(g.dx) > 6) dragging.current = true;
        const idx = idxFromX(evt.nativeEvent.pageX);
        setHovered(idx);
        movePillTo(idx);
      },

      onPanResponderRelease: (evt, g) => {
        pressOut();
        const idx = idxFromX(evt.nativeEvent.pageX);
        const finalIdx = idx;

        activeIdx.current = finalIdx;
        dragging.current  = false;
        setHovered(null);

        springPill(finalIdx);
        snapIcons(finalIdx);
        navigation.navigate(routes[finalIdx].name);
      },

      onPanResponderTerminate: () => {
        pressOut();
        dragging.current = false;
        setHovered(null);
        springPill(activeIdx.current);
        snapIcons(activeIdx.current);
      },
    })
  ).current;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.bar} {...pan.panHandlers}>

      {/* Sliding orange pill */}
      <Animated.View
        style={[
          styles.pill,
          {
            transform: [
              { translateX: pillX },
              { scale: pillScale },
            ],
          },
        ]}
      />

      {/* Tab items */}
      {routes.map((route, index) => {
        const focused  = state.index === index;
        const isHover  = hovered === index;
        const cfg      = tabConfig?.[index] ?? {};
        const label    = descriptors[route.key]?.options?.title ?? route.name;
        const iconName = (focused || isHover) ? cfg.activeIcon : cfg.icon;
        const color    = (focused || isHover) ? COLORS.primary : COLORS.gray;

        return (
          <Animated.View
            key={route.key}
            style={[
              styles.tab,
              {
                transform: [
                  { scale:      iconScale[index] },
                  { translateY: iconLift[index]  },
                ],
              },
            ]}
          >
            <Ionicons name={iconName} size={24} color={color} />
            <Text style={[styles.label, { color }]}>{label}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection:    'row',
    backgroundColor:  COLORS.surface,
    height:           TAB_HEIGHT,
    paddingBottom:    PAD_BOTTOM,
    paddingTop:       6,
    alignItems:       'center',
    // Strong upward shadow
    shadowColor:      COLORS.shadow,
    shadowOffset:     { width: 0, height: -6 },
    shadowOpacity:    0.09,
    shadowRadius:     18,
    elevation:        24,
  },
  pill: {
    position:         'absolute',
    bottom:           PAD_BOTTOM + 10,
    width:            PILL_W,
    height:           PILL_H,
    borderRadius:     PILL_H / 2,
    backgroundColor:  COLORS.primary,
    opacity:          0.13,
  },
  tab: {
    flex:             1,
    alignItems:       'center',
    justifyContent:   'center',
    gap:              3,
    paddingTop:       2,
  },
  label: {
    fontSize:    10,
    fontWeight:  '700',
    letterSpacing: 0.2,
  },
});
