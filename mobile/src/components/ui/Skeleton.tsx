import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius } from '../../theme';

type Variant = 'text' | 'card' | 'avatar' | 'list';

interface SkeletonProps {
  variant?: Variant;
  width?: number | string;
  height?: number;
  style?: ViewStyle;
}

export default function Skeleton({ variant = 'text', width, height, style }: SkeletonProps) {
  const translateX = useSharedValue(-300);

  useEffect(() => {
    translateX.value = withRepeat(withTiming(300, { duration: 1200 }), -1, false);
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const dims = variantDims[variant];

  return (
    <View style={[styles.base, { width: (width as any) || dims.width, height: height || dims.height, borderRadius: variant === 'avatar' ? 9999 : radius.md }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
        <LinearGradient colors={[colors.skeleton, colors.shimmer, colors.skeleton]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

const variantDims: Record<Variant, { width: number | string; height: number }> = {
  text: { width: '100%', height: 16 },
  card: { width: '100%', height: 120 },
  avatar: { width: 44, height: 44 },
  list: { width: '100%', height: 64 },
};

const styles = StyleSheet.create({
  base: { backgroundColor: colors.skeleton, overflow: 'hidden' },
});
