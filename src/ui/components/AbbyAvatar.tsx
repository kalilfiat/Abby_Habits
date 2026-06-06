/**
 * UI — Abby illustrated avatar for a given pose.
 */

import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import { MascotPose } from '../../core/mascot';
import { MASCOT_POSE_IMAGES } from '../mascotAssets';

interface Props {
  pose: MascotPose;
  /** Square size when `fill` is false. */
  size?: number;
  /** Fill the parent container (e.g. header mascot column). */
  fill?: boolean;
  style?: ViewStyle;
}

export function AbbyAvatar({ pose, size = 80, fill = false, style }: Props) {
  const source = MASCOT_POSE_IMAGES[pose];

  return (
    <View style={[fill ? styles.fillWrap : { width: size, height: size }, style]}>
      <Image
        source={source}
        style={fill ? styles.fillImage : { width: size, height: size }}
        resizeMode="contain"
        accessibilityLabel={`Abby, pose ${pose}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fillWrap: {
    flex: 1,
    width: '100%',
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fillImage: {
    width: '100%',
    height: '100%',
  },
});
