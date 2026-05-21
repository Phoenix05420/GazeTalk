/**
 * SuggestionBar — Animated AI word suggestions with staggered entrance,
 * confidence hierarchy, and dwell progress rings.
 */
import React, { useRef, useCallback, useEffect, memo } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RADII, SHADOWS, SPACING, ThemeColors } from '../config';

interface Props {
  suggestions: string[];
  hoveredKey: string | null;
  dwellProgress: Animated.Value;
  theme: ThemeColors;
  onKeyLayout: (key: string, layout: { x: number; y: number; w: number; h: number }) => void;
}

const BADGES = ['①', '②', '③', '④', '⑤'];

function DwellArc({ progress, color }: { progress: Animated.Value; color: string }) {
  const rotate = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0deg', '360deg'],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 5, 100],
    outputRange: [0, 0.8, 0.8],
  });

  return (
    <Animated.View
      style={[s.dwellArc, { borderColor: color, opacity, transform: [{ rotate }] }]}
      pointerEvents="none"
    />
  );
}

const SuggestionPill = memo(function SuggestionPill({
  keyId, word, badge, isHovered, dwellProgress, theme, onLayout, index,
}: {
  keyId: string;
  word: string;
  badge: string;
  isHovered: boolean;
  dwellProgress: Animated.Value;
  theme: ThemeColors;
  onLayout: (key: string, layout: { x: number; y: number; w: number; h: number }) => void;
  index: number;
}) {
  const ref = useRef<View>(null);
  const slideAnim = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 80,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLayout = useCallback(() => {
    setTimeout(() => {
      ref.current?.measure((x, y, w, h, pX, pY) => {
        onLayout(keyId, { x: pX, y: pY, w, h });
      });
    }, 100);
  }, [keyId]);

  return (
    <Animated.View
      ref={ref}
      style={[
        s.pillOuter,
        { borderColor: isHovered ? theme.accent : theme.borderGlass, opacity: opacityAnim },
        isHovered && SHADOWS.glow(theme.accent, 10, 0.5) as any,
        { transform: [{ translateY: slideAnim }] },
      ]}
      onLayout={handleLayout}
    >
      <LinearGradient
        colors={isHovered
          ? [theme.accentDim, theme.accent]
          : [theme.bgKeyTop, theme.bgKeyBottom]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={s.pillGradient}
      >
        <View style={s.specular} />
        {isHovered && <DwellArc progress={dwellProgress} color={theme.textInverse} />}
        <View style={s.contentRow}>
          <Text style={[s.badge, { color: isHovered ? theme.textInverse : theme.textMuted }]}>
            {badge}
          </Text>
          <Text style={[s.word, { color: isHovered ? theme.textInverse : theme.textPrimary }]}>
            {word.toUpperCase()}
          </Text>
        </View>
        <View style={[s.hoverLine, { backgroundColor: isHovered ? theme.textInverse : 'transparent' }]} />
      </LinearGradient>
    </Animated.View>
  );
}, (prev, next) =>
  prev.isHovered === next.isHovered &&
  prev.theme === next.theme &&
  prev.keyId === next.keyId &&
  prev.index === next.index
);

export default function SuggestionBar({ suggestions, hoveredKey, dwellProgress, theme, onKeyLayout }: Props) {
  if (suggestions.length === 0) return null;

  return (
    <View style={s.container} pointerEvents="box-none">
      {suggestions.slice(0, 5).map((word, index) => {
        const keyId = `SUG_${index}`;
        return (
          <SuggestionPill
            key={keyId}
            keyId={keyId}
            word={word}
            badge={BADGES[index] || ''}
            isHovered={hoveredKey === keyId}
            dwellProgress={dwellProgress}
            theme={theme}
            onLayout={onKeyLayout}
            index={index}
          />
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
    height: 38,
    paddingHorizontal: SPACING.sm,
  },
  pillOuter: {
    flex: 1,
    maxWidth: 120,
    minWidth: 64,
    borderRadius: RADII.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pillGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: 6,
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: '10%',
    right: '10%',
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  dwellArc: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  badge: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    width: 14,
    textAlign: 'center',
  },
  word: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  hoverLine: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: 2,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
});
