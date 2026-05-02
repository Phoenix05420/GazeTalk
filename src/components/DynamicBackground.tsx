/**
 * DynamicBackground — Animated gradient background that slowly breathes and shifts.
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
  const breathAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scale = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg }]}>
      <Animated.View
        style={{
          position: 'absolute',
          top: -height * 0.5,
          left: -width * 0.5,
          width: width * 2,
          height: height * 2,
          transform: [{ rotate: spin }, { scale }],
          opacity: 0.5,
        }}
      >
        <LinearGradient
          colors={[theme.bg, theme.primaryDim, theme.bg, theme.secondaryDim, theme.bg]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Overlay to soften the gradient */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
    </View>
  );
}
