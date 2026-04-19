import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <ScrollView className="flex-1 bg-background p-4" contentContainerClassName="pb-12" keyboardShouldPersistTaps="handled">
        <Text className="font-display-bold text-2xl text-gray-900 mb-4">{editId ? 'Edit Job' : 'Post a Job'}</Text>

        <Input label="Job Title *" value={form.title} onChangeText={(v: string) => set('title', v)} placeholder="e.g. Software Engineer" />
        <Input label="Company Name *" value={form.company_name} onChangeText={(v: string) => set('company_name', v)} placeholder="Company or organization" />
        <Input label="Location" value={form.location} onChangeText={(v: string) => set('location', v)} placeholder="e.g. Lagos, Nigeria" />
        <Input label="Description" value={form.description} onChangeText={(v: string) => set('description', v)} placeholder="Job description..." multiline numberOfLines={5} />
        <Input label="Requirements" value={form.requirements} onChangeText={(v: string) => set('requirements', v)} placeholder="Requirements..." multiline numberOfLines={4} />

        <Text className="font-body-medium text-base text-gray-900 mt-4 mb-1">Job Type</Text>
        <View className="flex-row flex-wrap gap-1">
          {JOB_TYPES.map((t) => (
            <Text key={t} className={`font-body text-xs px-2 py-1 rounded-full border overflow-hidden ${form.job_type === t ? 'bg-forest/10 border-forest text-forest' : 'bg-surface border-gray-200 text-gray-500'}`} onPress={() => set('job_type', t)}>
              {t.replace('_', ' ')}
            </Text>
          ))}
        </View>

        <Text className="font-body-medium text-base text-gray-900 mt-4 mb-1">Work Mode</Text>
        <View className="flex-row flex-wrap gap-1">
          {WORK_MODES.map((m) => (
            <Text key={m} className={`font-body text-xs px-2 py-1 rounded-full border overflow-hidden ${form.work_mode === m ? 'bg-forest/10 border-forest text-forest' : 'bg-surface border-gray-200 text-gray-500'}`} onPress={() => set('work_mode', m)}>
              {m}
            </Text>
          ))}
        </View>

        <Text className="font-body-medium text-base text-gray-900 mt-4 mb-1">Experience Level</Text>
        <View className="flex-row flex-wrap gap-1">
          {EXP_LEVELS.map((e) => (
            <Text key={e} className={`font-body text-xs px-2 py-1 rounded-full border overflow-hidden ${form.experience_level === e ? 'bg-forest/10 border-forest text-forest' : 'bg-surface border-gray-200 text-gray-500'}`} onPress={() => set('experience_level', e)}>
              {e}
            </Text>
          ))}
        </View>

        <View className="flex-row mt-2">
          <View className="flex-1"><Input label="Min Salary (₦)" value={form.salary_min} onChangeText={(v: string) => set('salary_min', v)} keyboardType="numeric" /></View>
          <View className="w-2" />
          <View className="flex-1"><Input label="Max Salary (₦)" value={form.salary_max} onChangeText={(v: string) => set('salary_max', v)} keyboardType="numeric" /></View>
        </View>

        <Input label="Application URL (optional)" value={form.application_url} onChangeText={(v: string) => set('application_url', v)} placeholder="https://..." keyboardType="url" />
        <Input label="Deadline (YYYY-MM-DD)" value={form.application_deadline} onChangeText={(v: string) => set('application_deadline', v)} placeholder="2025-12-31" />

        {error ? <Text className="font-body text-xs text-danger mt-2">{error}</Text> : null}

        <View className="flex-row mt-6">
          <Button variant="outline" onPress={() => handleSubmit(false)} loading={loading} style={{ flex: 1 }}>Save Draft</Button>
          <View className="w-2" />
          <Button onPress={() => handleSubmit(true)} loading={loading} style={{ flex: 1 }}>Publish</Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

