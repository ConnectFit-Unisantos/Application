import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../styles/theme';
import { StatusAula } from '../types';

export const STATUS_LABEL: Record<StatusAula, string> = {
  pendente: 'Pendente',
  confirmada: 'Confirmada',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
  recusada: 'Recusada',
};

const STATUS_ICON: Record<StatusAula, keyof typeof Ionicons.glyphMap> = {
  pendente: 'time-outline',
  confirmada: 'checkmark-circle-outline',
  concluida: 'trophy-outline',
  cancelada: 'close-circle-outline',
  recusada: 'remove-circle-outline',
};

export default function StatusBadge({ status, size = 'sm' }: { status: StatusAula; size?: 'sm' | 'md' }) {
  const c = theme.colors.status[status];
  const md = size === 'md';
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: c.bg, borderColor: c.border },
        md && styles.badgeMd,
      ]}
    >
      <Ionicons name={STATUS_ICON[status]} size={md ? 15 : 12} color={c.fg} />
      <Text style={[styles.text, { color: c.fg }, md && styles.textMd]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeMd: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.semibold,
  },
  textMd: {
    fontSize: theme.fonts.sizes.sm,
  },
});
