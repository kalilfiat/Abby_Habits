/**
 * UI — Floating background bubbles (slow drift, visible against the canvas).
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, ViewStyle } from 'react-native';
interface Props {
  style?: ViewStyle;
}

interface BubbleSpec {
  size: number;
  left: `${number}%`;
  top: `${number}%`;
  color: string;
  borderColor: string;
  opacity: number;
  durationX: number;
  durationY: number;
  driftX: number;
  driftY: number;
  delay?: number;
}

/** Bubbles placed in the visible viewport; colors contrast with `colors.bg`. */
const BUBBLES: BubbleSpec[] = [
  {
    size: 200,
    left: '68%',
    top: '4%',
    color: 'rgba(184, 232, 239, 0.55)',
    borderColor: 'rgba(255, 255, 255, 0.7)',
    opacity: 1,
    durationX: 12000,
    durationY: 15000,
    driftX: 55,
    driftY: 40,
  },
  {
    size: 120,
    left: '4%',
    top: '28%',
    color: 'rgba(160, 220, 230, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.55)',
    opacity: 1,
    durationX: 14000,
    durationY: 11000,
    driftX: 45,
    driftY: 50,
    delay: 800,
  },
  {
    size: 260,
    left: '50%',
    top: '72%',
    color: 'rgba(200, 239, 245, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    opacity: 1,
    durationX: 16000,
    durationY: 13000,
    driftX: 60,
    driftY: 45,
    delay: 2000,
  },
  {
    size: 64,
    left: '18%',
    top: '12%',
    color: 'rgba(39, 196, 212, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    opacity: 1,
    durationX: 9000,
    durationY: 11000,
    driftX: 35,
    driftY: 42,
    delay: 400,
  },
  {
    size: 44,
    left: '82%',
    top: '38%',
    color: 'rgba(39, 196, 212, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.75)',
    opacity: 1,
    durationX: 8000,
    durationY: 10000,
    driftX: 30,
    driftY: 38,
    delay: 1500,
  },
  {
    size: 80,
    left: '8%',
    top: '58%',
    color: 'rgba(180, 235, 220, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
    opacity: 1,
    durationX: 13000,
    durationY: 9500,
    driftX: 48,
    driftY: 35,
    delay: 3000,
  },
  {
    size: 36,
    left: '42%',
    top: '22%',
    color: 'rgba(224, 247, 250, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.85)',
    opacity: 1,
    durationX: 7000,
    durationY: 9000,
    driftX: 28,
    driftY: 32,
    delay: 5000,
  },
  {
    size: 52,
    left: '58%',
    top: '48%',
    color: 'rgba(39, 196, 212, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.7)',
    opacity: 1,
    durationX: 10000,
    durationY: 12000,
    driftX: 40,
    driftY: 44,
    delay: 2500,
  },
  {
    size: 28,
    left: '28%',
    top: '78%',
    color: 'rgba(224, 247, 250, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    opacity: 1,
    durationX: 8500,
    durationY: 10500,
    driftX: 32,
    driftY: 36,
    delay: 6000,
  },
];

const useNativeDriver = Platform.OS !== 'web';
const ease = Easing.inOut(Easing.sin);

function FloatingBubble({
  size,
  left,
  top,
  color,
  borderColor,
  opacity: baseOpacity,
  durationX,
  durationY,
  driftX,
  driftY,
  delay = 0,
}: BubbleSpec) {
  const tX = useRef(new Animated.Value(0)).current;
  const tY = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startDrift = (value: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: duration / 2,
            easing: ease,
            useNativeDriver,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: duration / 2,
            easing: ease,
            useNativeDriver,
          }),
        ]),
      );

    const driftXAnim = startDrift(tX, durationX);
    const driftYAnim = startDrift(tY, durationY);
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 5000,
          easing: ease,
          useNativeDriver,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 5000,
          easing: ease,
          useNativeDriver,
        }),
      ]),
    );

    const timeout = setTimeout(() => {
      driftXAnim.start();
      driftYAnim.start();
      pulseAnim.start();
    }, delay);

    return () => {
      clearTimeout(timeout);
      driftXAnim.stop();
      driftYAnim.stop();
      pulseAnim.stop();
    };
  }, [delay, durationX, durationY, pulse, tX, tY]);

  const translateX = tX.interpolate({
    inputRange: [0, 1],
    outputRange: [-driftX, driftX],
  });
  const translateY = tY.interpolate({
    inputRange: [0, 1],
    outputRange: [-driftY, driftY],
  });
  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [baseOpacity * 0.88, baseOpacity],
  });

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left,
          top,
          backgroundColor: color,
          borderColor,
          opacity,
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    />
  );
}

export function AmbientBackground({ style }: Props) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.layer, style]}>
      {BUBBLES.map((b, i) => (
        <FloatingBubble key={i} {...b} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    zIndex: 0,
  },
  bubble: {
    position: 'absolute',
    borderWidth: 1.5,
  },
});
