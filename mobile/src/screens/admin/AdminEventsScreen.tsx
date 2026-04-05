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

export default function AdminEventsScreen() {
  const toast = useToastStore((s) => s.show);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await adminApi.getEvents();
      setEvents(res.data?.results || res.results || res.data || []);
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleCancel = async (pk: number) => {
    setActionLoading(pk);
    try {
      await adminApi.cancelEvent(pk);
      toast('Event cancelled', 'success');
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
          data={events}
          keyExtractor={(item) => String(item.id || item.pk)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState title="No events" />}
          renderItem={({ item }) => {
            const pk = item.id || item.pk;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                  <Badge label={item.status || 'active'} variant={item.status === 'CANCELLED' ? 'danger' : 'success'} />
                </View>
                <Text style={styles.meta}>
                  {item.venue || ''}{item.start_datetime ? ` · ${new Date(item.start_datetime).toLocaleDateString()}` : ''}
                </Text>
                {item.status !== 'CANCELLED' && (
                  <Button size="sm" variant="danger" onPress={() => handleCancel(pk)} loading={actionLoading === pk} style={{ marginTop: spacing.sm }}>
                    Cancel Event
                  </Button>
                )}
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.bodyMedium, color: colors.text, flex: 1, marginRight: spacing.sm },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
