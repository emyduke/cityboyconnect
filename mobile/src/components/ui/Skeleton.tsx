import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

type Variant = 'text' | 'card' | 'avatar' | 'list';

interface SkeletonProps {
  variant?: Variant;
  width?: number | string;
  height?: number;
  style?: ViewStyle;
  className?: string;
}

const variantDims: Record<Variant, { width: number | string; height: number }> = {
  text: { width: '100%', height: 16 },
  card: { width: '100%', height: 120 },
  avatar: { width: 44, height: 44 },
  list: { width: '100%', height: 64 },
};

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
    <View
      className="bg-gray-200 overflow-hidden"
      style={[{
        width: (width as any) || dims.width,
        height: height || dims.height,
        borderRadius: variant === 'avatar' ? 9999 : 12,
      }, style]}
    >
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, shimmerStyle]}>
        <LinearGradient
          colors={['#E5E7EB', '#F3F4F6', '#E5E7EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      </Animated.View>
    </View>
  );
}
