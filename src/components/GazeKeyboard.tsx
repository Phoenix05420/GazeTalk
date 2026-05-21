/**
 * GazeKeyboard — Multilingual on-screen keyboard with dwell progress rings,
 * glassmorphic keys, and refined control buttons optimized for gaze.
 * Dynamically switches between QWERTY, Tamil, Malayalam, and Kannada layouts.
 */
import React, { useRef, useCallback, useEffect, memo } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BUTTON_SIZE, KEY_GAP, RADII, SHADOWS, SPACING, ThemeColors, Shortcuts, KEYBOARD_LAYOUTS, VOWEL_SIGNS, LanguageId, LANGUAGES } from '../config';

interface Props {
  hoveredKey: string | null;
  showNumbers: boolean;
  showShortcuts: boolean;
  shortcuts: Shortcuts;
  dwellProgress: Animated.Value;
  theme: ThemeColors;
  onKeyLayout: (key: string, layout: { x: number; y: number; w: number; h: number }) => void;
  language: LanguageId;
}

const KEY_HEIGHT = BUTTON_SIZE * 1.25;
const CTRL_HEIGHT = KEY_HEIGHT;

function DwellRing({ progress, color }: { progress: Animated.Value; color: string }) {
  const rotate = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0deg', '360deg'],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 5, 100],
    outputRange: [0, 0.9, 0.9],
  });

  return (
    <Animated.View
      style={[
        s.dwellRing,
        { borderColor: color, opacity, transform: [{ rotate }] },
      ]}
      pointerEvents="none"
    />
  );
}

const KeyButton = memo(function KeyButton({
  keyId, label, isHovered, dwellProgress, theme, onLayout, flexSize,
}: {
  keyId: string;
  label: string;
  isHovered: boolean;
  dwellProgress: Animated.Value;
  theme: ThemeColors;
  onLayout: (key: string, layout: { x: number; y: number; w: number; h: number }) => void;
  flexSize?: number;
}) {
  const ref = useRef<View>(null);
  const sinkAnim = useRef(new Animated.Value(0)).current;
  const localScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(sinkAnim, {
        toValue: isHovered ? 1 : 0,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.spring(localScale, {
        toValue: isHovered ? 1.08 : 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isHovered]);

  const handleLayout = useCallback(() => {
    setTimeout(() => {
      ref.current?.measure((x, y, w, h, pageX, pageY) => {
        onLayout(keyId, { x: pageX, y: pageY, w, h });
      });
    }, 100);
  }, [keyId]);

  const translateY = sinkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });

  return (
    <Animated.View
      ref={ref}
      style={[
        s.keyOuter,
        flexSize ? { width: flexSize, height: KEY_HEIGHT } : { width: BUTTON_SIZE, height: KEY_HEIGHT },
        { borderColor: isHovered ? theme.primary : theme.borderGlass },
        isHovered && SHADOWS.glow(theme.primary, 10, 0.6) as any,
        { transform: [{ translateY }, { scale: localScale }] },
      ]}
      onLayout={handleLayout}
    >
      <LinearGradient
        colors={isHovered
          ? [theme.primary, theme.accent]
          : [theme.bgKeyTop, theme.bgKeyBottom]
        }
        style={s.keyGradient}
      >
        <View style={s.specular} />
        {isHovered && <DwellRing progress={dwellProgress} color={theme.textInverse} />}
        <Text style={[s.keyText, { color: isHovered ? theme.textInverse : theme.textPrimary }]}>
          {label}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}, (prev, next) =>
  prev.isHovered === next.isHovered &&
  prev.theme === next.theme &&
  prev.keyId === next.keyId
);

function ControlButton({ keyId, icon, label, colors, isHovered, dwellProgress, theme, onLayout }: {
  keyId: string;
  icon: string | null;
  label: string;
  colors: [string, string];
  isHovered: boolean;
  dwellProgress: Animated.Value;
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
  }, [keyId]);

  const isSend = keyId === 'SEND';
  const activeColors: [string, string] = isHovered && !isSend
    ? [theme.primary, theme.accent]
    : colors;

  return (
    <View
      ref={ref}
      style={[
        s.controlOuter,
        { borderColor: isHovered ? (isSend ? theme.success : theme.primary) : theme.borderGlass },
        isHovered && SHADOWS.glow(isSend ? theme.success : theme.primary, 10, 0.6) as any,
      ]}
      onLayout={handleLayout}
    >
      <LinearGradient
        colors={activeColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={s.controlGradient}
      >
        <View style={s.specular} />
        {isHovered && <DwellRing progress={dwellProgress} color={isSend ? theme.textInverse : theme.textInverse} />}
        {icon ? (
          <View style={s.controlIconRow}>
            <Ionicons
              name={icon as any}
              size={18}
              color={isHovered || isSend ? theme.textInverse : theme.textPrimary}
            />
            <Text style={[s.controlLabel, { color: isHovered || isSend ? theme.textInverse : theme.textMuted }]}>
              {label}
            </Text>
          </View>
        ) : (
          <Text style={[s.controlText, { color: isHovered ? theme.textInverse : theme.textPrimary }]}>
            {label}
          </Text>
        )}
      </LinearGradient>
    </View>
  );
}

function ShortcutButton({ keyId, label, isHovered, theme, onLayout }: {
  keyId: string;
  label: string;
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
  }, [keyId]);

  return (
    <View
      ref={ref}
      style={[
        s.shortcutOuter,
        { borderColor: isHovered ? theme.warning : theme.borderGlass },
        isHovered && SHADOWS.glow(theme.warning, 8, 0.4) as any,
      ]}
      onLayout={handleLayout}
    >
      <LinearGradient
        colors={isHovered
          ? [theme.warning, theme.primary]
          : [theme.bgKeyTop, theme.bgKeyBottom]
        }
        style={s.shortcutGradient}
      >
        <Text style={[s.shortcutText, { color: isHovered ? theme.textInverse : theme.warning }]}>
          {label}
        </Text>
      </LinearGradient>
    </View>
  );
}

