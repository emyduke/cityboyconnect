import React from 'react';
import { View, Pressable, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  className?: string;
}

const paddingClasses = { sm: 'p-2', md: 'p-4', lg: 'p-6' };

export default function Card({ children, style, padding = 'md', onPress }: CardProps) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      className={`bg-surface rounded-lg overflow-hidden shadow-sm ${paddingClasses[padding]}`}
      style={style}
    >
      {children}
    </Wrapper>
  );
}
