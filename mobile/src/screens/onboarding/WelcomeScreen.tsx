import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { colors, spacing, radius, typography } from '../../theme';
import Button from '../../components/ui/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
  currentPage?: number;
  totalPages?: number;
}

export default function WelcomeScreen({ onGetStarted, onLogin, currentPage = 0, totalPages = 3 }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[colors.primaryDark, colors.primary, colors.primaryLight]}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + spacing.xxl }]}>
        <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.logoWrap}>
          <Image
            source={require('../../../assets/files/02_primary_transparent.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(600)}>
          <Text style={styles.headline}>
            Building Nigeria's Most Organised Youth Movement
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(700).duration(600)}>
          <Text style={styles.subtext}>
            Join 50,000+ members across all 36 states and the FCT
          </Text>
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInDown.delay(900).duration(600)}
        style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        {/* Page dots */}
        <View style={styles.dots}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <View key={i} style={[styles.dot, i === currentPage && styles.dotActive]} />
          ))}
        </View>

        <Button onPress={onGetStarted} size="lg" style={styles.cta}>
          Get Started
        </Button>

        <Pressable onPress={onLogin}>
          <Text style={styles.loginLink}>I have an account</Text>
        </Pressable>
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
  logoWrap: { marginBottom: spacing.xl },
  logo: { width: 240, height: 100 },
  headline: {
    ...typography.h2,
    color: colors.textInverse,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 32,
  },
  subtext: {
    ...typography.body,
    color: colors.accent,
    textAlign: 'center',
    opacity: 0.9,
  },
  bottom: {
    paddingHorizontal: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 24,
  },
  cta: { width: '100%', marginBottom: spacing.md },
  loginLink: {
    ...typography.body,
    color: colors.textInverse,
    textAlign: 'center',
    textDecorationLine: 'underline',
    opacity: 0.8,
  },
});
