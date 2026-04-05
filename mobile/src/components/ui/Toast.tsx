import React, { useEffect } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography, shadows } from '../../theme';
import { useToastStore } from '../../store/toastStore';

const typeColors: Record<string, { bg: string; text: string }> = {
  success: { bg: colors.success, text: '#fff' },
  error: { bg: colors.danger, text: '#fff' },
  warning: { bg: colors.warning, text: '#fff' },
  info: { bg: colors.info, text: '#fff' },
};

export default function Toast() {
  const { toasts, remove } = useToastStore();
  const insets = useSafeAreaInsets();
  const toast = toasts[0];
  const translateY = useSharedValue(-100);

  useEffect(() => {
    if (toast) {
      translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
    }
  }, [toast?.id]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!toast) return null;

  const c = typeColors[toast.type] || typeColors.info;

  return (
    <Animated.View style={[styles.container, { top: insets.top + spacing.sm, backgroundColor: c.bg }, shadows.md, animStyle]}>
      <Pressable onPress={() => remove(toast.id)} style={styles.inner}>
        <Text style={[styles.text, { color: c.text }]}>{toast.message}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
    borderRadius: radius.md,
  },
  inner: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  text: {
    ...typography.bodyMedium,
    textAlign: 'center',
  },
});
