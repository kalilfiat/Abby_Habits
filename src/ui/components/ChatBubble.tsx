/** UI — A single chat message bubble (mascot left, user right). */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChatRole } from '../../core/mascot';
import { MascotPose } from '../../core/mascot/types';
import { FadeSlideIn } from '../motion';
import { colors, font, fontFamily, radius, spacing } from '../theme';
import { AbbyAvatar } from './AbbyAvatar';

interface Props {
  role: ChatRole;
  text: string;
  /** Mascot pose for Abby’s avatar (mascot messages only). */
  pose?: MascotPose;
}

export function ChatBubble({ role, text, pose = 'hi' }: Props) {
  const isMascot = role === 'mascot';
  return (
    <FadeSlideIn
      fromY={10}
      fromX={isMascot ? -12 : 12}
      style={[styles.row, isMascot ? styles.rowLeft : styles.rowRight]}
    >
      {isMascot && <AbbyAvatar pose={pose} size={36} />}
      <View style={[styles.bubble, isMascot ? styles.mascotBubble : styles.userBubble]}>
        <Text style={[styles.text, isMascot ? styles.mascotText : styles.userText]}>{text}</Text>
      </View>
    </FadeSlideIn>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing(2),
    marginBottom: spacing(3),
    maxWidth: '92%',
  },
  rowLeft: { alignSelf: 'flex-start' },
  rowRight: { alignSelf: 'flex-end' },
  bubble: {
    borderRadius: radius.lg,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(4),
    flexShrink: 1,
  },
  mascotBubble: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderTopRightRadius: radius.sm,
  },
  text: {
    fontFamily: fontFamily.body,
    fontSize: font.body,
    lineHeight: 22,
  },
  mascotText: { color: colors.text },
  userText: { color: '#fff' },
});
