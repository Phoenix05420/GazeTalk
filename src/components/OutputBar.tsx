/**
 * OutputBar — Glassmorphic display with animated sound wave,
 * status indicators, and refined typography.
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
  isFaceDetected: boolean;
  isConnected: boolean;
  theme: ThemeColors;
}

function SoundWave({ theme }: { theme: ThemeColors }) {
  const bars = useRef(Array.from({ length: 5 }, () => new Animated.Value(0.3))).current;

  useEffect(() => {
    bars.forEach((bar, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 120),
          Animated.timing(bar, { toValue: 1, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(bar, { toValue: 0.3, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={s.waveRow}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[s.waveBar, { backgroundColor: theme.accent, transform: [{ scaleY: bar }] }]}
        />
      ))}
    </View>
  );
}

export default function OutputBar({ text, isLoading, isFaceTrackingActive, isFaceDetected, isConnected, theme }: Props) {
  const cursorBlink = useRef(new Animated.Value(1)).current;
  const statusPulse = useRef(new Animated.Value(0.4)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursorBlink, { toValue: 0, duration: 530, useNativeDriver: true }),
        Animated.timing(cursorBlink, { toValue: 1, duration: 530, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(statusPulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(statusPulse, { toValue: 0.4, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowPulse, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      glowPulse.setValue(0);
    }
  }, [isLoading]);

  const getPlaceholder = () => {
    if (!isFaceTrackingActive) return 'Loading Eye Tracker...';
    return 'Look at keys \u00B7 Blink to select';
  };

  return (
    <View style={s.wrapper}>
      {isLoading && (
        <Animated.View
          style={[s.glowBorder, { borderColor: theme.accent, opacity: glowPulse }, SHADOWS.glow(theme.accent, 12, 0.5) as any]}
        />
      )}

      <BlurView intensity={90} tint="dark" style={[s.container, { borderColor: theme.borderGlass }]}>
        <View style={[s.accentLine, { backgroundColor: theme.primary }]} />

        <View style={s.statusRow}>
          <View style={s.statusIndicator}>
            <View style={[s.statusDot, { backgroundColor: isConnected ? theme.success : theme.warning }]} />
            <Animated.View style={[s.statusGlow, { backgroundColor: isConnected ? theme.successGlow : theme.warning, opacity: statusPulse }]} />
          </View>
          <Text style={[s.statusText, { color: theme.textMuted }]}>
            {isConnected ? 'AI Ready' : 'Offline'}
          </Text>
          {isFaceTrackingActive && (
            <View style={[s.trackingBadge, {
              backgroundColor: isFaceDetected ? theme.primaryDim : 'rgba(255,59,48,0.15)',
              borderColor: isFaceDetected ? theme.borderActive : 'rgba(255,59,48,0.4)',
            }]}>
              <View style={[s.trackingDot, { backgroundColor: isFaceDetected ? theme.primary : '#ff3b30' }]} />
              <Text style={[s.trackingText, { color: isFaceDetected ? theme.primary : '#ff3b30' }]}>
                {isFaceDetected ? 'Tracking' : 'No Face'}
              </Text>
            </View>
          )}
        </View>

        {isLoading ? (
          <View style={s.loadingRow}>
            <Ionicons name="sparkles" size={18} color={theme.accent} style={{ marginRight: 8 }} />
            <Text style={[s.loadingText, { color: theme.accent }]}>AI is thinking</Text>
            <SoundWave theme={theme} />
          </View>
        ) : (
          <View style={s.textRow}>
            <Text
              style={[
                s.outputText,
                { color: theme.textPrimary },
                text.length === 0 && s.outputPlaceholder,
                text.length === 0 && { color: theme.textMuted },
                { textShadowColor: theme.primaryDim, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12 },
              ]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
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
  wrapper: { position: 'relative', marginBottom: 8 },
  glowBorder: {
    position: 'absolute', top: -2, left: -2, right: -2, bottom: -2,
    borderRadius: RADII.xl + 2, borderWidth: 2,
  },
  container: {
    padding: 16, paddingTop: 10, borderRadius: RADII.xl,
    minHeight: 100, justifyContent: 'center', overflow: 'hidden', borderWidth: 1,
  },
  accentLine: {
    position: 'absolute', top: 0, left: 30, right: 30, height: 1, opacity: 0.4,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  statusIndicator: { position: 'relative', width: 14, height: 14, justifyContent: 'center', alignItems: 'center', marginRight: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3, zIndex: 2 },
  statusGlow: { position: 'absolute', width: 14, height: 14, borderRadius: 7, zIndex: 1 },
  statusText: { fontSize: 10, fontFamily: 'Inter_400Regular', flex: 1 },
  trackingBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADII.full, borderWidth: 1 },
  trackingDot: { width: 4, height: 4, borderRadius: 2, marginRight: 3 },
  trackingText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.4 },
  textRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 36 },
  outputText: {
    fontSize: 26, fontFamily: 'Inter_700Bold', textAlign: 'center',
  },
  outputPlaceholder: { fontFamily: 'Inter_400Regular', fontSize: 16, opacity: 0.6 },
  cursor: { fontSize: 28, fontFamily: 'Inter_700Bold', marginLeft: 2 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  loadingText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  waveRow: { flexDirection: 'row', gap: 3, marginLeft: 8, alignItems: 'center', height: 18 },
  waveBar: { width: 3, height: 18, borderRadius: 2 },
});
