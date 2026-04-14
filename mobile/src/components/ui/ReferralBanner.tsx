import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';

interface ReferralBannerProps {
  referrerName: string;
  onDismiss?: () => void;
}

export default function ReferralBanner({ referrerName, onDismiss }: ReferralBannerProps) {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>🎉 You were invited by {referrerName}</Text>
      {onDismiss && (
        <Pressable onPress={onDismiss} hitSlop={8}>
          <Text style={styles.dismiss}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  text: { ...typography.bodySm, color: colors.textInverse, fontFamily: 'PlusJakartaSans-Medium', flex: 1 },
  dismiss: { color: 'rgba(255,255,255,0.7)', fontSize: 16, marginLeft: spacing.sm },
});
