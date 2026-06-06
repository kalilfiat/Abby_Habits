/**
 * UI — Pressable with a subtle scale-down spring.
 *
 * Pass layout styles (flex, width, padding…) on `style`; they apply to the
 * Pressable. The inner animated view mirrors flex layout so row children stay
 * in one line on native (not only on web).
 */

import React, { useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { spring } from './config';
import { tapLight } from './haptics';

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Scale at full press (default 0.96). */
  pressedScale?: number;
  haptic?: boolean;
  /** Stretch to full width on web (gradient CTAs). */
  fill?: boolean;
}

function innerLayoutStyle(style: StyleProp<ViewStyle>, fill?: boolean): ViewStyle | undefined {
  const flat = StyleSheet.flatten(style);

  if (Platform.OS === 'web') {
    if (fill) {
      return {
        width: '100%',
        alignSelf: 'stretch',
        flexDirection: flat?.flexDirection,
        alignItems: flat?.alignItems ?? 'center',
        justifyContent: flat?.justifyContent ?? 'center',
        gap: flat?.gap,
      };
    }

    if (!flat) return { alignItems: 'center', justifyContent: 'center' };

    return {
      width: flat.width != null ? '100%' : undefined,
      height: flat.height != null ? '100%' : undefined,
      flex: flat.flex,
      flexDirection: flat.flexDirection,
      alignItems: flat.alignItems ?? 'center',
      justifyContent: flat.justifyContent ?? 'center',
      gap: flat.gap,
      alignSelf: 'stretch',
    };
  }

  if (!flat) return fill ? { alignItems: 'center', justifyContent: 'center' } : undefined;

  const hasFlexLayout =
    flat.flexDirection != null ||
    flat.alignItems != null ||
    flat.justifyContent != null ||
    flat.gap != null ||
    flat.flexWrap != null ||
    flat.flex != null;

  if (!hasFlexLayout && !fill) return undefined;

  return {
    flexDirection: flat.flexDirection,
    alignItems: flat.alignItems,
    justifyContent: flat.justifyContent,
    gap: flat.gap,
    flexWrap: flat.flexWrap,
    flex: flat.flex,
  };
}

function webPressableStyle(style: StyleProp<ViewStyle>, fill?: boolean): StyleProp<ViewStyle> {
  if (Platform.OS !== 'web' || !fill) return style;
  return [style, { alignSelf: 'stretch', width: '100%' }];
}

export function ScalePressable({
  children,
  style,
  pressedScale = 0.96,
  haptic = true,
  fill = false,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const innerLayout = innerLayoutStyle(style, fill);

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      ...spring.press,
    }).start();
  };

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={webPressableStyle(style, fill)}
      onPress={(e) => {
        if (haptic && !disabled) tapLight();
        onPress?.(e);
      }}
      onPressIn={(e) => {
        animateTo(pressedScale);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animateTo(1);
        onPressOut?.(e);
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[{ transform: [{ scale }] }, innerLayout]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /** On web, inner view must not stretch in flex parents (e.g. horizontal ScrollView). */
  webInner: { alignSelf: 'flex-start' },
});
