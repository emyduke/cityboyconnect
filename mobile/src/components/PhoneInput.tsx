import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
}

export default function PhoneInput({ value, onChangeText, error }: PhoneInputProps) {
  const [focused, setFocused] = useState(false);

  const formatPhone = (text: string) => {
    const clean = text.replace(/\D/g, '');
    // Allow +234 or 0 prefix
    onChangeText(clean);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, error && { color: colors.danger }]}>Phone Number</Text>
      <View style={[styles.row, focused && styles.focused, error && styles.errorBorder]}>
        <View style={styles.prefix}>
          <Text style={styles.flag}>🇳🇬</Text>
          <Text style={styles.code}>+234</Text>
        </View>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={formatPhone}
          placeholder="8012345678"
          placeholderTextColor={colors.textTertiary}
          keyboardType="phone-pad"
          maxLength={11}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { ...typography.bodySm, fontFamily: 'PlusJakartaSans-Medium', color: colors.text, marginBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  focused: { borderColor: colors.primary },
  errorBorder: { borderColor: colors.danger },
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    height: 44,
  },
  flag: { fontSize: 18, marginRight: 4 },
  code: { ...typography.bodyMedium, color: colors.text },
  input: { flex: 1, ...typography.body, color: colors.text, paddingHorizontal: spacing.sm, height: 44 },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.xs },
});
