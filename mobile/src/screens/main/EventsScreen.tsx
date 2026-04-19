import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, Text, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { getEvents } from '../../api/events';
import { unwrap } from '../../api/client';
import EventCard from '../../components/EventCard';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/ui/Button';

export default function EventsScreen() {
  const navigation = useNavigation<any>();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await getEvents();
      const data = unwrap(res);
      setEvents(Array.isArray(data) ? data : data?.results || []);
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const upcoming = events.filter((e) => e.status === 'UPCOMING' || new Date(e.start_datetime) > new Date());
  const past = events.filter((e) => e.status === 'COMPLETED' || (e.status !== 'UPCOMING' && new Date(e.start_datetime) <= new Date()));

  const typeColors: Record<string, string> = {
    RALLY: '#dc2626',
    TOWN_HALL: '#1a472a',
    TRAINING: '#d4a017',
    MEETING: '#2563eb',
    OUTREACH: '#16a34a',
    OTHER: '#9ca3af',
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="card" className="mb-2" />
        ))}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background p-4">
      <FlatList
        data={past}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <EventCard event={item} onPress={() => navigation.navigate('EventDetail', { id: item.id })} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEvents(); }} tintColor={colors.primary} />}
        ListEmptyComponent={events.length === 0 ? <EmptyState icon="📅" title="No Events" description="Check back later for upcoming events" /> : null}
        ListHeaderComponent={
          <View>
            {/* Create button */}
            <Button variant="primary" size="sm" onPress={() => navigation.navigate('CreateEvent')} className="self-end mb-4">
              + Create Event
            </Button>

            {/* Upcoming horizontal scroll */}
            {upcoming.length > 0 && (
              <View className="mb-2">
                <Text className="text-lg font-display-semibold text-gray-900 mb-2">📅 Upcoming</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
                  {upcoming.map((event) => (
                    <Pressable
                      key={event.id}
                      className="w-[220px] bg-surface rounded-xl p-4 shadow-sm"
                      style={{ borderLeftWidth: 3, borderLeftColor: '#1a472a' }}
                      onPress={() => navigation.navigate('EventDetail', { id: event.id })}
                    >
                      <View
                        className="self-start px-2 py-0.5 rounded-full mb-1"
                        style={{ backgroundColor: (typeColors[event.event_type] || '#9ca3af') + '20' }}
                      >
                        <Text
                          className="text-xs font-body-semibold"
                          style={{ color: typeColors[event.event_type] || '#9ca3af' }}
                        >
                          {(event.event_type || 'Event').replace(/_/g, ' ')}
                        </Text>
                      </View>
                      <Text className="text-base font-body-medium text-gray-900 mb-1" numberOfLines={2}>{event.title}</Text>
                      <Text className="text-xs font-body-semibold text-forest">
                        {new Date(event.start_datetime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                      <Text className="text-xs font-body text-gray-400 mt-0.5" numberOfLines={1}>📍 {event.venue_name || 'TBD'}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Past events header */}
            {past.length > 0 && (
              <Text className="text-lg font-display-semibold text-gray-900 mb-2 mt-4">Past Events</Text>
            )}
          </View>
        }
        contentContainerStyle={{ paddingBottom: 48 }}
      />
    </View>
  );
}
