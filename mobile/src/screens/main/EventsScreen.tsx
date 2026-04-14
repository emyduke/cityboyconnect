import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Text, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography, shadows } from '../../theme';
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
    RALLY: colors.danger,
    TOWN_HALL: colors.primary,
    TRAINING: colors.accent,
    MEETING: '#2563eb',
    OUTREACH: '#16a34a',
    OTHER: colors.textTertiary,
  };

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
            <Button variant="primary" size="sm" onPress={() => navigation.navigate('CreateEvent')} style={styles.createBtn}>
              + Create Event
            </Button>

            {/* Upcoming horizontal scroll */}
            {upcoming.length > 0 && (
              <View style={styles.upcomingSection}>
                <Text style={styles.sectionTitle}>📅 Upcoming</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.upcomingScroll}>
                  {upcoming.map((event) => (
                    <Pressable
                      key={event.id}
                      style={styles.upcomingCard}
                      onPress={() => navigation.navigate('EventDetail', { id: event.id })}
                    >
                      <View style={[styles.typeBadge, { backgroundColor: (typeColors[event.event_type] || colors.textTertiary) + '20' }]}>
                        <Text style={[styles.typeBadgeText, { color: typeColors[event.event_type] || colors.textTertiary }]}>
                          {(event.event_type || 'Event').replace(/_/g, ' ')}
                        </Text>
                      </View>
                      <Text style={styles.upcomingTitle} numberOfLines={2}>{event.title}</Text>
                      <Text style={styles.upcomingDate}>
                        {new Date(event.start_datetime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                      <Text style={styles.upcomingVenue} numberOfLines={1}>📍 {event.venue_name || 'TBD'}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Past events header */}
            {past.length > 0 && (
              <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Past Events</Text>
            )}
          </View>
        }
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  createBtn: { alignSelf: 'flex-end', marginBottom: spacing.md },
  sectionTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.sm },
  upcomingSection: { marginBottom: spacing.sm },
  upcomingScroll: { gap: spacing.sm, paddingRight: spacing.md },
  upcomingCard: {
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    ...shadows.sm,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginBottom: spacing.xs,
  },
  typeBadgeText: { ...typography.caption, fontFamily: 'PlusJakartaSans-SemiBold' },
  upcomingTitle: { ...typography.bodyMedium, color: colors.text, marginBottom: spacing.xs },
  upcomingDate: { ...typography.caption, color: colors.primary, fontFamily: 'PlusJakartaSans-SemiBold' },
  upcomingVenue: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
});
