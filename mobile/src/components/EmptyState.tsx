import React from 'react';
import { View, Text } from 'react-native';
import Button from './ui/Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon = '📭', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="items-center justify-center p-12">
      <Text className="text-[48px] mb-4">{icon}</Text>
      <Text className="text-[17px] font-display-semibold text-gray-900 text-center">{title}</Text>
      {description ? (
        <Text className="text-[13px] font-body leading-[18px] text-gray-500 text-center mt-1">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button onPress={onAction} size="sm" variant="secondary" style={{ marginTop: 16 }}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
