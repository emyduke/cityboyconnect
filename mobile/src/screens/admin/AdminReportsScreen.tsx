import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        <View className="flex-1 p-4">
          <Skeleton variant="card" />
          <Skeleton variant="card" className="mt-2" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <View className="flex-1 p-4">
        <FlatList
          data={reports}
          keyExtractor={(item) => String(item.id || item.pk)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a472a" />}
          ListEmptyComponent={<EmptyState title="No reports" />}
          renderItem={({ item }) => {
            const pk = item.id || item.pk;
            const status = item.status || 'SUBMITTED';
            return (
              <View className="bg-surface rounded-lg p-4 mb-2 shadow-sm">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-base font-body-medium text-gray-900">Report #{pk}</Text>
                    <Text className="text-xs font-body text-gray-500 mt-0.5">{item.author_name || ''} · {item.report_period || ''}</Text>
                  </View>
                  <Badge label={status} variant={statusVariant(status)} />
                </View>
                <View className="flex-row gap-2 mt-2">
                  {status === 'SUBMITTED' && (
                    <Button size="sm" onPress={() => handleAction(pk, 'acknowledge')} loading={actionLoading === pk} className="flex-1">
                      Acknowledge
                    </Button>
                  )}
                  {(status === 'SUBMITTED' || status === 'ACKNOWLEDGED') && (
                    <Button size="sm" variant="secondary" onPress={() => handleAction(pk, 'review')} loading={actionLoading === pk} className="flex-1">
                      Review
                    </Button>
                  )}
                </View>
              </View>
            );
          }}
          contentContainerClassName="pb-12"
        />
      </View>
    </SafeAreaView>
  );
}

