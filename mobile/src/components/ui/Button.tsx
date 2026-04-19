import React from 'react';
import { Pressable, Text, ActivityIndicator, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-gold',
  secondary: 'bg-forest',
  outline: 'bg-transparent border-[1.5px] border-forest',
  ghost: 'bg-transparent',
  danger: 'bg-danger-light border border-danger',
};

const variantTextClasses: Record<Variant, string> = {
  primary: 'text-forest-dark',
  secondary: 'text-white',
  outline: 'text-forest',
  ghost: 'text-forest',
  danger: 'text-danger',
};

const variantIndicatorColor: Record<Variant, string> = {
  primary: '#0d2416',
  secondary: '#FFFFFF',
  outline: '#1a472a',
  ghost: '#1a472a',
  danger: '#dc2626',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-10 px-4',
  md: 'h-12 px-6',
  lg: 'h-14 px-8',
};

const sizeTextClasses: Record<Size, string> = {
  sm: 'text-[13px]',
  md: 'text-[15px]',
  lg: 'text-[16px] font-body-bold',
};

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

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      className={`rounded-lg items-center justify-center flex-row ${variantClasses[variant]} ${sizeClasses[size]} ${(disabled || loading) ? 'opacity-50' : ''}`}
      style={[animStyle, style]}
    >
      {loading ? (
        <ActivityIndicator color={variantIndicatorColor[variant]} size="small" />
      ) : (
        <Text className={`font-body-semibold ${variantTextClasses[variant]} ${sizeTextClasses[size]}`}>
          {children}
        </Text>
      )}
    </AnimatedPressable>
  );
}
