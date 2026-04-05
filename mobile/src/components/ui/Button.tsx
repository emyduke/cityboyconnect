import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, typography } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function Button({ children, onPress, variant = 'primary', size = 'md', loading = false, disabled = false, style }: ButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => { scale.value = withSpring(0.97); };
  const handlePressOut = () => { scale.value = withSpring(1); };
  const handlePress = () => {
    if (loading || disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const variantStyles = variantMap[variant];
  const sizeStyles = sizeMap[size];

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[styles.base, variantStyles.container, sizeStyles.container, (disabled || loading) && styles.disabled, animStyle, style]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.textColor} size="small" />
      ) : (
        <Text style={[typography.button, { color: variantStyles.textColor }, sizeStyles.text]}>
          {children}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const variantMap: Record<Variant, { container: ViewStyle; textColor: string }> = {
  primary: { container: { backgroundColor: colors.primary }, textColor: colors.textInverse },
  secondary: { container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary }, textColor: colors.primary },
  ghost: { container: { backgroundColor: 'transparent' }, textColor: colors.primary },
  danger: { container: { backgroundColor: colors.danger }, textColor: colors.textInverse },
};

const sizeMap: Record<Size, { container: ViewStyle; text: TextStyle }> = {
  sm: { container: { height: 36, paddingHorizontal: spacing.md }, text: { fontSize: 13 } },
  md: { container: { height: 44, paddingHorizontal: spacing.lg }, text: { fontSize: 15 } },
  lg: { container: { height: 52, paddingHorizontal: spacing.xl }, text: { fontSize: 16 } },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabled: {
    opacity: 0.5,
  },
});
