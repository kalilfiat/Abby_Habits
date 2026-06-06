/**
 * UI — Editable habit "ficha".
 *
 * Shows the parsed draft (or an existing habit) as a friendly form: name, type,
 * unit, frequency, minimum/ideal goals and quick-log buttons. Saving creates or
 * updates the habit and returns to "Hoy".
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DraftHabit,
  Frequency,
  GENERIC_SUGGESTIONS,
  HabitType,
  UNIT_CATALOG,
  findUnitPreset,
} from '../../core/habit-engine';
import { useStore } from '../../store/useStore';
import { ScalePressable, tapSuccess } from '../motion';
import { RootStackParamList } from '../navigation';
import { colors, font, radius, shadow, shadowStrong, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'HabitEdit'>;

const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : `${Math.round(n * 100) / 100}`);

/** Curated icon choices (MaterialCommunityIcons) for the picker. */
const ICON_OPTIONS = [
  'run', 'walk', 'cup-water', 'sleep', 'book-open-variant', 'meditation',
  'dumbbell', 'school', 'fountain-pen-tip', 'food-apple', 'timer-sand',
  'heart-pulse', 'bike', 'music', 'target', 'check-circle-outline',
];

const EMPTY_DRAFT: DraftHabit = {
  name: '',
  type: 'quantity',
  unit: '',
  frequency: 'daily',
  minGoal: 1,
  idealGoal: 1,
  quickAdd: [1],
  icon: 'target',
};

