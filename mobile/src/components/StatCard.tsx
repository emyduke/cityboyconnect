import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography, shadows } from '../theme';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: string;
  style?: import('react-native').ViewStyle;
}

export default function StatCard({ label, value, icon, style }: StatCardProps) {
  return (
    <View style={[styles.card, shadows.sm, style]}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flex: 1,
    alignItems: 'center',
    minWidth: 80,
  },
  icon: { fontSize: 24, marginBottom: spacing.xs },
  value: { ...typography.h2, color: colors.primary },
  label: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
