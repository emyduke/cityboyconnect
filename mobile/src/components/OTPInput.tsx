import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Keyboard } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withSpring } from 'react-native-reanimated';
import { colors, spacing, radius } from '../theme';

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
}

export default function OTPInput({ length = 6, onComplete }: OTPInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const refs = useRef<(TextInput | null)[]>([]);
  const allFilled = values.every((v) => v.length === 1);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (allFilled) {
      pulseScale.value = withSequence(
        withSpring(1.05, { damping: 4 }),
        withSpring(1),
      );
    }
  }, [allFilled]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleChange = (text: string, index: number) => {
    if (text.length === length) {
      const digits = text.replace(/\D/g, '').slice(0, length).split('');
      setValues(digits);
      refs.current[length - 1]?.focus();
      if (digits.length === length) onComplete(digits.join(''));
      return;
    }

    const digit = text.replace(/\D/g, '').slice(-1);
    const newValues = [...values];
    newValues[index] = digit;
    setValues(newValues);

    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus();
    }

    if (newValues.every((v) => v.length === 1)) {
      Keyboard.dismiss();
      onComplete(newValues.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !values[index] && index > 0) {
      refs.current[index - 1]?.focus();
      const newValues = [...values];
      newValues[index - 1] = '';
      setValues(newValues);
    }
  };

  return (
    <Animated.View style={[styles.container, pulseStyle]}>
      {Array.from({ length }).map((_, i) => (
        <TextInput
          key={i}
          ref={(r) => { refs.current[i] = r; }}
          style={[styles.box, values[i] ? styles.filled : null, allFilled && styles.complete]}
          value={values[i]}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={i === 0 ? length : 1}
          textContentType="oneTimeCode"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          selectTextOnFocus
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  box: {
    width: 52,
    height: 60,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    textAlign: 'center',
    fontSize: 28,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.text,
    backgroundColor: colors.surface,
  },
  filled: { borderColor: colors.primary, borderWidth: 2 },
  complete: { borderColor: colors.accent, borderWidth: 2 },
});
