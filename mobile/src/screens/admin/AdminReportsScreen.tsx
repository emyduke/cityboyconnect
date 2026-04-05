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

export default function AdminReportsScreen() {
  const toast = useToastStore((s) => s.show);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await adminApi.getReports();
      setReports(res.data?.results || res.results || res.data || []);
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleAction = async (pk: number, action: 'acknowledge' | 'review') => {
    setActionLoading(pk);
    try {
      if (action === 'acknowledge') await adminApi.acknowledgeReport(pk);
      else await adminApi.reviewReport(pk);
      toast(`Report ${action}d`, 'success');
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed', 'error');
    }
    setActionLoading(null);
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'warning';
      case 'ACKNOWLEDGED': return 'info';
      case 'REVIEWED': return 'success';
      default: return 'default';
    }
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
          data={reports}
          keyExtractor={(item) => String(item.id || item.pk)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState title="No reports" />}
          renderItem={({ item }) => {
            const pk = item.id || item.pk;
            const status = item.status || 'SUBMITTED';
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Report #{pk}</Text>
                    <Text style={styles.meta}>{item.author_name || ''} · {item.report_period || ''}</Text>
                  </View>
                  <Badge label={status} variant={statusVariant(status)} />
                </View>
                <View style={styles.actions}>
                  {status === 'SUBMITTED' && (
                    <Button size="sm" onPress={() => handleAction(pk, 'acknowledge')} loading={actionLoading === pk} style={{ flex: 1 }}>
                      Acknowledge
                    </Button>
                  )}
                  {(status === 'SUBMITTED' || status === 'ACKNOWLEDGED') && (
                    <Button size="sm" variant="secondary" onPress={() => handleAction(pk, 'review')} loading={actionLoading === pk} style={{ flex: 1 }}>
                      Review
                    </Button>
                  )}
                </View>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { ...typography.bodyMedium, color: colors.text },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
