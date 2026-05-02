/**
 * GazeCursor — Premium multi-layer gaze tracking indicator with liquid theme support.
 * Center orb with color transitions, rotating dashed outer ring,
 * pulsing hover ring, dwell progress arc, and blink flash effect.
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
  const outerRotation = useRef(new Animated.Value(0)).current;
  const hoverPulse = useRef(new Animated.Value(0.3)).current;
  const idleBreathing = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(outerRotation, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(idleBreathing, {
          toValue: 1.2,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(idleBreathing, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (hoveredKey) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(hoverPulse, {
            toValue: 0.8,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(hoverPulse, {
            toValue: 0.3,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      hoverPulse.setValue(0.3);
    }
  }, [hoveredKey]);

  const spin = outerRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.cursorContainer,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: hoveredKey ? 1 : idleBreathing as any },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <Animated.View style={[styles.outerRing, { borderColor: theme.borderGlass, transform: [{ rotate: spin }] }]} />

      {hoveredKey && (
        <Animated.View
          style={[styles.hoverRing, { borderColor: theme.primary, opacity: hoverPulse }, SHADOWS.glow(theme.primary, 8, 0.4) as any]}
        />
      )}

      {hoveredKey && (
        <Animated.View
          style={[
            styles.dwellRing,
            {
              borderColor: dwellProgress.interpolate({
                inputRange: [0, 50, 100],
                outputRange: [theme.primary, theme.accent, theme.success],
              }),
              transform: [{ scale: dwellProgress.interpolate({ inputRange: [0, 100], outputRange: [0.8, 2.2] }) }],
              opacity: dwellProgress.interpolate({ inputRange: [0, 80, 100], outputRange: [0.9, 0.6, 0] }),
            },
          ]}
        />
      )}

      <Animated.View
        style={[
          styles.centerGlow,
          {
            backgroundColor: blinkAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [theme.primaryDim, theme.successGlow],
            }),
            opacity: blinkAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] }),
          },
        ]}
      />

      <Animated.View
        style={[
          styles.centerDot,
          {
            backgroundColor: blinkAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [theme.primary, theme.success],
            }),
            transform: [{ scale: blinkAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }],
          },
          SHADOWS.glow(theme.primary, 10, 1.0) as any,
        ]}
      />

      <Animated.View
        style={[
          styles.blinkFlash,
          {
            backgroundColor: theme.successGlow,
            opacity: blinkAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.8, 0] }),
            transform: [{ scale: blinkAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 3] }) }],
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cursorContainer: { position: 'absolute', width: 70, height: 70, justifyContent: 'center', alignItems: 'center', zIndex: 1000, marginLeft: -35, marginTop: -35 },
  outerRing: { position: 'absolute', width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderTopColor: 'transparent', borderLeftColor: 'transparent', borderStyle: 'solid' },
  hoverRing: { position: 'absolute', width: 36, height: 36, borderRadius: 18, borderWidth: 2 },
  dwellRing: { position: 'absolute', width: 28, height: 28, borderRadius: 14, borderWidth: 3 },
  centerGlow: { position: 'absolute', width: 28, height: 28, borderRadius: 14 },
  centerDot: { width: 12, height: 12, borderRadius: 6 },
  blinkFlash: { position: 'absolute', width: 20, height: 20, borderRadius: 10 },
});
