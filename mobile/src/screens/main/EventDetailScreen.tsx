import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
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

  if (loading) return <View className="flex-1 bg-background p-4"><Skeleton variant="card" /><Skeleton variant="text" className="mt-4" /></View>;
  if (!event) return <View className="flex-1 bg-background p-4"><Text className="text-base font-body text-danger text-center mt-12">Event not found</Text></View>;

  return (
    <ScrollView className="flex-1 bg-background p-4" contentContainerStyle={{ paddingBottom: 48 }}>
      <Text className="text-2xl font-display-bold text-gray-900">{event.title}</Text>
      <View className="flex-row gap-1 mt-1">
        <Badge label={event.event_type || 'Event'} />
        <Badge label={event.status || 'UPCOMING'} variant={event.status === 'COMPLETED' ? 'default' : 'success'} />
      </View>
      <Card className="mt-4">
        <InfoRow icon="📍" value={event.venue_name} />
        <InfoRow icon="📅" value={event.start_datetime ? new Date(event.start_datetime).toLocaleString() : ''} />
        <InfoRow icon="👥" value={`${event.attendance_count ?? 0} attending`} />
      </Card>
      {event.description ? (
        <Card className="mt-4">
          <Text className="text-base font-body text-gray-900">{event.description}</Text>
        </Card>
      ) : null}
      {!event.is_attending && (
        <Button onPress={handleAttend} loading={attending} size="lg" className="mt-6">
          Check In
        </Button>
      )}
      {event.is_attending && (
        <View className="bg-success/10 rounded-xl p-4 mt-6 items-center">
          <Text className="text-base font-body-medium text-success">✓ Checked In</Text>
        </View>
      )}
      {(user?.id === event.created_by || user?.id === event.created_by_id || ['SUPER_ADMIN','NATIONAL_OFFICER','STATE_DIRECTOR','LGA_COORDINATOR','WARD_COORDINATOR'].includes(user?.role || '')) && (
        <Pressable className="bg-surface rounded-lg p-4 mt-2 items-center border border-forest/20" onPress={() => navigation.navigate('MoreTab', { screen: 'EditEvent', params: { id: event.id } })}>
          <Text className="text-base font-body-semibold text-forest">✏️ Edit Event</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function InfoRow({ icon, value }: { icon: string; value?: string }) {
  if (!value) return null;
  return (
    <View className="flex-row items-center gap-2 py-1">
      <Text>{icon}</Text>
      <Text className="text-base font-body text-gray-900">{value}</Text>
    </View>
  );
}
