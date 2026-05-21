/**
 * GazeCursor — Subtle, refined gaze indicator with micro-animations.
 */
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Easing } from 'react-native';
import { SHADOWS, ThemeColors } from '../config';

interface Props {
  pan: Animated.ValueXY;
  blinkAnim: Animated.Value;
  dwellProgress: Animated.Value;
  hoveredKey: string | null;
  theme: ThemeColors;
}

export default function GazeCursor({ pan, blinkAnim, dwellProgress, hoveredKey, theme }: Props) {
  const hoverPulse = useRef(new Animated.Value(0)).current;
  const idleBreath = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(idleBreath, { toValue: 1.15, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(idleBreath, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (hoveredKey) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(hoverPulse, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(hoverPulse, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      hoverPulse.setValue(0);
    }
  }, [hoveredKey]);

  const breathScale = hoveredKey ? 1 : idleBreath;

  return (
    <Animated.View
      style={[
        s.container,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: breathScale },
          ],
        },
      ]}
      pointerEvents="none"
    >
      {/* Outer glow ring */}
      <Animated.View
        style={[
          s.outerRing,
          {
            borderColor: theme.primaryDim,
            opacity: hoverPulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] }),
          },
        ]}
      />

      {/* Center dot */}
      <Animated.View
        style={[
          s.centerDot,
          {
            backgroundColor: blinkAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [theme.primary, theme.success, theme.primary],
            }),
            transform: [{ scale: blinkAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.6, 1] }) }],
          },
          SHADOWS.glow(theme.primary, 6, 0.8) as any,
        ]}
      />

      {/* Blink flash */}
      <Animated.View
        style={[
          s.blinkFlash,
          {
            backgroundColor: theme.successGlow,
            opacity: blinkAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.6, 0] }),
            transform: [{ scale: blinkAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.5] }) }],
          },
        ]}
      />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    marginLeft: -22,
    marginTop: -22,
  },
  outerRing: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  blinkFlash: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
});
