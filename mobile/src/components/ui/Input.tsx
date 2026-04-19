import React, { useState } from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors } from '../../theme';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

export default function Input({ label, error, hint, leftIcon, style, onFocus, onBlur, value, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = useSharedValue(colors.border);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));

  const handleFocus = (e: any) => {
    setFocused(true);
    borderColor.value = withTiming(error ? colors.danger : colors.primary, { duration: 200 });
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    borderColor.value = withTiming(error ? colors.danger : colors.border, { duration: 200 });
    onBlur?.(e);
  };

  return (
    <View className="mb-4">
      <Text className={`text-[13px] font-body-medium leading-[18px] mb-1 ${error ? 'text-danger' : 'text-gray-900'}`}>
        {label}
      </Text>
      <Animated.View
        className={`flex-row items-center border-[1.5px] rounded-md bg-surface ${error ? 'border-danger' : ''}`}
        style={borderStyle}
      >
        {leftIcon && <View className="pl-4">{leftIcon}</View>}
        <TextInput
          className={`text-[15px] font-body leading-[22px] text-gray-900 pr-4 ${leftIcon ? 'pl-1' : 'pl-4'} py-[10px] min-h-[52px] flex-1`}
          placeholderTextColor={colors.textTertiary}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={style as any}
          {...props}
        />
      </Animated.View>
      {error ? (
        <Text className="text-xs font-body tracking-wide text-danger mt-1">{error}</Text>
      ) : hint ? (
        <Text className="text-xs font-body tracking-wide text-gray-500 mt-1">{hint}</Text>
      ) : null}
    </View>
  );
}
