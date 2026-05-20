import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

interface StatCardProps {
  icon: ReactNode;
  value: string;
  label: string;
}

/**
 * Card de métrica da Home (500+ Trainers, 10.000+ Alunos, 98% Satisfação).
 * Flex: 1 → os três cartões dividem igualmente a linha.
 */
export default function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrapper}>{icon}</View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  iconWrapper: {
    marginBottom: theme.spacing.xs,
  },
  value: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 14,
  },
});
