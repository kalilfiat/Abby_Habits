/**
 * UI — Fade + slide entrance (mount or when `trigger` changes).
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, View, ViewStyle } from 'react-native';
import { motion, spring } from './config';

interface Props {
  children: React.ReactNode;
  delay?: number;
  /** Re-run entrance when this value changes (e.g. insight copy). */
  trigger?: string | number;
  fromY?: number;
  fromX?: number;
  style?: StyleProp<ViewStyle>;
  /** When false, render without fade (avoids Android black flash on tab swaps). */
  entrance?: boolean;
}

export function FadeSlideIn({
  children,
  delay = 0,
  trigger,
  fromY = 14,
  fromX = 0,
  style,
  entrance = true,
}: Props) {
  const opacity = useRef(new Animated.Value(entrance ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(fromY)).current;
  const translateX = useRef(new Animated.Value(fromX)).current;

  useEffect(() => {
    if (!entrance) return;

    opacity.setValue(0);
    translateY.setValue(fromY);
    translateX.setValue(fromX);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: motion.normal,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        ...spring.soft,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        ...spring.soft,
      }),
    ]).start();
  }, [delay, entrance, fromX, fromY, opacity, translateX, translateY, trigger]);

  if (!entrance) {
    return <View style={style}>{children}</View>;
  }

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }, { translateX }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
