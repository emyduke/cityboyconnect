import React from 'react';
import { View, Text } from 'react-native';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-success-light',
  warning: 'bg-warning-light',
  danger: 'bg-danger-light',
  info: 'bg-info-light',
  default: 'bg-gray-100',
};

const variantTextClasses: Record<BadgeVariant, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  default: 'text-gray-500',
};

export default function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <View className={`px-2 py-0.5 rounded-full ${variantClasses[variant]}`}>
      <Text className={`text-xs font-body-semibold tracking-wide ${variantTextClasses[variant]}`}>
        {label}
      </Text>
    </View>
  );
}
