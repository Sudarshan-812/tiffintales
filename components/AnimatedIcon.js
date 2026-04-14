/**
 * AnimatedIcon
 * A layered, animated icon wrapper built on Ionicons + React Native Animated.
 *
 * Animations:
 *   breathe  — gentle scale 0.94↔1.08 loop (ambient presence)
 *   pulse    — scale 1↔1.16 loop (live/active)
 *   bounce   — translateY 0↔−6 loop (draw attention)
 *   spin     — 360° rotation loop (loading / hourglass)
 *   float    — slow translateY 0↔−5↔0 sine loop
 *   tada     — spring entrance: pop out then settle
 *   none     — static (default)
 */

import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AnimatedIcon({
  name,
  size       = 52,
  iconSize,
  color      = '#FC8019',
  bg,
  radius,
  borderColor,
  animation  = 'none',
  glow       = false,
  onPress,
  delay      = 0,
  style,
}) {
  const scaleAnim  = useRef(new Animated.Value(animation === 'tada' ? 0.4 : 1)).current;
  const yAnim      = useRef(new Animated.Value(0)).current;
  const rotAnim    = useRef(new Animated.Value(0)).current;
  const opacAnim   = useRef(new Animated.Value(animation === 'tada' ? 0 : 1)).current;
  const pressAnim  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const start = () => {
      switch (animation) {
        case 'breathe':
          Animated.loop(Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.08, duration: 1400, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 0.94, duration: 1400, useNativeDriver: true }),
          ])).start();
          break;

        case 'pulse':
          Animated.loop(Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.18, duration: 650, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1,    duration: 650, useNativeDriver: true }),
          ])).start();
          break;

        case 'bounce':
          Animated.loop(Animated.sequence([
            Animated.spring(yAnim, { toValue: -6, friction: 3, tension: 160, useNativeDriver: true }),
            Animated.spring(yAnim, { toValue:  0, friction: 3, tension: 160, useNativeDriver: true }),
          ])).start();
          break;

        case 'float':
          Animated.loop(Animated.sequence([
            Animated.timing(yAnim, { toValue: -5, duration: 1800, useNativeDriver: true }),
            Animated.timing(yAnim, { toValue:  0, duration: 1800, useNativeDriver: true }),
          ])).start();
          break;

        case 'spin':
          Animated.loop(
            Animated.timing(rotAnim, { toValue: 1, duration: 1800, useNativeDriver: true })
          ).start();
          break;

        case 'tada':
          Animated.parallel([
            Animated.sequence([
              Animated.spring(scaleAnim, { toValue: 1.25, friction: 4, tension: 160, useNativeDriver: true }),
              Animated.spring(scaleAnim, { toValue: 1,    friction: 5, tension: 140, useNativeDriver: true }),
            ]),
            Animated.timing(opacAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          ]).start();
          break;

        default:
          break;
      }
    };

    if (delay > 0) {
      const t = setTimeout(start, delay);
      return () => clearTimeout(t);
    } else {
      start();
    }
  }, [animation, delay]);

  const onPressIn  = () => onPress && Animated.spring(pressAnim, { toValue: 0.86, useNativeDriver: true, friction: 5 }).start();
  const onPressOut = () => onPress && Animated.spring(pressAnim, { toValue: 1,    useNativeDriver: true, friction: 5 }).start();

  const rotate = rotAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const iSize   = iconSize ?? Math.round(size * 0.48);
  const bRadius = radius   ?? Math.round(size * 0.34);
  const bgColor = bg       ?? color + '1A';
  const border  = borderColor ?? color + '30';

  const transform = [];
  transform.push({ scale: animation === 'spin' ? pressAnim : Animated.multiply(scaleAnim, pressAnim) });
  if (animation === 'spin')   transform.push({ rotate });
  if (animation === 'bounce' || animation === 'float') transform.push({ translateY: yAnim });

  const glowStyle = glow ? {
    shadowColor: color,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 10,
  } : {};

  const inner = (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: bRadius,
          backgroundColor: bgColor,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor: border,
          transform,
          opacity: opacAnim,
        },
        glowStyle,
        style,
      ]}
    >
      <Ionicons name={name} size={iSize} color={color} />
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}
