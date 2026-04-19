import React, { useState } from 'react';
import { View, TextInput, Text } from 'react-native';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
}

export default function PhoneInput({ value, onChangeText, error }: PhoneInputProps) {
  const [focused, setFocused] = useState(false);

  const formatPhone = (text: string) => {
    const clean = text.replace(/\D/g, '');
    onChangeText(clean);
  };

  return (
    <View className="mb-4">
      <Text className={`text-[13px] font-body-medium leading-[18px] mb-1 ${error ? 'text-danger' : 'text-gray-900'}`}>
        Phone Number
      </Text>
      <View className={`flex-row items-center border-[1.5px] rounded-md bg-surface overflow-hidden ${
        error ? 'border-danger' : focused ? 'border-forest' : 'border-gray-200'
      }`}>
        <View className="flex-row items-center px-2 border-r border-gray-200 h-11">
          <Text className="text-lg mr-1">🇳🇬</Text>
          <Text className="text-[15px] font-body-medium leading-[22px] text-gray-900">+234</Text>
        </View>
        <TextInput
          className="flex-1 text-[15px] font-body leading-[22px] text-gray-900 px-2 h-11"
          value={value}
          onChangeText={formatPhone}
          placeholder="8012345678"
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad"
          maxLength={11}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {error ? <Text className="text-xs font-body tracking-wide text-danger mt-1">{error}</Text> : null}
    </View>
  );
}
