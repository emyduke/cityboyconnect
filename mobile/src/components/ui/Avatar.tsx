import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors, radius } from '../../theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = { sm: 32, md: 44, lg: 64, xl: 80 };
const fontMap = { sm: 13, md: 17, lg: 24, xl: 30 };

export default function Avatar({ uri, name, size = 'md' }: AvatarProps) {
  const dim = sizeMap[size];
  const initials = (name || '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: dim, height: dim, borderRadius: dim / 2 }]}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: dim, height: dim, borderRadius: dim / 2 }]}>
      <Text style={[styles.initials, { fontSize: fontMap[size] }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.skeleton },
  fallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.textInverse, fontFamily: 'PlusJakartaSans-Bold' },
});
