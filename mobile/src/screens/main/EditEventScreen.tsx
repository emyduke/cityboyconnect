import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
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

  if (fetching) return <View className="flex-1 bg-background p-4"><Text className="text-2xl font-display-bold text-gray-900 mb-4">Loading...</Text></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <ScrollView className="flex-1 bg-background p-4" contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <Text className="text-2xl font-display-bold text-gray-900 mb-4">Edit Event</Text>

        <Input label="Title *" value={form.title} onChangeText={(v: string) => set('title', v)} />
        <Input label="Description" value={form.description} onChangeText={(v: string) => set('description', v)} multiline numberOfLines={4} />
        <Input label="Venue" value={form.venue_name} onChangeText={(v: string) => set('venue_name', v)} />
        <Input label="Location" value={form.location} onChangeText={(v: string) => set('location', v)} />

        <Text className="text-base font-body-medium text-gray-900 mt-4 mb-1">Event Type</Text>
        <View className="flex-row flex-wrap gap-1">
          {EVENT_TYPES.map((t) => (
            <Text
              key={t}
              className={`text-xs font-body px-2 py-1 rounded-full border overflow-hidden ${form.event_type === t ? 'bg-forest/10 border-forest text-forest' : 'bg-surface border-gray-200 text-gray-500'}`}
              onPress={() => set('event_type', t)}
            >{t}</Text>
          ))}
        </View>

        <Text className="text-base font-body-medium text-gray-900 mt-4 mb-1">Visibility</Text>
        <View className="flex-row flex-wrap gap-1">
          {VISIBILITY_OPTIONS.map((v) => (
            <Text
              key={v}
              className={`text-xs font-body px-2 py-1 rounded-full border overflow-hidden ${form.visibility === v ? 'bg-forest/10 border-forest text-forest' : 'bg-surface border-gray-200 text-gray-500'}`}
              onPress={() => set('visibility', v)}
            >{v.replace('_', ' ')}</Text>
          ))}
        </View>

        <Text className="text-base font-body-medium text-gray-900 mt-4 mb-1">Status</Text>
        <View className="flex-row flex-wrap gap-1">
          {['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'].map((s) => (
            <Text
              key={s}
              className={`text-xs font-body px-2 py-1 rounded-full border overflow-hidden ${form.status === s ? 'bg-forest/10 border-forest text-forest' : 'bg-surface border-gray-200 text-gray-500'}`}
              onPress={() => set('status', s)}
            >{s}</Text>
          ))}
        </View>

        {error ? <Text className="text-xs font-body text-danger mt-2">{error}</Text> : null}
        <Button onPress={handleSubmit} loading={loading} size="lg" className="mt-6">Save Changes</Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
