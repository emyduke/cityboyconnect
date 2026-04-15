import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { colors, spacing, typography, radius } from '../../theme';
import { getEvent, attendEvent } from '../../api/events';
import { unwrap } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import { EventsStackParamList } from '../../navigation/types';

type Route = RouteProp<EventsStackParamList, 'EventDetail'>;

export default function EventDetailScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<any>();
  const toast = useToastStore((s) => s.show);
  const user = useAuthStore((s) => s.user);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [attending, setAttending] = useState(false);

  useEffect(() => {
    (async () => {
      try { setEvent(unwrap(await getEvent(params.id))); } catch { /* handled */ }
      setLoading(false);
    })();
  }, [params.id]);

  const handleAttend = async () => {
    setAttending(true);
    try {
      await attendEvent(params.id);
      toast('You\'re attending! 🎉', 'success');
      setEvent((prev: any) => prev ? { ...prev, is_attending: true } : prev);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to RSVP', 'error');
    } finally { setAttending(false); }
  };

  if (loading) return <View style={styles.container}><Skeleton variant="card" /><Skeleton variant="text" style={{ marginTop: spacing.md }} /></View>;
  if (!event) return <View style={styles.container}><Text style={styles.error}>Event not found</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <Text style={styles.title}>{event.title}</Text>
      <View style={styles.row}>
        <Badge label={event.event_type || 'Event'} />
        <Badge label={event.status || 'UPCOMING'} variant={event.status === 'COMPLETED' ? 'default' : 'success'} />
      </View>
      <Card style={{ marginTop: spacing.md }}>
        <InfoRow icon="📍" value={event.venue_name} />
        <InfoRow icon="📅" value={event.start_datetime ? new Date(event.start_datetime).toLocaleString() : ''} />
        <InfoRow icon="👥" value={`${event.attendance_count ?? 0} attending`} />
      </Card>
      {event.description ? (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.desc}>{event.description}</Text>
        </Card>
      ) : null}
      {!event.is_attending && (
        <Button onPress={handleAttend} loading={attending} size="lg" style={{ marginTop: spacing.lg }}>
          Check In
        </Button>
      )}
      {event.is_attending && (
        <View style={styles.attendingBadge}>
          <Text style={styles.attendingText}>✓ Checked In</Text>
        </View>
      )}
      {(user?.id === event.created_by || user?.id === event.created_by_id || ['SUPER_ADMIN','NATIONAL_OFFICER','STATE_DIRECTOR','LGA_COORDINATOR','WARD_COORDINATOR'].includes(user?.role || '')) && (
        <Pressable style={styles.editBtn} onPress={() => navigation.navigate('MoreTab', { screen: 'EditEvent', params: { id: event.id } })}>
          <Text style={styles.editBtnText}>✏️ Edit Event</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function InfoRow({ icon, value }: { icon: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text>{icon}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  title: { ...typography.h2, color: colors.text },
  row: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  desc: { ...typography.body, color: colors.text },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  infoValue: { ...typography.body, color: colors.text },
  attendingBadge: { backgroundColor: colors.successLight, borderRadius: 12, padding: spacing.md, marginTop: spacing.lg, alignItems: 'center' },
  attendingText: { ...typography.bodyMedium, color: colors.success },
  editBtn: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.primary + '30' },
  editBtnText: { ...typography.button, color: colors.primary },
  error: { ...typography.body, color: colors.danger, textAlign: 'center', marginTop: spacing.xxl },
});
