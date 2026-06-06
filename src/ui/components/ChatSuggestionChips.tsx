/**
 * UI — Quick suggestions above the chat input.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme';

export const CHAT_SUGGESTIONS = [
  'Hola',
  'Tomar 2 litros de agua',
  'Leer 10 páginas',
  'Meditar',
] as const;

interface Props {
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function ChatSuggestionChips({ onSelect, disabled }: Props) {
  return (
    <View style={styles.bar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled"
      >
        {CHAT_SUGGESTIONS.map((label) => (
          <Pressable
            key={label}
            style={({ pressed }) => [
              styles.chip,
              disabled && styles.chipDisabled,
              pressed && styles.chipPressed,
            ]}
            onPress={() => onSelect(label)}
            disabled={disabled}
          >
            <Text style={styles.chipText}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  scroll: {
    flexGrow: 0,
    maxHeight: 52,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2),
  },
  chip: {
    flexShrink: 0,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2),
  },
  chipPressed: { opacity: 0.85 },
  chipDisabled: { opacity: 0.5 },
  chipText: {
    fontSize: font.body2,
    fontWeight: '600',
    color: colors.primaryDark,
  },
});
