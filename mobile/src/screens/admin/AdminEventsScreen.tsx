import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
          data={events}
          keyExtractor={(item) => String(item.id || item.pk)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a472a" />}
          ListEmptyComponent={<EmptyState title="No events" />}
          renderItem={({ item }) => {
            const pk = item.id || item.pk;
            return (
              <View className="bg-surface rounded-lg p-4 mb-2 shadow-sm">
                <View className="flex-row justify-between items-center">
                  <Text className="text-base font-body-medium text-gray-900 flex-1 mr-2" numberOfLines={1}>{item.title}</Text>
                  <Badge label={item.status || 'active'} variant={item.status === 'CANCELLED' ? 'danger' : 'success'} />
                </View>
                <Text className="text-xs font-body text-gray-500 mt-0.5">
                  {item.venue || ''}{item.start_datetime ? ` · ${new Date(item.start_datetime).toLocaleDateString()}` : ''}
                </Text>
                {item.status !== 'CANCELLED' && (
                  <Button size="sm" variant="danger" onPress={() => handleCancel(pk)} loading={actionLoading === pk} className="mt-2">
                    Cancel Event
                  </Button>
                )}
              </View>
            );
          }}
          contentContainerClassName="pb-12"
        />
      </View>
    </SafeAreaView>
  );
}

