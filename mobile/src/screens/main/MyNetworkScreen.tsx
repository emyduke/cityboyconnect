import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMyNetwork, getMyNetworkTree, getMyNetworkRecent } from '../../api/members';
import { unwrap } from '../../api/client';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';

type Tab = 'direct' | 'tree' | 'recent';

export default function MyNetworkScreen() {
  const [tab, setTab] = useState<Tab>('direct');
  const [data, setData] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      if (tab === 'direct') {
        const res = await getMyNetwork();
        const payload = unwrap<any>(res);
        setData(payload);
        setItems(payload?.direct_referrals || payload?.members || []);
      } else if (tab === 'tree') {
        const res = await getMyNetworkTree();
        setItems(unwrap<any[]>(res) || []);
      } else {
        const res = await getMyNetworkRecent();
        setItems(unwrap<any[]>(res) || []);
      }
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, [tab]);

  useEffect(() => { setLoading(true); fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'direct', label: 'Direct' },
    { key: 'tree', label: 'Tree' },
    { key: 'recent', label: 'Recent' },
  ];

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
        {data?.network_size != null && (
          <View className="flex-row justify-between items-center bg-forest-dark rounded-md p-4 mb-4">
            <Text className="text-base font-body-medium text-gold-light">Network Size</Text>
            <Text className="text-2xl font-display-bold text-white">{data.network_size}</Text>
          </View>
        )}

        <View className="flex-row mb-4 bg-gray-100 rounded-md p-0.5">
          {tabs.map((t) => (
            <Pressable key={t.key} className={`flex-1 py-2 items-center rounded-sm ${tab === t.key ? 'bg-surface shadow-sm' : ''}`} onPress={() => setTab(t.key)}>
              <Text className={`${tab === t.key ? 'text-base font-body-medium text-forest' : 'text-sm font-body text-gray-500'}`}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={items}
          keyExtractor={(item, idx) => String(item.id || idx)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a472a" />}
          ListEmptyComponent={<EmptyState title="No members yet" />}
          renderItem={({ item }) => (
            <View className="flex-row items-center py-2 border-b border-gray-200 gap-2">
              <Avatar name={item.full_name || ''} size="sm" />
              <View className="flex-1">
                <Text className="text-base font-body-medium text-gray-900">{item.full_name || 'Member'}</Text>
                <Text className="text-xs font-body text-gray-500">{item.state_name || ''}{item.joined_at ? ` · ${new Date(item.joined_at).toLocaleDateString()}` : ''}</Text>
              </View>
              {item.added_by_leader ? (
                <Badge label="Added" variant="success" />
              ) : item.referral_count != null ? (
                <Badge label={`${item.referral_count} refs`} variant="info" />
              ) : (
                <Badge label="Referred" variant="info" />
              )}
            </View>
          )}
          contentContainerClassName="pb-12"
        />
      </View>
    </SafeAreaView>
  );
}
