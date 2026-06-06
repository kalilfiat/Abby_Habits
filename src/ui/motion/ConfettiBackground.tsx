/**
 * UI — Background confetti when every active habit hit its minimum today.
 * Sits above AmbientBackground, below scroll content (pointerEvents: none).
 */

import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StyleSheet,
} from 'react-native';

interface Props {
  active: boolean;
}

const CONFETTI_COLORS = [
  '#27C4D4',
  '#34C759',
  '#FF6B35',
  '#E879A6',
  '#E08B2A',
  '#7C5CE4',
  '#FFFFFF',
  '#18B8C4',
];

const PARTICLE_COUNT = 42;
const useNativeDriver = Platform.OS !== 'web';

interface ParticleSpec {
  id: number;
  leftPct: number;
  width: number;
  height: number;
  color: string;
  circle: boolean;
  duration: number;
  delay: number;
  driftX: number;
  swayMs: number;
}

function buildParticles(): ParticleSpec[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    leftPct: ((i * 23.7 + 11) % 97) + 1,
    width: 5 + (i % 6) * 2,
    height: 4 + (i % 5) * 2,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    circle: i % 4 === 0,
    duration: 4200 + (i % 9) * 650,
    delay: (i % 14) * 180,
    driftX: 18 + (i % 7) * 8,
    swayMs: 1800 + (i % 6) * 350,
  }));
}

const PARTICLES = buildParticles();
const { height: SCREEN_H } = Dimensions.get('window');

function ConfettiPiece(spec: ParticleSpec) {
  const fall = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ease = Easing.linear;
    const fallLoop = Animated.loop(
      Animated.timing(fall, {
        toValue: 1,
        duration: spec.duration,
        delay: spec.delay,
        easing: ease,
        useNativeDriver,
      }),
    );
    const swayLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: spec.swayMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver,
        }),
        Animated.timing(sway, {
          toValue: 0,
          duration: spec.swayMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver,
        }),
      ]),
    );
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2400 + (spec.id % 5) * 400,
        easing: Easing.linear,
        useNativeDriver,
      }),
    );

    fallLoop.start();
    swayLoop.start();
    spinLoop.start();
    return () => {
      fallLoop.stop();
      swayLoop.stop();
      spinLoop.stop();
    };
  }, [fall, spec.delay, spec.duration, spec.id, spec.swayMs, spin, sway]);

  const startY = -30 - (spec.id % 6) * 18;
  const translateY = fall.interpolate({
    inputRange: [0, 1],
    outputRange: [startY, SCREEN_H + 40],
  });
  const translateX = sway.interpolate({
    inputRange: [0, 1],
    outputRange: [-spec.driftX, spec.driftX],
  });
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${spec.id % 2 === 0 ? 360 : -360}deg`],
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: `${spec.leftPct}%`,
          width: spec.width,
          height: spec.height,
          borderRadius: spec.circle ? Math.max(spec.width, spec.height) / 2 : 2,
          backgroundColor: spec.color,
          opacity: 0.82,
          transform: [{ translateY }, { translateX }, { rotate }],
        },
      ]}
    />
  );
}

export function ConfettiBackground({ active }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: active ? 1 : 0,
      duration: active ? 600 : 400,
      useNativeDriver,
    }).start();
  }, [active, opacity]);

  const particles = useMemo(() => PARTICLES, []);

  if (!active) return null;

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.layer, { opacity }]}>
      {particles.map((p) => (
        <ConfettiPiece key={p.id} {...p} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    zIndex: 1,
    overflow: 'hidden',
  },
  piece: {
    position: 'absolute',
    top: 0,
  },
});
