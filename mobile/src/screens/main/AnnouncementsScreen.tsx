import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Pressable, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography, shadows } from '../../theme';
import { getAnnouncements } from '../../api/announcements';
import { unwrap } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import AnnouncementCard from '../../components/AnnouncementCard';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';

type PriorityFilter = 'ALL' | 'URGENT' | 'IMPORTANT' | 'NORMAL';

const PRIORITY_FILTERS: { key: PriorityFilter; label: string; color: string }[] = [
  { key: 'ALL', label: 'All', color: colors.primary },
  { key: 'URGENT', label: '🔴 Urgent', color: colors.danger },
  { key: 'IMPORTANT', label: '🟡 Important', color: colors.accent },
  { key: 'NORMAL', label: '🟢 Normal', color: '#16a34a' },
];

export default function AnnouncementsScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const canCreate = user?.role && ['SUPER_ADMIN','NATIONAL_OFFICER','STATE_DIRECTOR','LGA_COORDINATOR','WARD_COORDINATOR'].includes(user.role);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<PriorityFilter>('ALL');

  const fetchAnnouncements = useCallback(async () => {
    try {
      const params: Record<string, any> = {};
      if (filter !== 'ALL') params.priority = filter;
      const res = await getAnnouncements(params);
      const data = unwrap(res);
      setItems(Array.isArray(data) ? data : data?.results || []);
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, [filter]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const priorityColors: Record<string, string> = {
    URGENT: colors.danger,
    IMPORTANT: colors.accent,
    NORMAL: '#16a34a',
  };

  if (loading) {
    return <View style={styles.container}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="card" style={{ marginBottom: spacing.sm }} />)}</View>;
  }

  return (
    <View style={styles.container}>
      {/* Create button for coordinators */}
      {canCreate && (
        <Pressable style={styles.createBtn} onPress={() => navigation.navigate('CreateAnnouncement')}>
          <Text style={styles.createBtnText}>+ Create Announcement</Text>
        </Pressable>
      )}
      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {PRIORITY_FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.filterTab, filter === f.key && { backgroundColor: f.color + '15', borderColor: f.color }]}
            onPress={() => { setFilter(f.key); setLoading(true); }}
          >
            <Text style={[styles.filterLabel, filter === f.key && { color: f.color, fontFamily: 'PlusJakartaSans-SemiBold' }]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={[styles.announcementWrap, { borderLeftColor: priorityColors[item.priority] || colors.border }]}>
            <AnnouncementCard announcement={item} onPress={() => navigation.navigate('AnnouncementDetail', { id: item.id })} />
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAnnouncements(); }} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState icon="📢" title="No Announcements" description="Nothing to report yet" />}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  createBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center', marginBottom: spacing.sm },
  createBtnText: { ...typography.button, color: colors.textInverse },
  filterRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  filterTab: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterLabel: { ...typography.caption, color: colors.textSecondary },
  announcementWrap: {
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
});
