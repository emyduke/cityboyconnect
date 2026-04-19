import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminApi } from '../../api/admin';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';

export default function AdminAuditLogScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await adminApi.getAuditLog({ page_size: 100 });
      setLogs(res.data?.results || res.results || res.data || []);
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

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
          data={logs}
          keyExtractor={(item, idx) => String(item.id || idx)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a472a" />}
          ListEmptyComponent={<EmptyState title="No audit logs" />}
          renderItem={({ item }) => (
            <View className="flex-row mb-2 gap-2">
              <View className="w-2 h-2 rounded-full bg-forest mt-1.5" />
              <View className="flex-1 bg-surface rounded-lg p-2 shadow-sm">
                <Text className="text-sm font-body text-gray-900">{item.action || item.description || '-'}</Text>
                <Text className="text-xs font-body text-gray-500 mt-0.5">{item.actor_name || item.user || ''}</Text>
                <Text className="text-xs font-body text-gray-400 mt-0.5">{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</Text>
              </View>
            </View>
          )}
          contentContainerClassName="pb-12"
        />
      </View>
    </SafeAreaView>
  );
}

