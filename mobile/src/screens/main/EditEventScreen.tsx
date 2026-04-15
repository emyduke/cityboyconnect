import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme';
import { updateEvent } from '../../api/opportunities';
import { getEventDetail } from '../../api/events';
import { unwrap } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const EVENT_TYPES = ['RALLY', 'MEETING', 'TRAINING', 'OUTREACH', 'CAMPAIGN', 'OTHER'];
const VISIBILITY_OPTIONS = ['PUBLIC', 'MEMBERS_ONLY', 'INVITE_ONLY'];

export default function EditEventScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const toast = useToastStore((s) => s.show);
  const { id } = route.params;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', venue_name: '', location: '',
    event_type: 'MEETING', visibility: 'PUBLIC', status: 'UPCOMING',
    start_datetime: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const event = unwrap(await getEventDetail(id));
        setForm({
          title: event.title || '', description: event.description || '',
          venue_name: event.venue_name || event.venue || '',
          location: event.location || '', event_type: event.event_type || 'MEETING',
          visibility: event.visibility || 'PUBLIC', status: event.status || 'UPCOMING',
          start_datetime: event.start_datetime || '',
        });
      } catch { toast('Failed to load event', 'error'); navigation.goBack(); }
      setFetching(false);
    })();
  }, [id]);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setLoading(true); setError('');
    try {
      await updateEvent(id, form);
      toast('Event updated!', 'success');
      navigation.goBack();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to update');
    }
    setLoading(false);
  };

  if (fetching) return <View style={styles.container}><Text style={styles.heading}>Loading...</Text></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Edit Event</Text>

        <Input label="Title *" value={form.title} onChangeText={(v: string) => set('title', v)} />
        <Input label="Description" value={form.description} onChangeText={(v: string) => set('description', v)} multiline numberOfLines={4} />
        <Input label="Venue" value={form.venue_name} onChangeText={(v: string) => set('venue_name', v)} />
        <Input label="Location" value={form.location} onChangeText={(v: string) => set('location', v)} />

        <Text style={styles.label}>Event Type</Text>
        <View style={styles.chipRow}>
          {EVENT_TYPES.map((t) => (
            <Text key={t} style={[styles.chip, form.event_type === t && styles.chipActive]} onPress={() => set('event_type', t)}>{t}</Text>
          ))}
        </View>

        <Text style={styles.label}>Visibility</Text>
        <View style={styles.chipRow}>
          {VISIBILITY_OPTIONS.map((v) => (
            <Text key={v} style={[styles.chip, form.visibility === v && styles.chipActive]} onPress={() => set('visibility', v)}>{v.replace('_', ' ')}</Text>
          ))}
        </View>

        <Text style={styles.label}>Status</Text>
        <View style={styles.chipRow}>
          {['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'].map((s) => (
            <Text key={s} style={[styles.chip, form.status === s && styles.chipActive]} onPress={() => set('status', s)}>{s}</Text>
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
