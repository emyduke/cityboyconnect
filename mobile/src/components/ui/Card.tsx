import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radius, shadows } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
}

export default function Card({ children, style, padding = 'md', onPress }: CardProps) {
  const padVal = padding === 'sm' ? spacing.sm : padding === 'lg' ? spacing.lg : spacing.md;
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={[styles.card, shadows.sm, { padding: padVal }, style]}>
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
});
