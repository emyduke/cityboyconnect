import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface ReferralBannerProps {
  referrerName: string;
  onDismiss?: () => void;
}

export default function ReferralBanner({ referrerName, onDismiss }: ReferralBannerProps) {
  return (
    <View className="flex-row items-center justify-between bg-forest-light rounded-full px-4 py-2 mb-4">
      <Text className="text-[13px] font-body-medium leading-[18px] text-white flex-1">
        🎉 You were invited by {referrerName}
      </Text>
      {onDismiss && (
        <Pressable onPress={onDismiss} hitSlop={8}>
          <Text className="text-white/70 text-[16px] ml-2">✕</Text>
        </Pressable>
      )}
    </View>
  );
}
