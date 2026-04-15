import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme';
import { createJobListing, updateJobListing, getJobDetail, getSkills } from '../../api/opportunities';
import { unwrap } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP', 'VOLUNTEER'];
const WORK_MODES = ['ONSITE', 'REMOTE', 'HYBRID'];
const EXP_LEVELS = ['ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE'];

export default function CreateJobScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const toast = useToastStore((s) => s.show);
  const editId = route.params?.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', company_name: '', description: '', requirements: '', location: '',
    job_type: 'FULL_TIME', work_mode: 'ONSITE', experience_level: 'MID',
    salary_min: '', salary_max: '', hide_salary: false,
    application_deadline: '', application_url: '', status: 'DRAFT',
  });

  useEffect(() => {
    if (editId) {
      (async () => {
        try {
          const job = unwrap(await getJobDetail(editId));
          setForm({
            title: job.title || '', company_name: job.company_name || '',
            description: job.description || '', requirements: job.requirements || '',
            location: job.location || '', job_type: job.job_type || 'FULL_TIME',
            work_mode: job.work_mode || 'ONSITE', experience_level: job.experience_level || 'MID',
            salary_min: job.salary_min?.toString() || '', salary_max: job.salary_max?.toString() || '',
            hide_salary: job.hide_salary || false, application_deadline: job.application_deadline || '',
            application_url: job.application_url || '', status: job.status || 'DRAFT',
          });
        } catch { toast('Failed to load job', 'error'); }
      })();
    }
  }, [editId]);

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (publish = false) => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.company_name.trim()) { setError('Company name is required'); return; }
    setLoading(true); setError('');
    const data: any = { ...form };
    if (publish) data.status = 'ACTIVE';
    if (data.salary_min) data.salary_min = Number(data.salary_min);
    else delete data.salary_min;
    if (data.salary_max) data.salary_max = Number(data.salary_max);
    else delete data.salary_max;
    if (!data.application_deadline) delete data.application_deadline;
    if (!data.application_url) delete data.application_url;

    try {
      if (editId) await updateJobListing(editId, data);
      else await createJobListing(data);
      toast(editId ? 'Job updated!' : 'Job created!', 'success');
      navigation.goBack();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>{editId ? 'Edit Job' : 'Post a Job'}</Text>

        <Input label="Job Title *" value={form.title} onChangeText={(v: string) => set('title', v)} placeholder="e.g. Software Engineer" />
        <Input label="Company Name *" value={form.company_name} onChangeText={(v: string) => set('company_name', v)} placeholder="Company or organization" />
        <Input label="Location" value={form.location} onChangeText={(v: string) => set('location', v)} placeholder="e.g. Lagos, Nigeria" />
        <Input label="Description" value={form.description} onChangeText={(v: string) => set('description', v)} placeholder="Job description..." multiline numberOfLines={5} />
        <Input label="Requirements" value={form.requirements} onChangeText={(v: string) => set('requirements', v)} placeholder="Requirements..." multiline numberOfLines={4} />

        <Text style={styles.label}>Job Type</Text>
        <View style={styles.chipRow}>
          {JOB_TYPES.map((t) => (
            <Text key={t} style={[styles.chip, form.job_type === t && styles.chipActive]} onPress={() => set('job_type', t)}>
              {t.replace('_', ' ')}
            </Text>
          ))}
        </View>

        <Text style={styles.label}>Work Mode</Text>
        <View style={styles.chipRow}>
          {WORK_MODES.map((m) => (
            <Text key={m} style={[styles.chip, form.work_mode === m && styles.chipActive]} onPress={() => set('work_mode', m)}>
              {m}
            </Text>
          ))}
        </View>

        <Text style={styles.label}>Experience Level</Text>
        <View style={styles.chipRow}>
          {EXP_LEVELS.map((e) => (
            <Text key={e} style={[styles.chip, form.experience_level === e && styles.chipActive]} onPress={() => set('experience_level', e)}>
              {e}
            </Text>
          ))}
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}><Input label="Min Salary (₦)" value={form.salary_min} onChangeText={(v: string) => set('salary_min', v)} keyboardType="numeric" /></View>
          <View style={{ width: spacing.sm }} />
          <View style={{ flex: 1 }}><Input label="Max Salary (₦)" value={form.salary_max} onChangeText={(v: string) => set('salary_max', v)} keyboardType="numeric" /></View>
        </View>

        <Input label="Application URL (optional)" value={form.application_url} onChangeText={(v: string) => set('application_url', v)} placeholder="https://..." keyboardType="url" />
        <Input label="Deadline (YYYY-MM-DD)" value={form.application_deadline} onChangeText={(v: string) => set('application_deadline', v)} placeholder="2025-12-31" />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.btnRow}>
          <Button variant="outline" onPress={() => handleSubmit(false)} loading={loading} style={{ flex: 1 }}>Save Draft</Button>
          <View style={{ width: spacing.sm }} />
          <Button onPress={() => handleSubmit(true)} loading={loading} style={{ flex: 1 }}>Publish</Button>
        </View>
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
  row: { flexDirection: 'row', marginTop: spacing.sm },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
  btnRow: { flexDirection: 'row', marginTop: spacing.lg },
});
