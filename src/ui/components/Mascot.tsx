/**
 * UI — Mascot avatar + speech bubble.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MascotMood, MascotPose, colorFor } from '../../core/mascot';
import { colors, font, radius, shadow, spacing } from '../theme';
import { AbbyAvatar } from './AbbyAvatar';

interface Props {
  mood: MascotMood;
  message: string;
  /** Illustrated pose; defaults to hi when omitted. */
  pose?: MascotPose;
  compact?: boolean;
}

export function Mascot({ mood, message, pose = 'hi', compact }: Props) {
  const accent = colorFor(mood);
  const size = compact ? 48 : 72;

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <AbbyAvatar pose={pose} size={size} />

      <View style={[styles.bubble, { borderColor: accent + '44' }]}>
        <Text style={styles.bubbleText}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
  rowCompact: { gap: spacing(2) },
  bubble: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderTopLeftRadius: radius.sm,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(4),
    borderWidth: 1,
    ...shadow,
  },
  bubbleText: {
    color: colors.text,
    fontSize: font.body,
    lineHeight: 22,
  },
});
