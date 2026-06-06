/**
 * UI — Onboarding.
 *
 * First-run screen: introduces Abby and asks the user's name.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MASCOT } from '../../core/mascot';
import { useStore } from '../../store/useStore';
import { AbbyAvatar } from '../components/AbbyAvatar';
import { AmbientBackground, BreathingView, FadeSlideIn, ScalePressable, motion } from '../motion';
import { colors, font, line, radius, shadow, shadowStrong, spacing } from '../theme';

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const setUserName = useStore((s) => s.setUserName);
  const [name, setName] = useState('');

  const canContinue = name.trim().length > 0;
  const submit = () => {
    if (!canContinue) return;
    setUserName(name.trim());
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AmbientBackground />
      <View
        style={[styles.content, { paddingTop: insets.top + spacing(10), paddingBottom: insets.bottom + spacing(6) }]}
      >
        <View style={styles.top}>
          <FadeSlideIn delay={0} fromY={20}>
            <BreathingView>
              <AbbyAvatar pose="hi" size={200} />
            </BreathingView>
          </FadeSlideIn>

          <FadeSlideIn delay={motion.stagger * 2}>
            <Text style={styles.title}>Hola, soy {MASCOT.name}</Text>
          </FadeSlideIn>

          <FadeSlideIn delay={motion.stagger * 3}>
            <Text style={styles.subtitle}>
              Voy a acompañarte a construir tus hábitos, paso a paso. Para empezar,
              ¿cómo te llamás?
            </Text>
          </FadeSlideIn>

          <FadeSlideIn delay={motion.stagger * 4}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre"
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              onSubmitEditing={submit}
              autoFocus
            />
          </FadeSlideIn>
        </View>

        <FadeSlideIn delay={motion.stagger * 5}>
          <ScalePressable onPress={submit} disabled={!canContinue} style={styles.btnWrap} pressedScale={0.97} fill>
            <LinearGradient
              colors={canContinue ? colors.gradient : ['#C7D2F0', '#C7D2F0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>Empezar</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
            </LinearGradient>
          </ScalePressable>
        </FadeSlideIn>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  content: {
    flex: 1,
    zIndex: 1,
    paddingHorizontal: spacing(6),
    justifyContent: 'space-between',
  },
  top: { alignItems: 'center', gap: spacing(4) },
  title: {
    fontSize: font.h1,
    lineHeight: line.h1,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.6,
    marginTop: spacing(2),
  },
  subtitle: {
    fontSize: font.body,
    lineHeight: line.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing(2),
  },
  input: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(4),
    fontSize: font.h3,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing(2),
    ...shadow,
  },
  btnWrap: {
    alignSelf: 'stretch',
    borderRadius: radius.pill,
    overflow: 'hidden',
    ...shadowStrong,
  },
  btn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
    borderRadius: radius.pill,
    paddingVertical: spacing(4.5),
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: font.h3 },
});
