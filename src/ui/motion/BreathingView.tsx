/**
 * UI — Gentle breathing scale loop (mascot idle, splash).
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  minScale?: number;
  maxScale?: number;
  duration?: number;
}

export function BreathingView({
  children,
  style,
  minScale = 1,
  maxScale = 1.04,
  duration = 2000,
}: Props) {
  const scale = useRef(new Animated.Value(minScale)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: maxScale,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: minScale,
          duration,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [duration, maxScale, minScale, scale]);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
  );
}
