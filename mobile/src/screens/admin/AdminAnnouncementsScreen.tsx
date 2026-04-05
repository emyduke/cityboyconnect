import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { adminApi } from '../../api/admin';
import { useToastStore } from '../../store/toastStore';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';

export default function AdminAnnouncementsScreen() {
  const toast = useToastStore((s) => s.show);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await adminApi.getAnnouncements();
      setItems(res.data?.results || res.results || res.data || []);
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const togglePublish = async (pk: number, isPublished: boolean) => {
    setActionLoading(pk);
    try {
      if (isPublished) {
        await adminApi.unpublishAnnouncement(pk);
        toast('Unpublished', 'success');
      } else {
        await adminApi.publishAnnouncement(pk);
        toast('Published', 'success');
      }
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed', 'error');
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.container}>
          <Skeleton variant="card" />
          <Skeleton variant="card" style={{ marginTop: spacing.sm }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id || item.pk)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState title="No announcements" />}
          renderItem={({ item }) => {
            const pk = item.id || item.pk;
            const isPublished = item.is_published || item.status === 'PUBLISHED';
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                  <Badge label={isPublished ? 'Published' : 'Draft'} variant={isPublished ? 'success' : 'warning'} />
                </View>
                <Text style={styles.meta}>{item.priority || 'NORMAL'} · {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
                <Button
                  size="sm"
                  variant={isPublished ? 'secondary' : 'primary'}
                  onPress={() => togglePublish(pk, isPublished)}
                  loading={actionLoading === pk}
                  style={{ marginTop: spacing.sm }}
                >
                  {isPublished ? 'Unpublish' : 'Publish'}
                </Button>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  title: { ...typography.bodyMedium, color: colors.text, flex: 1 },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
