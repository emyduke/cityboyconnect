import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Badge from './ui/Badge';
import { colors, spacing, radius, typography, shadows } from '../theme';

interface AnnouncementCardProps {
  announcement: {
    id: number;
    title: string;
    body?: string;
    priority?: string;
    published_at?: string;
    is_read?: boolean;
  };
  onPress?: () => void;
}

export default function AnnouncementCard({ announcement, onPress }: AnnouncementCardProps) {
  const priorityVariant = announcement.priority === 'URGENT' ? 'danger'
    : announcement.priority === 'IMPORTANT' ? 'warning' : 'default';

  return (
    <Pressable onPress={onPress} style={[styles.card, shadows.sm, !announcement.is_read && styles.unread]}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{announcement.title}</Text>
        {announcement.priority && announcement.priority !== 'NORMAL' && (
          <Badge label={announcement.priority} variant={priorityVariant} />
        )}
      </View>
      {announcement.body ? (
        <Text style={styles.body} numberOfLines={2}>{announcement.body}</Text>
      ) : null}
      {announcement.published_at ? (
        <Text style={styles.date}>
          {new Date(announcement.published_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
        </Text>
      ) : null}
      {!announcement.is_read && <View style={styles.dot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    position: 'relative',
  },
  unread: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  title: { ...typography.bodyMedium, color: colors.text, flex: 1 },
  body: { ...typography.bodySm, color: colors.textSecondary, marginTop: spacing.xs },
  date: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.xs },
  dot: { position: 'absolute', top: spacing.md, right: spacing.md, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
});
