/**
 * DynamicBackground — Slow-breathing gradient background with subtle orbital motion.
 */
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeColors } from '../config';

interface Props {
  theme: ThemeColors;
}

const { width, height } = Dimensions.get('window');

export default function DynamicBackground({ theme }: Props) {
  const breath = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 10000, useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 10000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(orbit, { toValue: 1, duration: 30000, useNativeDriver: true })
    ).start();
  }, []);

  const spin = orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[s.gradientOrb, { transform: [{ rotate: spin }, { scale }] }]}
      >
        <LinearGradient
          colors={[theme.bg, `${theme.primary}15`, theme.bg, `${theme.secondary}10`, theme.bg]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View style={s.overlay} />
    </View>
  );
}

const s = StyleSheet.create({
  gradientOrb: {
    position: 'absolute',
    top: -height * 0.5,
    left: -width * 0.5,
    width: width * 2,
    height: height * 2,
    opacity: 0.4,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
});
