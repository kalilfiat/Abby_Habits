/**
 * UI — Mascot creation chat.
 *
 * The mascot opens the conversation, the user types what they want to improve in
 * natural language, and the conversational layer turns it into a draft. The user
 * is then offered to open the editable ficha to confirm and save.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DraftHabit } from '../../core/habit-engine';
import { ChatMessage } from '../../core/mascot';
import { introLines, respondToMessage } from '../../core/mascot/conversation';
import { MascotPose } from '../../core/mascot/types';
import { createId } from '../../data';
import { useStore } from '../../store/useStore';
import { AbbyAvatar } from '../components/AbbyAvatar';
import { ChatBubble } from '../components/ChatBubble';
import { ChatSuggestionChips } from '../components/ChatSuggestionChips';
import { AmbientBackground, FadeSlideIn, ScalePressable } from '../motion';
import { RootStackParamList } from '../navigation';
import { colors, font, fontFamily, radius, shadow, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

/** Bubble-tone panel — chat/notifications only (not global theme). */
const PANEL_CYAN = '#D2F0F5';

function mascotPoseForIntent(intent: string): MascotPose {
  if (intent === 'goal') return 'nice';
  if (intent === 'greeting') return 'happy';
  return 'hi';
}

export function ChatScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const userName = useStore((s) => s.userName);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [pendingDraft, setPendingDraft] = useState<DraftHabit | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setMessages(
      introLines(userName).map((text) => ({ id: createId('m_'), role: 'mascot', text })),
    );
  }, [userName]);

  const append = useCallback((msgs: ChatMessage[]) => {
    setMessages((prev) => [...prev, ...msgs]);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const submitText = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      append([{ id: createId('m_'), role: 'user', text: trimmed }]);

      const result = respondToMessage(trimmed, userName);
      const pose = mascotPoseForIntent(result.intent);

      append(
        result.replies.map((t) => ({
          id: createId('m_'),
          role: 'mascot' as const,
          text: t,
          pose,
        })),
      );

      if (result.draft) {
        setPendingDraft(result.draft);
      } else {
        setPendingDraft(null);
      }
    },
    [append, userName],
  );

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    submitText(text);
  };

  const onChipSelect = (label: string) => {
    if (label === 'Hola') {
      submitText(label);
      return;
    }
    setInput(label);
  };

  const openManualFicha = () => navigation.navigate('HabitEdit', {});

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 50}
    >
      <AmbientBackground />

      <View style={[styles.chatHeader, { paddingTop: spacing(2) }]}>
        <AbbyAvatar pose="hi" size={44} />
        <View style={styles.chatHeaderText}>
          <Text style={styles.chatHeaderTitle}>¡Armemos un hábito!</Text>
          <Text style={styles.chatHeaderSub}>Escribí en natural — Abby te arma la ficha</Text>
          <ScalePressable
            onPress={openManualFicha}
            style={styles.manualLink}
            pressedScale={0.98}
            haptic={false}
          >
            <MaterialCommunityIcons
              name="clipboard-edit-outline"
              size={16}
              color={colors.primary}
              style={styles.manualLinkIcon}
            />
            <Text style={styles.manualLinkText} numberOfLines={2}>
              Crear la ficha a mano
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={colors.primary}
              style={styles.manualLinkChevron}
            />
          </ScalePressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} text={m.text} pose={m.pose} />
        ))}

        {pendingDraft && (
          <FadeSlideIn trigger={pendingDraft.name} fromY={16}>
            <ScalePressable
              style={styles.draftCta}
              onPress={() => navigation.navigate('HabitEdit', { draft: pendingDraft })}
              pressedScale={0.98}
            >
              <View style={styles.draftCtaIcon}>
                <MaterialCommunityIcons name={pendingDraft.icon as any} size={26} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.draftCtaTitle}>{pendingDraft.name}</Text>
                <Text style={styles.draftCtaSub}>Tocá para revisar la ficha y guardar →</Text>
              </View>
            </ScalePressable>
          </FadeSlideIn>
        )}
      </ScrollView>

      <ChatSuggestionChips onSelect={onChipSelect} />

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + spacing(2) }]}>
        <TextInput
          style={styles.input}
          placeholder="Ej: hola · leer 10 páginas por día"
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={send}
          returnKeyType="send"
          multiline
        />
        <ScalePressable
          onPress={send}
          pressedScale={0.92}
          disabled={!input.trim()}
          style={styles.sendWrap}
        >
          <LinearGradient
            colors={input.trim() ? colors.gradient : ['#C7D2F0', '#C7D2F0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sendBtn}
          >
            <MaterialCommunityIcons name="send" size={20} color="#fff" />
          </LinearGradient>
        </ScalePressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184, 232, 239, 0.65)',
    backgroundColor: PANEL_CYAN,
    zIndex: 1,
  },
  chatHeaderText: { flex: 1 },
  chatHeaderTitle: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: font.body,
    color: colors.heading,
  },
  chatHeaderSub: {
    fontFamily: fontFamily.body,
    fontSize: font.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  manualLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: spacing(1.5),
    marginTop: spacing(2.5),
    paddingVertical: spacing(1),
    maxWidth: '100%',
  },
  manualLinkIcon: {
    flexShrink: 0,
  },
  manualLinkChevron: {
    flexShrink: 0,
    marginLeft: spacing(0.5),
  },
  manualLinkText: {
    flex: 1,
    flexShrink: 1,
    fontFamily: fontFamily.bodySemiBold,
    fontSize: font.caption,
    color: colors.primaryDark,
  },
  scroll: { flex: 1, backgroundColor: 'transparent', zIndex: 1 },
  scrollContent: {
    paddingHorizontal: spacing(5),
    paddingTop: spacing(4),
    paddingBottom: spacing(2),
  },
  draftCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: spacing(4),
    marginTop: spacing(2),
    ...shadow,
  },
  draftCtaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftCtaTitle: { fontSize: font.h2, fontWeight: '700', color: colors.text },
  draftCtaSub: { fontSize: font.caption, color: colors.primaryDark, marginTop: 2 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing(2),
    paddingHorizontal: spacing(4),
    paddingTop: spacing(2),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    fontFamily: fontFamily.body,
    fontSize: font.body,
    color: colors.text,
  },
  sendWrap: {
    flexShrink: 0,
    alignSelf: 'flex-end',
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
