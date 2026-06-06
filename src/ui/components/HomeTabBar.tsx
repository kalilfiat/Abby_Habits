/**
 * UI — Hoy / Progreso segmented control on the home screen.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../theme';

export type HomeTab = 'today' | 'progress';

interface Props {
  value: HomeTab;
  onChange: (tab: HomeTab) => void;
}

const TABS: { id: HomeTab; label: string }[] = [
  { id: 'today', label: 'Hoy' },
  { id: 'progress', label: 'Progreso' },
];

export function HomeTabBar({ value, onChange }: Props) {
  return (
    <View style={styles.segment}>
      {TABS.map((tab) => {
        const active = value === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[styles.segBtn, active && styles.segBtnActive]}
          >
            <Text style={[styles.segBtnText, active && styles.segBtnTextActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    padding: spacing(1),
  },
  segBtn: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing(2.5),
    paddingHorizontal: spacing(1),
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segBtnActive: { backgroundColor: colors.surface, ...shadow },
  segBtnText: {
    fontWeight: '700',
    color: colors.textMuted,
    fontSize: font.body2,
    textAlign: 'center',
  },
  segBtnTextActive: { color: colors.primaryDark },
});
