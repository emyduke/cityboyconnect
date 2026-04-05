import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../../theme';
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

  if (loading) {
    return (
      <View style={styles.container}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="card" style={{ marginBottom: spacing.sm }} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <EventCard event={item} onPress={() => navigation.navigate('EventDetail', { id: item.id })} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEvents(); }} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState icon="📅" title="No Events" description="Check back later for upcoming events" />}
        ListHeaderComponent={
          <Button variant="secondary" size="sm" onPress={() => navigation.navigate('CreateEvent')} style={{ marginBottom: spacing.md, alignSelf: 'flex-end' }}>
            + Create Event
          </Button>
        }
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
});
