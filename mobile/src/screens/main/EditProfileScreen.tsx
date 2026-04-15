import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme';
import { updateMemberProfile } from '../../api/opportunities';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const toast = useToastStore((s) => s.show);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: user?.full_name || '', occupation: user?.occupation || '',
    gender: user?.gender || 'MALE',
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.full_name.trim()) { setError('Name is required'); return; }
    setLoading(true); setError('');
    try {
      await updateMemberProfile(form);
      if (setUser) setUser({ ...user, ...form });
      toast('Profile updated!', 'success');
      navigation.goBack();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to update');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Edit Profile</Text>

        <Input label="Full Name *" value={form.full_name} onChangeText={(v: string) => set('full_name', v)} />
        <Input label="Occupation" value={form.occupation} onChangeText={(v: string) => set('occupation', v)} placeholder="e.g. Engineer, Teacher" />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.chipRow}>
          {['MALE', 'FEMALE'].map((g) => (
            <Text key={g} style={[styles.chip, form.gender === g && styles.chipActive]} onPress={() => set('gender', g)}>{g}</Text>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button onPress={handleSubmit} loading={loading} size="lg" style={{ marginTop: spacing.lg }}>Save Changes</Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  heading: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
  label: { ...typography.bodyMedium, color: colors.text, marginTop: spacing.md, marginBottom: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { ...typography.caption, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: colors.surface, borderRadius: 999, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', color: colors.textSecondary },
  chipActive: { backgroundColor: colors.primary + '15', borderColor: colors.primary, color: colors.primary },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
});
