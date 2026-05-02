/**
 * GazeKeyboard — Premium on-screen keyboard with 3D glass bead keys,
 * dynamic theme support, and refined control buttons.
 */
import React, { useRef, useCallback, useEffect, memo } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ALPHABET, NUMBERS, PUNCTUATION, BUTTON_SIZE, COLUMNS, RADII, SHADOWS, SPACING, ThemeColors } from '../config';

interface Props {
  hoveredKey: string | null;
  showNumbers: boolean;
  theme: ThemeColors;
  onKeyLayout: (key: string, layout: { x: number; y: number; w: number; h: number }) => void;
}

const getControls = (theme: ThemeColors) => [
  { key: 'SPACE', label: 'SPACE', icon: null, colors: [theme.bgKeyTop, theme.bgKeyBottom] as [string, string] },
  { key: 'DEL', label: null, icon: 'backspace-outline', colors: ['rgba(255,59,48,0.4)', 'rgba(255,59,48,0.15)'] as [string, string] },
  { key: 'CLEAR', label: null, icon: 'trash-outline', colors: ['rgba(255,149,0,0.4)', 'rgba(255,149,0,0.15)'] as [string, string] },
  { key: 'UNDO', label: null, icon: 'arrow-undo-outline', colors: [theme.secondaryDim, 'rgba(0,0,0,0.2)'] as [string, string] },
  { key: 'SPEAK', label: null, icon: 'volume-high-outline', colors: [theme.accentDim, 'rgba(0,0,0,0.2)'] as [string, string] },
  { key: 'SEND', label: null, icon: 'sparkles', colors: [theme.success, 'rgba(0,0,0,0.2)'] as [string, string] },
];

const KeyButton = memo(function KeyButton({ keyId, label, isHovered, theme, onLayout }: {
  keyId: string;
  label: string;
  isHovered: boolean;
  theme: ThemeColors;
  onLayout: (key: string, layout: { x: number; y: number; w: number; h: number }) => void;
}) {
  const ref = useRef<View>(null);
  const sinkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(sinkAnim, {
      toValue: isHovered ? 1 : 0,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();
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
    outputRange: [0, 4], // Sinks down 4px
  });
  
  const scale = sinkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.95],
  });

  return (
    <Animated.View
      ref={ref}
      style={[
        styles.keyOuter,
        { borderColor: isHovered ? theme.primary : theme.borderGlass },
        isHovered && SHADOWS.glow(theme.primary, 14, 0.9) as any,
        !isHovered && SHADOWS.glassBead as any,
        { transform: [{ translateY }, { scale }] },
      ]}
      onLayout={handleLayout}
    >
      <LinearGradient
        colors={isHovered
          ? [theme.primary, theme.accent]
          : [theme.bgKeyTop, theme.bgKeyBottom]
        }
        style={styles.keyGradient}
      >
        {/* Specular Highlight */}
        <View style={styles.specular} />
        
        <Text style={[styles.keyText, { color: isHovered ? theme.textInverse : theme.textPrimary }]}>
          {label}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}, (prev, next) => prev.isHovered === next.isHovered && prev.theme === next.theme);

export default function GazeKeyboard({ hoveredKey, showNumbers, theme, onKeyLayout }: Props) {
  const CONTROLS = getControls(theme);

  return (
    <View style={styles.bottomSection} pointerEvents="box-none">
      <View style={styles.gridContainer}>
        {/* Number row (toggleable) */}
        {showNumbers && (
          <>
            {NUMBERS.map((num) => (
              <KeyButton key={num} keyId={num} label={num} isHovered={hoveredKey === num} theme={theme} onLayout={onKeyLayout} />
            ))}
            <View style={styles.rowDivider} />
          </>
        )}

        {/* Alphabet grid */}
        {ALPHABET.map((letter) => (
          <KeyButton key={letter} keyId={letter} label={letter} isHovered={hoveredKey === letter} theme={theme} onLayout={onKeyLayout} />
        ))}

        {/* Punctuation */}
        {PUNCTUATION.map((p) => (
          <KeyButton key={p} keyId={p} label={p} isHovered={hoveredKey === p} theme={theme} onLayout={onKeyLayout} />
        ))}

        {/* Divider before controls */}
        <View style={styles.rowDivider} />

        {/* Control keys */}
        {CONTROLS.map(({ key, label, icon, colors }) => {
          const isHov = hoveredKey === key;
          const isSend = key === 'SEND';
          return (
            <View
              key={key}
              style={[
                styles.controlOuter,
                { borderColor: isHov ? (isSend ? theme.success : theme.primary) : theme.borderGlass },
                isHov && SHADOWS.glow(isSend ? theme.success : theme.primary, 12, 0.8) as any,
              ]}
              onLayout={(e) => {
                e.target.measure((x, y, w, h, pX, pY) => {
                  onKeyLayout(key, { x: pX, y: pY, w, h });
                });
              }}
            >
              <LinearGradient
                colors={isHov && !isSend
                  ? [theme.primary, theme.accent] as readonly [string, string]
                  : colors as readonly [string, string]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.controlGradient}
              >
                <View style={styles.specular} />
                {icon ? (
                  <View style={styles.controlIconRow}>
                    <Ionicons
                      name={icon as any}
                      size={20}
                      color={isSend ? theme.textInverse : (isHov ? theme.textInverse : theme.textPrimary)}
                    />
                    <Text style={[
                      styles.controlLabel,
                      { color: isSend || isHov ? theme.textInverse : theme.textMuted }
                    ]}>
                      {key === 'DEL' ? 'Delete' : key === 'CLEAR' ? 'Clear' : key === 'SPEAK' ? 'Speak' : key === 'UNDO' ? 'Undo' : 'AI Send'}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.controlText, { color: isHov ? theme.textInverse : theme.textPrimary }]}>{label}</Text>
                )}
              </LinearGradient>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomSection: {
    width: '100%',
    paddingBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  rowDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 4,
  },

  // ── Letter Keys ──
  keyOuter: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE * 1.15,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    borderBottomWidth: 3, // Thicker bottom border for 3D effect
  },
  keyGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADII.md - 2,
    position: 'relative',
    overflow: 'hidden',
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: '10%',
    right: '10%',
    height: '35%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  keyText: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    marginTop: 4,
  },

  // ── Control Keys ──
  controlOuter: {
    height: BUTTON_SIZE * 1.15,
    flexGrow: 1,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    borderBottomWidth: 3,
  },
  controlGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADII.md - 2,
    position: 'relative',
    overflow: 'hidden',
  },
  controlIconRow: {
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  controlLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  controlText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
    marginTop: 4,
  },
});
