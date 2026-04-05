import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme';
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
        <Input label="Event Title" value={title} onChangeText={setTitle} placeholder="e.g. Ward Meeting" />
        <Input label="Description" value={description} onChangeText={setDescription} placeholder="What's this event about?" multiline numberOfLines={4} />
        <Input label="Venue" value={venue} onChangeText={setVenue} placeholder="e.g. Town Hall, Ikeja" />
        <Input label="Event Type" value={eventType} onChangeText={setEventType} placeholder="RALLY, MEETING, TRAINING, etc." />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button onPress={handleSubmit} loading={loading} size="lg" style={{ marginTop: spacing.md }}>Create Event</Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  error: { ...typography.caption, color: colors.danger, marginBottom: spacing.sm },
});
