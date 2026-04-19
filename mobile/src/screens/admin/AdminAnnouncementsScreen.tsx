import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
          data={items}
          keyExtractor={(item) => String(item.id || item.pk)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a472a" />}
          ListEmptyComponent={<EmptyState title="No announcements" />}
          renderItem={({ item }) => {
            const pk = item.id || item.pk;
            const isPublished = item.is_published || item.status === 'PUBLISHED';
            return (
              <View className="bg-surface rounded-lg p-4 mb-2 shadow-sm">
                <View className="flex-row justify-between items-start gap-2">
                  <Text className="text-base font-body-medium text-gray-900 flex-1" numberOfLines={2}>{item.title}</Text>
                  <Badge label={isPublished ? 'Published' : 'Draft'} variant={isPublished ? 'success' : 'warning'} />
                </View>
                <Text className="text-xs font-body text-gray-500 mt-0.5">{item.priority || 'NORMAL'} · {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
                <Button
                  size="sm"
                  variant={isPublished ? 'secondary' : 'primary'}
                  onPress={() => togglePublish(pk, isPublished)}
                  loading={actionLoading === pk}
                  className="mt-2"
                >
                  {isPublished ? 'Unpublish' : 'Publish'}
                </Button>
              </View>
            );
          }}
          contentContainerClassName="pb-12"
        />
      </View>
    </SafeAreaView>
  );
}

