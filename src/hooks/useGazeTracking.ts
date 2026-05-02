/**
 * useGazeTracking — Custom hook managing gaze cursor position,
 * key intersection detection, dwell selection, and blink selection.
 */
import { useRef, useState, useCallback } from 'react';
import { Animated } from 'react-native';
import { SCREEN, BLINK_COOLDOWN } from '../config';

export function useGazeTracking(dwellTime: number) {
  const pan = useRef(new Animated.ValueXY({ x: SCREEN.width / 2, y: SCREEN.height / 2 })).current;
  const blinkAnim = useRef(new Animated.Value(0)).current;
  const dwellProgress = useRef(new Animated.Value(0)).current;

  const [hoveredKey, setHoveredKeyState] = useState<string | null>(null);
  const hoveredKeyRef = useRef<string | null>(null);
  const keyLayouts = useRef<{ [key: string]: { x: number; y: number; w: number; h: number } }>({});
  const dwellTimer = useRef<NodeJS.Timeout | null>(null);
  const lastBlinkTime = useRef<number>(0);

  const setHoveredKey = useCallback((key: string | null) => {
    setHoveredKeyState(key);
    hoveredKeyRef.current = key;
  }, []);

  const resetDwell = useCallback(() => {
    if (dwellTimer.current) clearTimeout(dwellTimer.current);
    dwellProgress.setValue(0);
  }, []);

  const startDwell = useCallback((key: string, onSelect: (key: string) => void) => {
    Animated.timing(dwellProgress, {
      toValue: 100,
      duration: dwellTime,
      useNativeDriver: false,
    }).start();

    dwellTimer.current = setTimeout(() => {
      if (hoveredKeyRef.current === key) {
        onSelect(key);
      }
      resetDwell();
    }, dwellTime);
  }, [dwellTime]);

  const registerKeyLayout = useCallback((key: string, layout: { x: number; y: number; w: number; h: number }) => {
    keyLayouts.current[key] = layout;
  }, []);

  const checkIntersection = useCallback((cursorX: number, cursorY: number, onSelect: (key: string) => void) => {
    let foundKey: string | null = null;
    for (const [key, layout] of Object.entries(keyLayouts.current)) {
      if (cursorX >= layout.x && cursorX <= layout.x + layout.w &&
          cursorY >= layout.y && cursorY <= layout.y + layout.h) {
        foundKey = key;
        break;
      }
    }

    if (foundKey !== hoveredKeyRef.current) {
      setHoveredKey(foundKey);
      resetDwell();
      if (foundKey) {
        startDwell(foundKey, onSelect);
      }
    }
  }, []);

  const handleGazeData = useCallback((
    x: number, y: number, blink: boolean,
    onSelect: (key: string) => void
  ) => {
    const absX = x * SCREEN.width;
    const absY = y * SCREEN.height;
    pan.setValue({ x: absX, y: absY });
    checkIntersection(absX, absY, onSelect);

    // Blink selection
    if (blink && hoveredKeyRef.current) {
      const now = Date.now();
      if (now - lastBlinkTime.current > BLINK_COOLDOWN) {
        lastBlinkTime.current = now;
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 1, duration: 100, useNativeDriver: false }),
          Animated.timing(blinkAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
        ]).start();
        onSelect(hoveredKeyRef.current);
        resetDwell();
      }
    }
  }, []);

  return {
    pan,
    blinkAnim,
    dwellProgress,
    hoveredKey,
    registerKeyLayout,
    handleGazeData,
  };
}
