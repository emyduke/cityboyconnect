import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminApi } from '../../api/admin';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';

export default function AdminStructureScreen() {
  const [states, setStates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await adminApi.getStates();
      setStates(res.data || res.results || []);
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
          data={states}
          keyExtractor={(item) => String(item.id || item.pk)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a472a" />}
          ListEmptyComponent={<EmptyState title="No states found" />}
          renderItem={({ item }) => (
            <Pressable className="flex-row items-center justify-between bg-surface rounded-lg p-4 mb-1 shadow-sm" onPress={() => setSelected(selected?.id === item.id ? null : item)}>
              <Text className="text-base font-body-medium text-gray-900">{item.name}</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-xs font-body text-gray-500">{item.total_members ?? item.member_count ?? '-'} members</Text>
                <Text className="text-base text-gray-400">{selected?.id === item.id ? '▼' : '›'}</Text>
              </View>
            </Pressable>
          )}
          contentContainerClassName="pb-12"
        />
      </View>
    </SafeAreaView>
  );
}

