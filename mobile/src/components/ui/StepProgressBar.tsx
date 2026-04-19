import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface StepProgressBarProps {
  current: number;
  total: number;
}

export default function StepProgressBar({ current, total }: StepProgressBarProps) {
  const progress = (current + 1) / total;

  const fillStyle = useAnimatedStyle(() => ({
    width: withTiming(`${progress * 100}%` as any, { duration: 400 }),
  }));

  return (
    <View className="h-1 bg-gray-200 rounded-[2px] overflow-visible">
      <Animated.View className="h-1 bg-forest rounded-[2px] relative overflow-visible" style={fillStyle}>
        <View className="absolute -right-[5px] -top-[3px] w-[10px] h-[10px] rounded-full bg-gold" />
      </Animated.View>
    </View>
  );
}
