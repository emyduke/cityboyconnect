import React, { useEffect } from 'react';
import { Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore } from '../../store/toastStore';

const typeClasses: Record<string, string> = {
  success: 'bg-success',
  error: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-info',
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

  const bgClass = typeClasses[toast.type] || typeClasses.info;

  return (
    <Animated.View
      className={`absolute left-4 right-4 z-[9999] rounded-md shadow-md ${bgClass}`}
      style={[{ top: insets.top + 8 }, animStyle]}
    >
      <Pressable onPress={() => remove(toast.id)} className="px-4 py-3">
        <Text className="text-[15px] font-body-medium leading-[22px] text-white text-center">
          {toast.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
