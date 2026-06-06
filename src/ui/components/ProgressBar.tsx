/** UI — Progress bar with smooth fill animation. */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { motion } from '../motion/config';
import { colors, radius } from '../theme';

interface Props {
  ratio: number;
  color?: string;
  minMarker?: number;
  height?: number;
}

export function ProgressBar({ ratio, color = colors.primary, minMarker, height = 10 }: Props) {
  const clamped = Math.max(0, Math.min(ratio, 1));
  const widthAnim = useRef(new Animated.Value(clamped)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: clamped,
      duration: motion.normal,
      useNativeDriver: false,
    }).start();
  }, [clamped, widthAnim]);

  const width = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            width,
            backgroundColor: color,
            borderRadius: height / 2,
          },
        ]}
      />
      {minMarker !== undefined && minMarker > 0 && minMarker < 1 && (
        <View style={[styles.marker, { left: `${minMarker * 100}%` as any, height }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    height: '100%',
  },
  marker: {
    position: 'absolute',
    width: 2,
    backgroundColor: '#FFFFFF',
    opacity: 0.7,
  },
});
