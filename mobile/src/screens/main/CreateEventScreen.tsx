import React, { useState } from 'react';
import { Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createEvent } from '../../api/events';
import { useToastStore } from '../../store/toastStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function CreateEventScreen() {
  const navigation = useNavigation();
  const toast = useToastStore((s) => s.show);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [eventType, setEventType] = useState('MEETING');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    setLoading(true); setError('');
    try {
      await createEvent({ title, description, venue_name: venue, event_type: eventType, start_datetime: new Date().toISOString() });
      toast('Event created!', 'success');
      navigation.goBack();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create event');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <ScrollView className="flex-1 bg-background p-4" contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <Input label="Event Title" value={title} onChangeText={setTitle} placeholder="e.g. Ward Meeting" />
        <Input label="Description" value={description} onChangeText={setDescription} placeholder="What's this event about?" multiline numberOfLines={4} />
        <Input label="Venue" value={venue} onChangeText={setVenue} placeholder="e.g. Town Hall, Ikeja" />
        <Input label="Event Type" value={eventType} onChangeText={setEventType} placeholder="RALLY, MEETING, TRAINING, etc." />
        {error ? <Text className="text-xs font-body text-danger mb-2">{error}</Text> : null}
        <Button onPress={handleSubmit} loading={loading} size="lg" className="mt-4">Create Event</Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
