import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radius } from '../../theme';
import { createAnnouncement } from '../../api/opportunities';
import { useToastStore } from '../../store/toastStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const PRIORITY_OPTIONS = ['NORMAL', 'IMPORTANT', 'URGENT'];
const SCOPE_OPTIONS = ['ALL', 'STATE', 'LGA', 'WARD'];

export default function CreateAnnouncementScreen() {
  const navigation = useNavigation<any>();
  const toast = useToastStore((s) => s.show);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', body: '', priority: 'NORMAL', scope: 'ALL',
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.body.trim()) { setError('Body is required'); return; }
    setLoading(true); setError('');
    try {
      await createAnnouncement(form);
      toast('Announcement created!', 'success');
      navigation.goBack();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to create');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Create Announcement</Text>

        <Input label="Title *" value={form.title} onChangeText={(v: string) => set('title', v)} placeholder="Announcement title" />
        <Input label="Body *" value={form.body} onChangeText={(v: string) => set('body', v)} placeholder="Write the announcement content..." multiline numberOfLines={6} />

        <Text style={styles.label}>Priority</Text>
        <View style={styles.chipRow}>
          {PRIORITY_OPTIONS.map((p) => (
            <Text key={p} style={[styles.chip, form.priority === p && styles.chipActive]} onPress={() => set('priority', p)}>{p}</Text>
          ))}
        </View>

        <Text style={styles.label}>Scope</Text>
        <View style={styles.chipRow}>
          {SCOPE_OPTIONS.map((s) => (
            <Text key={s} style={[styles.chip, form.scope === s && styles.chipActive]} onPress={() => set('scope', s)}>{s}</Text>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button onPress={handleSubmit} loading={loading} size="lg" style={{ marginTop: spacing.lg }}>Create Announcement</Button>
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
