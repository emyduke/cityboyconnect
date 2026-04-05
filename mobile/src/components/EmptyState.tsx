import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from './ui/Button';
import { colors, spacing, typography } from '../theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon = '📭', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Button onPress={onAction} size="sm" variant="secondary" style={{ marginTop: spacing.md }}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  icon: { fontSize: 48, marginBottom: spacing.md },
  title: { ...typography.h4, color: colors.text, textAlign: 'center' },
  description: { ...typography.bodySm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
});
