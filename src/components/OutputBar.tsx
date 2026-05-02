/**
 * OutputBar — Premium glassmorphic display panel with theme support.
 * Shows typed text with blinking cursor, AI processing sound wave visualizer,
 * connection status with animated indicator, and neon typography.
 */
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { RADII, SHADOWS, SPACING, ThemeColors } from '../config';

interface Props {
  text: string;
  isLoading: boolean;
  isFaceTrackingActive: boolean;
  isConnected: boolean;
  theme: ThemeColors;
}

// ─── Sound Wave Visualizer ───────────────────────────────────
function SoundWave({ theme }: { theme: ThemeColors }) {
  const bars = [1, 2, 3, 4, 5].map(() => useRef(new Animated.Value(0.3)).current);

  useEffect(() => {
    bars.forEach((bar, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(bar, { toValue: 1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(bar, { toValue: 0.3, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={s.waveContainer}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            s.waveBar,
            { backgroundColor: theme.accent, transform: [{ scaleY: bar }] },
          ]}
        />
      ))}
    </View>
  );
}

// ─── OutputBar Main ──────────────────────────────────────────
export default function OutputBar({ text, isLoading, isFaceTrackingActive, isConnected, theme }: Props) {
  const cursorBlink = useRef(new Animated.Value(1)).current;
  const statusPulse = useRef(new Animated.Value(0.4)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Blinking cursor
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursorBlink, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(cursorBlink, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();

    // Status dot pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(statusPulse, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(statusPulse, { toValue: 0.4, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowPulse, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      glowPulse.setValue(0);
    }
  }, [isLoading]);

  const getPlaceholder = () => {
    if (!isFaceTrackingActive) return '⏳  Loading Eye Tracker...';
    return '👁️  Look at keys · Blink to select';
  };

  return (
    <View style={s.wrapper}>
      {isLoading && (
        <Animated.View
          style={[
            s.glowBorder,
            { borderColor: theme.accent, opacity: glowPulse },
            SHADOWS.glow(theme.accent, 16, 0.6) as any,
          ]}
        />
      )}

      <BlurView intensity={100} tint="dark" style={[s.container, { borderColor: theme.borderGlass }]}>
        <View style={[s.accentLine, { backgroundColor: theme.primary }]} />

        <View style={s.statusRow}>
          <View style={s.statusIndicator}>
            <View style={[s.statusDot, { backgroundColor: isConnected ? theme.success : theme.warning }]} />
            {isConnected && (
              <Animated.View style={[s.statusGlow, { backgroundColor: theme.successGlow, opacity: statusPulse }]} />
            )}
          </View>
          <Text style={[s.statusText, { color: theme.textMuted }]}>
            {isConnected ? 'AI Connected' : 'Offline Mode'}
          </Text>
          {isFaceTrackingActive && (
            <View style={[s.trackingBadge, { backgroundColor: theme.primaryDim, borderColor: theme.borderActive }]}>
              <View style={[s.trackingDot, { backgroundColor: theme.primary }]} />
              <Text style={[s.trackingText, { color: theme.primary }]}>Tracking</Text>
            </View>
          )}
        </View>

        {isLoading ? (
          <View style={s.loadingRow}>
            <Ionicons name="sparkles" size={20} color={theme.accent} style={{ marginRight: 8 }} />
            <Text style={[s.loadingText, { color: theme.accent }]}>AI is thinking</Text>
            <SoundWave theme={theme} />
          </View>
        ) : (
          <View style={s.textRow}>
            <Text
              style={[
                s.outputText,
                { color: theme.textPrimary, textShadowColor: theme.primaryDim },
                text.length === 0 && [s.outputPlaceholder, { color: theme.textMuted, textShadowColor: 'transparent' }],
              ]}
            >
              {text || getPlaceholder()}
            </Text>
            {text.length > 0 && (
              <Animated.Text style={[s.cursor, { color: theme.primary, opacity: cursorBlink }]}>|</Animated.Text>
            )}
          </View>
        )}
      </BlurView>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { position: 'relative' },
  glowBorder: {
    position: 'absolute', top: -2, left: -2, right: -2, bottom: -2,
    borderRadius: RADII.xl + 2, borderWidth: 2,
  },
  container: {
    padding: SPACING.xl, paddingTop: SPACING.md, borderRadius: RADII.xl,
    minHeight: 120, justifyContent: 'center', overflow: 'hidden', borderWidth: 1,
  },
  accentLine: {
    position: 'absolute', top: 0, left: 30, right: 30, height: 1, opacity: 0.5,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statusIndicator: { position: 'relative', width: 16, height: 16, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, zIndex: 2 },
  statusGlow: { position: 'absolute', width: 16, height: 16, borderRadius: 8, zIndex: 1 },
  statusText: { fontSize: 11, fontFamily: 'Inter_400Regular', flex: 1 },
  trackingBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADII.full, borderWidth: 1 },
  trackingDot: { width: 5, height: 5, borderRadius: 3, marginRight: 4 },
  trackingText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  textRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  outputText: {
    fontSize: 28, fontFamily: 'Inter_700Bold', textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15,
  },
  outputPlaceholder: { fontFamily: 'Inter_400Regular', fontSize: 18 },
  cursor: { fontSize: 30, fontFamily: 'Inter_700Bold', marginLeft: 2 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  loadingText: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  waveContainer: { flexDirection: 'row', gap: 3, marginLeft: 10, alignItems: 'center', height: 20 },
  waveBar: { width: 4, height: 20, borderRadius: 2 },
});
