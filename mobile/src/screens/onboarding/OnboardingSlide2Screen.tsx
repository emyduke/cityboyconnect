import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, spacing, radius, typography, shadows } from '../../theme';
import Button from '../../components/ui/Button';

interface OnboardingSlide2Props {
  onNext: () => void;
  onSkip: () => void;
  currentPage?: number;
  totalPages?: number;
}

export default function OnboardingSlide2Screen({ onNext, onSkip, currentPage = 1, totalPages = 3 }: OnboardingSlide2Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
      <View style={styles.content}>
        {/* Illustration */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.illustrationWrap}>
          <View style={styles.illustration}>
            <View style={styles.phoneOutline}>
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrIcon}>📱</Text>
                <View style={styles.qrGrid}>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <View key={i} style={[styles.qrBlock, i % 2 === 0 && styles.qrBlockFilled]} />
                  ))}
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <View style={styles.badgeRow}>
            <Text style={styles.badgeIcon}>🏅</Text>
            <Text style={styles.badgeLabel}>Your Digital ID</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(600)}>
          <Text style={styles.headline}>Your QR Code is Your Identity</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).duration(600)}>
          <Text style={styles.body}>
            Get verified, recruit members, earn points, and track your network — all from one app.
          </Text>
        </Animated.View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.dots}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <View key={i} style={[styles.dot, i === currentPage && styles.dotActive]} />
          ))}
        </View>

        <Button onPress={onNext} size="lg" style={styles.cta}>
          Next →
        </Button>

        <Pressable onPress={onSkip}>
          <Text style={styles.skipLink}>Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  illustrationWrap: { marginBottom: spacing.xl },
  illustration: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneOutline: {
    width: 100,
    height: 140,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  qrPlaceholder: { alignItems: 'center' },
  qrIcon: { fontSize: 24, marginBottom: spacing.xs },
  qrGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 45, gap: 3 },
  qrBlock: { width: 13, height: 13, borderRadius: 2, backgroundColor: colors.border },
  qrBlockFilled: { backgroundColor: colors.primary },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  badgeIcon: { fontSize: 18 },
  badgeLabel: { ...typography.captionBold, color: colors.accent },
  headline: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottom: { paddingHorizontal: spacing.lg },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.accent, width: 24 },
  cta: { width: '100%', marginBottom: spacing.md },
  skipLink: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
