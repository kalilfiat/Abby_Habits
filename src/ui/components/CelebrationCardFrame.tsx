/**
 * UI — Gradient frame + soft cyan/green glow + tier badge (static, no pulse).
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme';

interface Props {
  label: string;
  children: React.ReactNode;
}

export function CelebrationCardFrame({ label, children }: Props) {
  return (
    <View style={styles.glowWrap}>
      <LinearGradient
        colors={['#27C4D4', '#34C759', '#2BDABE', '#27C4D4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ring}
      >
        <View style={styles.inner}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <MaterialCommunityIcons name="star-four-points" size={13} color={colors.successDark} />
              <Text style={styles.badgeText}>{label}</Text>
            </View>
          </View>
          {children}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  glowWrap: {
    borderRadius: radius.xxl + 3,
    shadowColor: '#27C4D4',
    shadowOpacity: 0.42,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  ring: {
    borderRadius: radius.xxl + 3,
    padding: 2.5,
  },
  inner: {},
  badgeRow: {
    alignItems: 'center',
    marginBottom: spacing(1),
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    backgroundColor: colors.successLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.35)',
  },
  badgeText: {
    fontSize: font.caption,
    fontWeight: '800',
    color: colors.successDark,
  },
});
