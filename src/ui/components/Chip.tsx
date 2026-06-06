/** UI — Summary chip: a small tinted icon square + label, on a white surface. */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, line, radius, shadow, spacing } from '../theme';

interface Props {
  icon: string;
  label: string;
  iconColor?: string;
  iconBg?: string;
}

export function Chip({ icon, label, iconColor = colors.primary, iconBg = colors.primaryLight }: Props) {
  return (
    <View style={styles.chip}>
      <View style={[styles.iconSquare, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon as any} size={13} color={iconColor} />
      </View>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(2),
    borderWidth: 1,
    borderColor: colors.borderLight,
    flexShrink: 1,
    minWidth: 0,
    ...shadow,
  },
  iconSquare: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  label: {
    fontSize: font.caption,
    lineHeight: line.caption,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
});
