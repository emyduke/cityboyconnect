import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Badge from './ui/Badge';
import { colors, spacing, radius, typography, shadows } from '../theme';

interface EventCardProps {
  event: {
    id: number;
    title: string;
    event_type?: string;
    venue_name?: string;
    start_datetime?: string;
    attendance_count?: number;
  };
  onPress?: () => void;
}

export default function EventCard({ event, onPress }: EventCardProps) {
  const date = event.start_datetime
    ? new Date(event.start_datetime).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <Pressable onPress={onPress} style={[styles.card, shadows.sm]}>
      <View style={styles.dateBox}>
        <Text style={styles.dateDay}>{event.start_datetime ? new Date(event.start_datetime).getDate() : '--'}</Text>
        <Text style={styles.dateMonth}>{event.start_datetime ? new Date(event.start_datetime).toLocaleString('en', { month: 'short' }).toUpperCase() : ''}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
        {event.venue_name ? <Text style={styles.venue} numberOfLines={1}>📍 {event.venue_name}</Text> : null}
        <View style={styles.meta}>
          {event.event_type ? <Badge label={event.event_type} /> : null}
          <Text style={styles.attendance}>👥 {event.attendance_count ?? 0}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  dateBox: {
    width: 50,
    height: 50,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  dateDay: { ...typography.h3, color: colors.textInverse },
  dateMonth: { ...typography.caption, color: colors.accentLight, fontWeight: '700' },
  info: { flex: 1 },
  title: { ...typography.bodyMedium, color: colors.text },
  venue: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  attendance: { ...typography.caption, color: colors.textSecondary },
});
