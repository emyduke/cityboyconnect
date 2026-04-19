import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <ScrollView className="flex-1 bg-background p-4" contentContainerClassName="pb-12" keyboardShouldPersistTaps="handled">
        <Text className="font-display-bold text-2xl text-gray-900 mb-4">Create Announcement</Text>

        <Input label="Title *" value={form.title} onChangeText={(v: string) => set('title', v)} placeholder="Announcement title" />
        <Input label="Body *" value={form.body} onChangeText={(v: string) => set('body', v)} placeholder="Write the announcement content..." multiline numberOfLines={6} />

        <Text className="font-body-medium text-base text-gray-900 mt-4 mb-1">Priority</Text>
        <View className="flex-row flex-wrap gap-1">
          {PRIORITY_OPTIONS.map((p) => (
            <Text key={p} className={`font-body text-xs px-2 py-1 rounded-full border overflow-hidden ${form.priority === p ? 'bg-forest/10 border-forest text-forest' : 'bg-surface border-gray-200 text-gray-500'}`} onPress={() => set('priority', p)}>{p}</Text>
          ))}
        </View>

        <Text className="font-body-medium text-base text-gray-900 mt-4 mb-1">Scope</Text>
        <View className="flex-row flex-wrap gap-1">
          {SCOPE_OPTIONS.map((s) => (
            <Text key={s} className={`font-body text-xs px-2 py-1 rounded-full border overflow-hidden ${form.scope === s ? 'bg-forest/10 border-forest text-forest' : 'bg-surface border-gray-200 text-gray-500'}`} onPress={() => set('scope', s)}>{s}</Text>
          ))}
        </View>

        {error ? <Text className="font-body text-xs text-danger mt-2">{error}</Text> : null}
        <Button onPress={handleSubmit} loading={loading} size="lg" className="mt-6">Create Announcement</Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

