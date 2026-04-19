import React from 'react';
import { View, Text, ViewStyle } from 'react-native';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: string;
  style?: ViewStyle;
  className?: string;
}

export default function StatCard({ label, value, icon, style }: StatCardProps) {
  return (
    <View className="bg-surface rounded-lg p-4 flex-1 items-center min-w-[80px] shadow-sm" style={style}>
      {icon ? <Text className="text-2xl mb-1">{icon}</Text> : null}
      <Text className="text-2xl font-display-bold tracking-tight text-forest">{value}</Text>
      <Text className="text-xs font-body tracking-wide text-gray-500 mt-0.5">{label}</Text>
    </View>
  );
}
