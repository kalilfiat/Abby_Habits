/**
 * UI — Insight card.
 *
 * The single, modern blue card that carries the mascot's voice on "Hoy":
 * either a streak-alive nudge (actionable, with a chevron) or a contextual
 * motivational message.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScalePressable } from '../motion';
import { colors, font, line, radius, spacing } from '../theme';

export type InsightData =
  | {
      kind: 'streak';
      icon: string;
      title: string;
      highlight: string;
      tail: string;
      onPress?: () => void;
    }
  | {
      kind: 'message';
      icon: string;
      text: string;
    };

function InsightBody(props: InsightData) {
  return (
    <>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={props.icon as any} size={24} color={colors.primary} />
      </View>

      {props.kind === 'streak' ? (
        <>
          <View style={styles.body}>
            <Text style={styles.title}>{props.title}</Text>
            <Text style={styles.sub}>
              <Text style={styles.highlight}>{props.highlight}</Text>
              {props.tail}
            </Text>
          </View>
          {props.onPress && (
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
          )}
        </>
      ) : (
        <View style={styles.body}>
          <Text style={styles.message}>{props.text}</Text>
        </View>
      )}
    </>
  );
}

export function Insight(props: InsightData) {
  if (props.kind === 'streak' && props.onPress) {
    return (
      <ScalePressable
        onPress={props.onPress}
        style={styles.card}
        pressedScale={0.98}
        android_ripple={{ color: '#B8E8EF' }}
      >
        <InsightBody {...props} />
      </ScalePressable>
    );
  }

  return (
    <View style={styles.card}>
      <InsightBody {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3.5),
    backgroundColor: colors.primaryLight,
    borderRadius: radius.xl,
    padding: spacing(4),
    borderWidth: 1,
    borderColor: '#B8E8EF',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#B8E8EF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: { flex: 1 },
  title: {
    fontSize: font.body,
    lineHeight: line.body,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  sub: {
    fontSize: font.body2,
    lineHeight: line.body2,
    color: colors.textMuted,
  },
  highlight: {
    fontWeight: '700',
    color: colors.primary,
  },
  message: {
    fontSize: font.body,
    lineHeight: line.body,
    fontWeight: '600',
    color: colors.text,
  },
});
