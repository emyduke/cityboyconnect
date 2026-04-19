import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { cssInterop } from 'nativewind';

cssInterop(Image, { className: 'style' });

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = { sm: 'w-8 h-8', md: 'w-11 h-11', lg: 'w-16 h-16', xl: 'w-20 h-20' };
const fontClasses = { sm: 'text-[13px]', md: 'text-[17px]', lg: 'text-[24px]', xl: 'text-[30px]' };

export default function Avatar({ uri, name, size = 'md' }: AvatarProps) {
  const initials = (name || '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  if (uri) {
    return (
      <Image
        source={{ uri }}
        className={`${sizeClasses[size]} rounded-full bg-gray-200`}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View className={`${sizeClasses[size]} rounded-full bg-forest items-center justify-center`}>
      <Text className={`${fontClasses[size]} text-white font-body-bold`}>{initials}</Text>
    </View>
  );
}