export default function GazeKeyboard({ hoveredKey, showNumbers, showShortcuts, shortcuts, dwellProgress, theme, onKeyLayout, language }: Props) {
  const isNonEnglish = language !== 'english';
  const keyboardRows = KEYBOARD_LAYOUTS[language];
  const vowelSigns = VOWEL_SIGNS[language];

  return (
    <View style={s.bottomSection} pointerEvents="box-none">
      {/* Language badge */}
      {isNonEnglish && (
        <View style={[s.langBadgeRow]}>
          <View style={[s.langBadge, { backgroundColor: theme.primaryDim, borderColor: theme.primary }]}>
            <Text style={[s.langBadgeText, { color: theme.primary }]}>{LANGUAGES[language].nativeLabel}</Text>
          </View>
        </View>
      )}

      {/* Number row (toggleable) */}
      {showNumbers && (
        <View style={s.row}>
          {'1234567890'.split('').map((num) => (
            <KeyButton
              key={num} keyId={num} label={num}
              isHovered={hoveredKey === num}
              dwellProgress={dwellProgress}
              theme={theme} onLayout={onKeyLayout}
            />
          ))}
        </View>
      )}

      {/* Character rows (QWERTY or Indian script) */}
      {keyboardRows.map((row, ri) => {
        const indent = row.length <= 7 ? s.rowIndent2 : row.length <= 9 ? s.rowIndent1 : null;
        return (
          <View key={ri} style={[s.row, indent]}>
            {row.map((char) => (
              <KeyButton
                key={char} keyId={char} label={char}
                isHovered={hoveredKey === char}
                dwellProgress={dwellProgress}
                theme={theme} onLayout={onKeyLayout}
              />
            ))}
          </View>
        );
      })}

      {/* Vowel signs (Indian languages) or Punctuation (English) */}
      {/* Split into two rows if >10 items to prevent overflow */}
      {vowelSigns.length > 10 ? (
        <>
          <View style={s.row}>
            {vowelSigns.slice(0, 6).map((p) => (
              <KeyButton
                key={p} keyId={p} label={p}
                isHovered={hoveredKey === p}
                dwellProgress={dwellProgress}
                theme={theme} onLayout={onKeyLayout}
              />
            ))}
          </View>
          <View style={s.row}>
            {vowelSigns.slice(6).map((p) => (
              <KeyButton
                key={p} keyId={p} label={p}
                isHovered={hoveredKey === p}
                dwellProgress={dwellProgress}
                theme={theme} onLayout={onKeyLayout}
              />
            ))}
          </View>
        </>
      ) : (
        <View style={s.row}>
          {vowelSigns.map((p) => (
            <KeyButton
              key={p} keyId={p} label={p}
              isHovered={hoveredKey === p}
              dwellProgress={dwellProgress}
              theme={theme} onLayout={onKeyLayout}
            />
          ))}
        </View>
      )}

      {/* Shortcuts row */}
      {showShortcuts && shortcuts.length > 0 && (
        <View style={s.shortcutRow}>
          {shortcuts.map((sc, i) => (
            <ShortcutButton
              key={sc.id}
              keyId={`SHORTCUT_${i}`}
              label={sc.label}
              isHovered={hoveredKey === `SHORTCUT_${i}`}
              theme={theme}
              onLayout={onKeyLayout}
            />
          ))}
        </View>
      )}

      {/* Controls row */}
      <View style={s.controlRow}>
        <ControlButton
          keyId="SPACE" icon={null} label="SPACE"
          colors={[theme.bgKeyTop, theme.bgKeyBottom]}
          isHovered={hoveredKey === 'SPACE'}
          dwellProgress={dwellProgress}
          theme={theme} onLayout={onKeyLayout}
        />
        <ControlButton
          keyId="DEL" icon="backspace-outline" label="Delete"
          colors={['rgba(255,59,48,0.4)', 'rgba(255,59,48,0.15)']}
          isHovered={hoveredKey === 'DEL'}
          dwellProgress={dwellProgress}
          theme={theme} onLayout={onKeyLayout}
        />
        <ControlButton
          keyId="CLEAR" icon="trash-outline" label="Clear"
          colors={['rgba(255,149,0,0.4)', 'rgba(255,149,0,0.15)']}
          isHovered={hoveredKey === 'CLEAR'}
          dwellProgress={dwellProgress}
          theme={theme} onLayout={onKeyLayout}
        />
        <ControlButton
          keyId="UNDO" icon="arrow-undo-outline" label="Undo"
          colors={[theme.secondaryDim, 'rgba(0,0,0,0.2)']}
          isHovered={hoveredKey === 'UNDO'}
          dwellProgress={dwellProgress}
          theme={theme} onLayout={onKeyLayout}
        />
        <ControlButton
          keyId="SPEAK" icon="volume-high-outline" label="Speak"
          colors={[theme.accentDim, 'rgba(0,0,0,0.2)']}
          isHovered={hoveredKey === 'SPEAK'}
          dwellProgress={dwellProgress}
          theme={theme} onLayout={onKeyLayout}
        />
        <ControlButton
          keyId="SEND" icon="sparkles" label="AI Send"
          colors={[theme.success, 'rgba(0,0,0,0.2)']}
          isHovered={hoveredKey === 'SEND'}
          dwellProgress={dwellProgress}
          theme={theme} onLayout={onKeyLayout}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bottomSection: {
    width: '100%',
    paddingBottom: 12,
    gap: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: KEY_GAP,
  },
  rowIndent1: {
    paddingHorizontal: BUTTON_SIZE * 0.5,
  },
  rowIndent2: {
    paddingHorizontal: BUTTON_SIZE * 1.25,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: KEY_GAP,
    marginTop: 2,
  },

  keyOuter: {
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderBottomWidth: 2.5,
  },
  keyGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADII.sm - 1,
    position: 'relative',
    overflow: 'hidden',
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: '10%',
    right: '10%',
    height: '35%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  dwellRing: {
    position: 'absolute',
    width: BUTTON_SIZE - 10,
    height: BUTTON_SIZE - 10,
    borderRadius: (BUTTON_SIZE - 10) / 2,
    borderWidth: 2.5,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  keyText: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    marginTop: 2,
  },

  controlOuter: {
    height: CTRL_HEIGHT,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderBottomWidth: 2.5,
    flex: 1,
  },
  controlGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADII.sm - 1,
    position: 'relative',
    overflow: 'hidden',
  },
  controlIconRow: {
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  controlLabel: {
    fontSize: 8,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  controlText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
    marginTop: 2,
  },

  shortcutRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: KEY_GAP,
    marginBottom: 4,
  },
  shortcutOuter: {
    borderRadius: RADII.xs,
    borderWidth: 1,
    borderBottomWidth: 2,
    minWidth: BUTTON_SIZE * 1.1,
    height: KEY_HEIGHT * 0.75,
  },
  shortcutGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADII.xs - 1,
    paddingHorizontal: 8,
  },
  shortcutText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
  },

  langBadgeRow: {
    alignItems: 'center',
    marginBottom: 4,
  },
  langBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: RADII.full,
    borderWidth: 1,
  },
  langBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
