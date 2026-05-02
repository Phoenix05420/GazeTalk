/**
 * SuggestionBar — Displays AI-predicted next words.
 * Glassmorphic pills with glowing hover states and numbered badges.
 */
import React, { useRef, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RADII, SHADOWS, SPACING, ThemeColors } from '../config';

interface Props {
  suggestions: string[];
  hoveredKey: string | null;
  theme: ThemeColors;
  onKeyLayout: (key: string, layout: { x: number; y: number; w: number; h: number }) => void;
}

const NUMBERS_UNICODE = ['①', '②', '③', '④', '⑤'];

export default function SuggestionBar({ suggestions, hoveredKey, theme, onKeyLayout }: Props) {
  if (suggestions.length === 0) return null;

  return (
    <View style={s.container} pointerEvents="box-none">
      {suggestions.slice(0, 5).map((word, index) => {
        const keyId = `SUG_${index}`;
        const isHov = hoveredKey === keyId;

        return (
          <SuggestionPill
            key={keyId}
            keyId={keyId}
            word={word}
            badge={NUMBERS_UNICODE[index] || ''}
            isHovered={isHov}
            theme={theme}
            onLayout={onKeyLayout}
          />
        );
      })}
    </View>
  );
}

function SuggestionPill({ keyId, word, badge, isHovered, theme, onLayout }: {
  keyId: string;
  word: string;
  badge: string;
  isHovered: boolean;
  theme: ThemeColors;
  onLayout: (key: string, layout: { x: number; y: number; w: number; h: number }) => void;
}) {
  const ref = useRef<View>(null);

  const handleLayout = useCallback(() => {
    setTimeout(() => {
      ref.current?.measure((x, y, w, h, pX, pY) => {
        onLayout(keyId, { x: pX, y: pY, w, h });
      });
    }, 100);
  }, [keyId, onLayout]);

  return (
    <View
      ref={ref}
      style={[
        s.pillOuter,
        { borderColor: isHovered ? theme.accent : theme.borderGlass },
        isHovered && SHADOWS.glow(theme.accent, 12, 0.6) as any,
      ]}
      onLayout={handleLayout}
    >
      <LinearGradient
        colors={isHovered ? [theme.accentDim, theme.accent] : [theme.bgKeyTop, theme.bgKeyBottom]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={s.pillGradient}
      >
        <View style={s.contentRow}>
          <Text style={[s.badgeText, { color: isHovered ? theme.textInverse : theme.textMuted }]}>{badge}</Text>
          <Text style={[s.wordText, { color: isHovered ? theme.textInverse : theme.textPrimary }]}>
            {word.toUpperCase()}
          </Text>
        </View>
        <View style={[s.hoverLine, { backgroundColor: isHovered ? theme.textInverse : 'transparent' }]} />
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    height: 48,
  },
  pillOuter: {
    flex: 1,
    maxWidth: 160,
    borderRadius: RADII.full,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pillGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  wordText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  hoverLine: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});
