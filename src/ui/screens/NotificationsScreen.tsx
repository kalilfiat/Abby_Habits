/**
 * UI — Notification preferences (fixed schedule, v1).
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NOTIFICATION_TIMES } from '../../core/reminders';
import { getPermissionStatus, requestPermission } from '../../data/notifications';
import { useStore } from '../../store/useStore';
import { RootStackParamList } from '../navigation';
import { AmbientBackground, FadeSlideIn } from '../motion';
import { colors, font, fontFamily, line, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

/** Same bubble-tone panel as chat header (screen-local, not global theme). */
const PANEL_CYAN = '#D2F0F5';

function fmtTime({ hour, minute }: { hour: number; minute: number }): string {
  const h = `${hour}`.padStart(2, '0');
  const m = `${minute}`.padStart(2, '0');
  return `${h}:${m}`;
}

const SCHEDULE = [
  { icon: 'weather-sunny' as const, label: 'Mañana', detail: `Recordatorio global · ${fmtTime(NOTIFICATION_TIMES.morning)}` },
  { icon: 'white-balance-sunny' as const, label: 'Mediodía', detail: `Check-in global · ${fmtTime(NOTIFICATION_TIMES.midday)}` },
  {
    icon: 'weather-sunset' as const,
    label: 'Tarde',
    detail: `Mínimo diario o racha en riesgo · ${fmtTime(NOTIFICATION_TIMES.afternoon)}`,
  },
  {
    icon: 'calendar-week' as const,
    label: 'Viernes',
    detail: `Hábitos semanales sin mínimo · ${fmtTime(NOTIFICATION_TIMES.friday)}`,
  },
  {
    icon: 'calendar-month' as const,
    label: 'Fin de mes',
    detail: 'Hábitos mensuales · 7 días antes del cierre',
  },
  {
    icon: 'party-popper' as const,
    label: 'Felicitación',
    detail: `Mié y dom si vas bien · ${fmtTime(NOTIFICATION_TIMES.celebration)}`,
  },
];

export function NotificationsScreen({}: Props) {
  const insets = useSafeAreaInsets();
  const enabled = useStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useStore((s) => s.setNotificationsEnabled);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const isWeb = Platform.OS === 'web';

  const refreshPermission = useCallback(async () => {
    setPermission(await getPermissionStatus());
  }, []);

  useEffect(() => {
    void refreshPermission();
  }, [refreshPermission]);

  const onToggle = async (next: boolean) => {
    if (isWeb) return;
    if (next) {
      const status = await requestPermission();
      setPermission(status);
      if (status !== 'granted') return;
    }
    await setNotificationsEnabled(next);
  };

  const openSettings = () => {
    void Linking.openSettings();
  };

  return (
    <View style={styles.screen}>
      <AmbientBackground />
      <View style={[styles.introPanel, { paddingTop: spacing(3) }]}>
        <Text style={styles.introText}>
          Abby te avisa con horarios fijos según tus hábitos.
        </Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing(6) },
        ]}
      >
      <FadeSlideIn delay={0}>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.cardTitle}>Recordatorios</Text>
              <Text style={styles.cardHint}>
                Abby te avisa con horarios fijos según tus hábitos.
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={onToggle}
              disabled={isWeb}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={enabled ? colors.primary : '#f4f4f5'}
            />
          </View>
          {!isWeb && permission === 'denied' && (
            <Text style={styles.denied}>
              Los permisos están desactivados.{' '}
              <Text style={styles.link} onPress={openSettings}>
                Abrí ajustes del sistema
              </Text>
              .
            </Text>
          )}
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={80}>
        <Text style={styles.section}>Horarios</Text>
        <Text style={styles.sectionHint}>
          Los avisos usan el mínimo de cada hábito, no la meta ideal. Se actualizan cuando abrís la app.
        </Text>
      </FadeSlideIn>

      {SCHEDULE.map((item, i) => (
        <FadeSlideIn key={item.label} delay={120 + i * 50}>
          <View style={styles.scheduleRow}>
            <MaterialCommunityIcons name={item.icon} size={22} color={colors.primary} />
            <View style={styles.scheduleText}>
              <Text style={styles.scheduleLabel}>{item.label}</Text>
              <Text style={styles.scheduleDetail}>{item.detail}</Text>
            </View>
          </View>
        </FadeSlideIn>
      ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  introPanel: {
    backgroundColor: PANEL_CYAN,
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184, 232, 239, 0.65)',
    zIndex: 1,
  },
  introText: {
    fontFamily: fontFamily.body,
    fontSize: font.body2,
    color: colors.textMuted,
    lineHeight: line.body2,
  },
  scroll: { flex: 1, backgroundColor: 'transparent', zIndex: 1 },
  content: { padding: spacing(4), gap: spacing(3) },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing(4),
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
  rowText: { flex: 1 },
  cardTitle: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 16,
    color: colors.heading,
  },
  cardHint: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  denied: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing(3),
  },
  link: { color: colors.primary, textDecorationLine: 'underline' },
  section: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 16,
    color: colors.heading,
  },
  sectionHint: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: -spacing(1),
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing(3),
    paddingVertical: spacing(2),
  },
  scheduleText: { flex: 1 },
  scheduleLabel: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    color: colors.text,
  },
  scheduleDetail: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});