const num = (s: string) => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export function HabitEditScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { habitId, draft } = route.params ?? {};

  const addHabit = useStore((s) => s.addHabit);
  const updateHabit = useStore((s) => s.updateHabit);
  const archiveHabit = useStore((s) => s.archiveHabit);
  const existing = useStore((s) => (habitId ? s.habits.find((h) => h.id === habitId) : undefined));

  const initial = useMemo<DraftHabit>(
    () => existing ?? draft ?? EMPTY_DRAFT,
    [existing, draft],
  );

  const [name, setName] = useState(initial.name);
  const [icon, setIcon] = useState(initial.icon);
  const [type, setType] = useState<HabitType>(initial.type);
  const [unit, setUnit] = useState(initial.unit);
  const [frequency, setFrequency] = useState<Frequency>(initial.frequency);
  const [minGoal, setMinGoal] = useState(String(initial.minGoal));
  const [idealGoal, setIdealGoal] = useState(String(initial.idealGoal));
  const [quickAdd, setQuickAdd] = useState<number[]>(initial.quickAdd);
  // Custom-unit mode: a unit not present in the catalog is edited as free text.
  const [customUnit, setCustomUnit] = useState(
    () => initial.unit !== '' && !findUnitPreset(initial.unit),
  );

  // Candidate quick-add increments shown as toggle chips: the selected unit's
  // suggestions (or a generic set), always including any already-active values.
  const suggestions = useMemo(() => {
    const preset = customUnit ? undefined : findUnitPreset(unit);
    const base = preset ? preset.suggestions : GENERIC_SUGGESTIONS;
    return Array.from(new Set([...base, ...quickAdd])).sort((a, b) => a - b);
  }, [unit, customUnit, quickAdd]);

  const toggleQuick = (n: number) =>
    setQuickAdd((prev) =>
      prev.includes(n)
        ? prev.length > 1
          ? prev.filter((x) => x !== n)
          : prev // keep at least one
        : [...prev, n].sort((a, b) => a - b),
    );

  const selectUnit = (u: string) => {
    setCustomUnit(false);
    setUnit(u);
    const preset = findUnitPreset(u);
    if (preset) setQuickAdd(preset.defaultQuickAdd);
  };

  const save = () => {
    const isBinary = type === 'binary';
    const payload: DraftHabit = {
      name: name.trim() || 'Nuevo hábito',
      icon: icon || 'target',
      type,
      unit: isBinary ? '' : unit.trim(),
      frequency,
      idealGoal: isBinary ? 1 : Math.max(num(idealGoal), 1),
      minGoal: isBinary ? 1 : Math.max(num(minGoal), 0),
      quickAdd: isBinary ? [] : quickAdd.filter((n) => n > 0),
    };
    if (payload.quickAdd.length === 0 && !isBinary) payload.quickAdd = [1];

    if (habitId) updateHabit(habitId, payload);
    else addHabit(payload);

    tapSuccess();
    navigation.reset({ index: 0, routes: [{ name: 'Today' }] });
  };

  const remove = () => {
    if (habitId) archiveHabit(habitId);
    navigation.reset({ index: 0, routes: [{ name: 'Today' }] });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing(10) }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{habitId ? 'Editar hábito' : 'Tu nuevo hábito'}</Text>

      {/* Name */}
      <View style={styles.field}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nombre del hábito"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Icon picker */}
      <View style={styles.field}>
        <Text style={styles.label}>Ícono</Text>
        <View style={styles.iconGrid}>
          {ICON_OPTIONS.map((name) => {
            const selected = name === icon;
            return (
              <Pressable
                key={name}
                onPress={() => setIcon(name)}
                style={[styles.iconOption, selected && styles.iconOptionActive]}
              >
                <MaterialCommunityIcons
                  name={name as any}
                  size={24}
                  color={selected ? colors.primary : colors.textMuted}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Type */}
      <View style={styles.field}>
        <Text style={styles.label}>Tipo de hábito</Text>
        <View style={styles.segment}>
          <SegBtn label="Cantidad" active={type === 'quantity'} onPress={() => setType('quantity')} />
          <SegBtn label="Sí / No" active={type === 'binary'} onPress={() => setType('binary')} />
        </View>
        <Text style={styles.hint}>
          {type === 'quantity'
            ? 'Medís un número por día (litros, páginas, minutos...).'
            : 'Solo marcás si lo cumpliste o no.'}
        </Text>
      </View>

      {type === 'quantity' && (
        <>
          {/* Unidad — selector deslizable, sin tipear */}
          <View style={styles.field}>
            <Text style={styles.label}>Unidad</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.unitRow}
            >
              {UNIT_CATALOG.map((p) => {
                const sel = !customUnit && unit === p.unit;
                return (
                  <Pressable
                    key={p.unit}
                    onPress={() => selectUnit(p.unit)}
                    style={[styles.unitChip, sel && styles.unitChipActive]}
                  >
                    <MaterialCommunityIcons
                      name={p.icon as any}
                      size={16}
                      color={sel ? colors.primary : colors.textMuted}
                    />
                    <Text style={[styles.unitChipText, sel && styles.unitChipTextActive]}>
                      {p.unit}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => setCustomUnit(true)}
                style={[styles.unitChip, customUnit && styles.unitChipActive]}
              >
                <MaterialCommunityIcons
                  name="pencil"
                  size={16}
                  color={customUnit ? colors.primary : colors.textMuted}
                />
                <Text style={[styles.unitChipText, customUnit && styles.unitChipTextActive]}>
                  Otra
                </Text>
              </Pressable>
            </ScrollView>
            {customUnit && (
              <TextInput
                style={styles.input}
                value={unit}
                onChangeText={setUnit}
                placeholder="Escribí la unidad"
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
            )}
          </View>

          <View style={styles.twoCol}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Meta mínima</Text>
              <TextInput
                style={styles.input}
                value={minGoal}
                onChangeText={setMinGoal}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Meta ideal</Text>
              <TextInput
                style={styles.input}
                value={idealGoal}
                onChangeText={setIdealGoal}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Botones rápidos — chips que se tocan para activar/desactivar */}
          <View style={styles.field}>
            <Text style={styles.label}>Botones rápidos</Text>
            <Text style={styles.hint}>Elegí con qué incrementos vas a registrar.</Text>
            <View style={styles.quickWrap}>
              {suggestions.map((n) => {
                const sel = quickAdd.includes(n);
                return (
                  <Pressable
                    key={n}
                    onPress={() => toggleQuick(n)}
                    style={[styles.quickChip, sel && styles.quickChipActive]}
                  >
                    <Text style={[styles.quickChipText, sel && styles.quickChipTextActive]}>
                      +{fmt(n)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </>
      )}

      {/* Frequency */}
      <View style={styles.field}>
        <Text style={styles.label}>Frecuencia</Text>
        <View style={styles.segment}>
          <SegBtn label="Diario" active={frequency === 'daily'} onPress={() => setFrequency('daily')} />
          <SegBtn label="Semanal" active={frequency === 'weekly'} onPress={() => setFrequency('weekly')} />
          <SegBtn label="Mensual" active={frequency === 'monthly'} onPress={() => setFrequency('monthly')} />
        </View>
      </View>

      <ScalePressable onPress={save} style={styles.saveWrap} pressedScale={0.97} fill>
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.saveBtn}
        >
          <Text style={styles.saveBtnText}>{habitId ? 'Guardar cambios' : 'Crear hábito'}</Text>
        </LinearGradient>
      </ScalePressable>

      {habitId && (
        <Pressable style={styles.deleteBtn} onPress={remove}>
          <Text style={styles.deleteText}>Eliminar hábito</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function SegBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.segBtn, active && styles.segBtnActive]} onPress={onPress}>
      <Text style={[styles.segBtnText, active && styles.segBtnTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(5), gap: spacing(4) },
  title: { fontSize: font.h1, fontWeight: '800', color: colors.text },
  field: { gap: spacing(2) },
  label: { fontSize: font.body2, fontWeight: '700', color: colors.textMuted },
  hint: { fontSize: font.caption, color: colors.textMuted },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    fontSize: font.body,
    color: colors.text,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2.5),
  },
  iconOption: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  // Unit selector
  unitRow: { gap: spacing(2), paddingVertical: spacing(1), paddingRight: spacing(2) },
  unitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2.5),
  },
  unitChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  unitChipText: { fontSize: font.body2, fontWeight: '600', color: colors.textMuted },
  unitChipTextActive: { color: colors.primary },

  // Quick-add toggles
  quickWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2.5) },
  quickChip: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(4.5),
    paddingVertical: spacing(2.5),
    minWidth: 52,
    alignItems: 'center',
  },
  quickChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  quickChipText: { fontSize: font.body, fontWeight: '700', color: colors.textMuted },
  quickChipTextActive: { color: colors.primaryDark },

  twoCol: { flexDirection: 'row', gap: spacing(3) },
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
  saveWrap: {
    alignSelf: 'stretch',
    borderRadius: radius.pill,
    marginTop: spacing(2),
    overflow: 'hidden',
    ...shadowStrong,
  },
  saveBtn: {
    width: '100%',
    borderRadius: radius.pill,
    paddingVertical: spacing(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: font.h3 },
  deleteBtn: { alignItems: 'center', paddingVertical: spacing(3) },
  deleteText: { color: colors.danger, fontWeight: '600', fontSize: font.body },
});
