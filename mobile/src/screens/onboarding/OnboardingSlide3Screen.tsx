import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, spacing, radius, typography } from '../../theme';
import Button from '../../components/ui/Button';

interface OnboardingSlide3Props {
  onJoin: () => void;
  onLogin: () => void;
  currentPage?: number;
  totalPages?: number;
}

export default function OnboardingSlide3Screen({ onJoin, onLogin, currentPage = 2, totalPages = 3 }: OnboardingSlide3Props) {
  const insets = useSafeAreaInsets();

  const features = [
    { icon: '⭐', text: 'Score points for every action' },
    { icon: '📍', text: 'Represent your LGA, State & Zone' },
    { icon: '🏆', text: 'National Leaderboard visible to all' },
  ];

  return (
    <LinearGradient colors={[colors.primaryDark, '#0f3320']} style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + spacing.xxl }]}>
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <Image
            source={require('../../../assets/files/07_icon_gold.png')}
            style={styles.icon}
            contentFit="contain"
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <Text style={styles.headline}>Climb the Ranks.{'\n'}Lead Your Ward.</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(600)}>
          <Text style={styles.subtext}>
            From Ward Coordinator to State Director — your performance drives your promotion.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.featureList}>
          {features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInUp.delay(800).duration(600)}
        style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <View style={styles.dots}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <View key={i} style={[styles.dot, i === currentPage && styles.dotActive]} />
          ))}
        </View>

        <Button onPress={onJoin} size="lg" style={styles.joinBtn}>
          Join Now
        </Button>

        <Button variant="outline" onPress={onLogin} size="lg" style={styles.loginBtn}>
          Log In
        </Button>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  icon: { width: 80, height: 80, marginBottom: spacing.lg },
  headline: {
    ...typography.h1,
    color: colors.textInverse,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 36,
  },
  subtext: {
    ...typography.body,
    color: colors.accent,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  featureList: { width: '100%', gap: spacing.md },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIcon: { fontSize: 20 },
  featureText: { ...typography.body, color: colors.textInverse },
  bottom: { paddingHorizontal: spacing.lg },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: colors.accent, width: 24 },
  joinBtn: { width: '100%', marginBottom: spacing.sm },
  loginBtn: {
    width: '100%',
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'transparent',
  },
});
