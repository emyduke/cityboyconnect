import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors, spacing, radius, typography } from '../../theme';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
}

export default function Input({ label, error, hint, style, onFocus, onBlur, value, ...props }: InputProps) {
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
    <View style={styles.wrapper}>
      <Text style={[styles.label, error && { color: colors.danger }]}>{label}</Text>
      <Animated.View style={[styles.inputWrapper, borderStyle, error && styles.errorBorder]}>
        <TextInput
          style={[styles.input, style as any]}
          placeholderTextColor={colors.textTertiary}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </Animated.View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { ...typography.bodySm, fontWeight: '500', color: colors.text, marginBottom: spacing.xs },
  inputWrapper: { borderWidth: 1.5, borderRadius: radius.md, borderColor: colors.border, backgroundColor: colors.surface },
  input: { ...typography.body, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, minHeight: 44 },
  errorBorder: { borderColor: colors.danger },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.xs },
  hint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
