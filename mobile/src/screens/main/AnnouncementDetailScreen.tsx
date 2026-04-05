import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme';
import { getAnnouncement, markAnnouncementRead } from '../../api/announcements';
import { unwrap } from '../../api/client';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import { MoreStackParamList } from '../../navigation/types';

type Route = RouteProp<MoreStackParamList, 'AnnouncementDetail'>;

export default function AnnouncementDetailScreen() {
  const { params } = useRoute<Route>();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setItem(unwrap(await getAnnouncement(params.id)));
        markAnnouncementRead(params.id).catch(() => {});
      } catch { /* handled */ }
      setLoading(false);
    })();
  }, [params.id]);

  if (loading) return <View style={styles.container}><Skeleton variant="text" /><Skeleton variant="card" style={{ marginTop: spacing.md }} /></View>;
  if (!item) return <View style={styles.container}><Text style={styles.error}>Not found</Text></View>;

  const priorityVariant = item.priority === 'URGENT' ? 'danger' : item.priority === 'IMPORTANT' ? 'warning' : 'default';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <Text style={styles.title}>{item.title}</Text>
      <View style={styles.meta}>
        {item.priority && item.priority !== 'NORMAL' && <Badge label={item.priority} variant={priorityVariant} />}
        <Text style={styles.date}>{item.published_at ? new Date(item.published_at).toLocaleDateString() : ''}</Text>
      </View>
      <Text style={styles.body}>{item.body}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  title: { ...typography.h2, color: colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs, marginBottom: spacing.lg },
  date: { ...typography.caption, color: colors.textSecondary },
  body: { ...typography.body, color: colors.text, lineHeight: 24 },
  error: { ...typography.body, color: colors.danger, textAlign: 'center', marginTop: spacing.xxl },
});
