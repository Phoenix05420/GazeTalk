/**
 * SplashLoader — Cinematic multi-ring orbital loading screen.
 * Features 3 concentric rings, breathing eye icon, and animated status text.
 */
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Animated, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { THEMES, RADII, SHADOWS, SPACING } from '../config';

const theme = THEMES.deep_space;

const STATUS_MESSAGES = [
  'Initializing Eye Tracker...',
  'Loading AI Models...',
  'Calibrating Sensors...',
  'Almost Ready...',
];

export default function SplashLoader() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  const iconScale = useRef(new Animated.Value(1.0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(20)).current;
  const dotScale1 = useRef(new Animated.Value(0)).current;
  const dotScale2 = useRef(new Animated.Value(0)).current;
  const dotScale3 = useRef(new Animated.Value(0)).current;
  const dotScale4 = useRef(new Animated.Value(0)).current;
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    // Pulse animation for subtitle
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Icon breathing scale
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconScale, { toValue: 1.15, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(iconScale, { toValue: 1.0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Ring rotations at different speeds and directions
    Animated.loop(
      Animated.timing(ring1, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.timing(ring2, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.timing(ring3, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    // Title fade in
    Animated.parallel([
      Animated.timing(titleOpacity, { toValue: 1, duration: 800, delay: 300, useNativeDriver: true }),
      Animated.timing(titleSlide, { toValue: 0, duration: 800, delay: 300, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
    ]).start();

    // Orbital dots staggered pulse
    const dotAnims = [dotScale1, dotScale2, dotScale3, dotScale4];
    dotAnims.forEach((dot, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    });

    // Cycle status messages
    const msgInterval = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2000);

    return () => clearInterval(msgInterval);
  }, []);

  const spin1 = ring1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spin2 = ring2.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const spin3 = ring3.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={s.container}>
      {/* Ambient background glow */}
      <View style={s.ambientGlow} />

      {/* Outer ring (largest, slowest) */}
      <Animated.View style={[s.ring3, { opacity: pulse, transform: [{ rotate: spin3 }] }]}>
        {/* Orbital dots */}
        <Animated.View style={[s.orbitalDot, s.dotPos1, { opacity: dotScale1 }]} />
        <Animated.View style={[s.orbitalDot, s.dotPos2, { opacity: dotScale2 }]} />
      </Animated.View>

      {/* Middle ring */}
      <Animated.View style={[s.ring2, { transform: [{ rotate: spin2 }] }]}>
        <Animated.View style={[s.orbitalDot, s.dotPos3, { opacity: dotScale3 }]} />
        <Animated.View style={[s.orbitalDot, s.dotPos4, { opacity: dotScale4 }]} />
      </Animated.View>

      {/* Inner ring (smallest, fastest) */}
      <Animated.View style={[s.ring1, { transform: [{ rotate: spin1 }] }]} />

      {/* Center content */}
      <Animated.Text style={[s.icon, { transform: [{ scale: iconScale }] }]}>👁️</Animated.Text>

      <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleSlide }] }}>
        <Text style={s.title}>GazeTalk</Text>
        <Text style={s.tagline}>AI-Powered Communication</Text>
      </Animated.View>

      <Animated.Text style={[s.status, { opacity: pulse }]}>
        {STATUS_MESSAGES[statusIdx]}
      </Animated.Text>

      {/* Bottom progress dots */}
      <View style={s.dotsRow}>
        {STATUS_MESSAGES.map((_, i) => (
          <View key={i} style={[s.progressDot, i === statusIdx && s.progressDotActive]} />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 242, 254, 0.03)',
  },
  ring1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2.5,
    borderColor: theme.primary,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  ring2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.5)',
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  ring3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 242, 254, 0.2)',
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
  },
  orbitalDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.primary,
  },
  dotPos1: { top: -3, left: '50%', marginLeft: -3 },
  dotPos2: { bottom: -3, right: '25%' },
  dotPos3: { top: '25%', right: -3 },
  dotPos4: { bottom: '25%', left: -3 },
  icon: {
    fontSize: 48,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    color: theme.textPrimary,
    textAlign: 'center',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: theme.textMuted,
    textAlign: 'center',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  status: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: theme.accent,
    marginTop: 40,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
    bottom: 60,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  progressDotActive: {
    backgroundColor: theme.primary,
    ...({
      shadowColor: theme.primary,
      shadowOpacity: 0.8,
      shadowRadius: 6,
    } as any),
  },
});
