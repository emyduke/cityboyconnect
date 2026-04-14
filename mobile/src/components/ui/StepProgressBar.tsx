import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors, radius } from '../../theme';

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
    <View style={styles.track}>
      <Animated.View style={[styles.fill, fillStyle]}>
        <View style={styles.dot} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'visible',
  },
  fill: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
    position: 'relative',
    overflow: 'visible',
  },
  dot: {
    position: 'absolute',
    right: -5,
    top: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
});
