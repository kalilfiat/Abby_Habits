/**
 * UI — Compact history cells (color by progress status).
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HistoryCell, ProgressStatus } from '../../core/habit-engine';
import { colors, font, spacing } from '../theme';

interface Props {
  cells: HistoryCell[];
  showLegend?: boolean;
}

const CELL_COLORS: Record<ProgressStatus, string> = {
  none: colors.border,
  started: colors.primaryLight,
  min: colors.warningLight,
  ideal: colors.successLight,
};

const CELL_BORDERS: Record<ProgressStatus, string> = {
  none: colors.border,
  started: colors.primary,
  min: colors.warning,
  ideal: colors.success,
};

export function PeriodHistoryStrip({ cells, showLegend = true }: Props) {
  if (cells.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {cells.map((cell) => (
          <View key={cell.key} style={styles.cellWrap}>
            <View
              style={[
                styles.cell,
                {
                  backgroundColor: CELL_COLORS[cell.status],
                  borderColor: CELL_BORDERS[cell.status],
                },
              ]}
            />
            <Text style={styles.label} numberOfLines={1}>
              {cell.label}
            </Text>
          </View>
        ))}
      </View>
      {showLegend && (
        <Text style={styles.legend}>
          Gris sin mínimo · Cyan en marcha · Ámbar mínimo · Verde ideal
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing(2),
    alignSelf: 'stretch',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    alignSelf: 'stretch',
    width: '100%',
    gap: spacing(1),
  },
  cellWrap: {
    flex: 1,
    minWidth: 0,
    alignItems: 'stretch',
    gap: 4,
  },
  cell: {
    width: '100%',
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
  legend: {
    fontSize: font.caption,
    color: colors.textLight,
    lineHeight: 16,
  },
});
