import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { getAdminBubbles, updateBubbleStatus, Bubble } from '../../api/bubbles';
import { unwrap } from '../../api/client';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/ui/Button';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fef3c7', text: '#854d0e' },
  IN_REVIEW: { bg: '#3b82f6', text: '#fff' },
  APPROVED: { bg: '#22c55e', text: '#fff' },
  IN_PROGRESS: { bg: '#f97316', text: '#fff' },
  DELIVERED: { bg: '#10b981', text: '#fff' },
  REJECTED: { bg: '#ef4444', text: '#fff' },
};

const STATUS_ACTIONS: Record<string, Array<{ label: string; status: string }>> = {
  PENDING: [{ label: 'Start Review', status: 'IN_REVIEW' }, { label: 'Reject', status: 'REJECTED' }],
  IN_REVIEW: [{ label: 'Approve', status: 'APPROVED' }, { label: 'Reject', status: 'REJECTED' }],
  APPROVED: [{ label: 'In Progress', status: 'IN_PROGRESS' }],
  IN_PROGRESS: [{ label: 'Delivered', status: 'DELIVERED' }],
};

export default function AdminBubblesScreen() {
  const navigation = useNavigation<any>();
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetch = useCallback(async () => {
    try {
      const res = await getAdminBubbles();
      const data = unwrap(res);
      setBubbles(data?.results || []);
      setStats(data?.stats || {});
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    setActionLoading(id);
    try {
      await updateBubbleStatus(id, { status: newStatus });
      Alert.alert('Success', `Status updated to ${newStatus.replace(/_/g, ' ')}`);
      fetch();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error?.message || 'Failed to update');
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        <View className="p-4">
          <Skeleton variant="card" />
          <Skeleton variant="card" className="mt-2" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <FlatList
        data={bubbles}
        keyExtractor={(item) => String(item.id)}
        contentContainerClassName="p-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor="#1a472a" />}
        ListHeaderComponent={
          <View>
            <View className="flex-row gap-1.5 mb-4 flex-wrap">
              {[
                { label: 'Pending', value: stats.pending_count, color: '#eab308' },
                { label: 'Review', value: stats.in_review_count, color: '#3b82f6' },
                { label: 'Approved', value: stats.approved_count, color: '#22c55e' },
                { label: 'Progress', value: stats.in_progress_count, color: '#f97316' },
                { label: 'Delivered', value: stats.delivered_count, color: '#10b981' },
              ].map((s) => (
                <View key={s.label} className="flex-1 min-w-[60px] bg-surface rounded-xl p-2.5 items-center shadow-sm">
                  <Text className="text-xl font-extrabold" style={{ color: s.color }}>{s.value ?? 0}</Text>
                  <Text className="text-[10px] text-gray-400 uppercase mt-0.5">{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyState icon="🫧" title="No Bubbles" />}
        renderItem={({ item }) => {
          const sc = STATUS_COLORS[item.status] || STATUS_COLORS.PENDING;
          const actions = STATUS_ACTIONS[item.status] || [];
          return (
            <Pressable className="bg-surface rounded-2xl p-4 mb-2 shadow-sm" onPress={() => navigation.navigate('BubbleDetail', { id: item.id })}>
              <View className="flex-row justify-between items-center mb-1.5">
                <Text className="text-[15px] font-bold text-gray-900 flex-1 mr-2" numberOfLines={1}>{item.title}</Text>
                <View className="px-2.5 py-0.5 rounded-full" style={{ backgroundColor: sc.bg }}>
                  <Text className="text-[11px] font-semibold" style={{ color: sc.text }}>{item.status_display}</Text>
                </View>
              </View>
              <Text className="text-xs text-gray-400 mb-2">{item.created_by_name} · {[item.ward_name, item.lga_name].filter(Boolean).join(', ')}</Text>
              {actions.length > 0 && (
                <View className="flex-row mt-1">
                  {actions.map((a) => (
                    <Button
                      key={a.status}
                      size="sm"
                      variant={a.status === 'REJECTED' ? 'danger' : 'primary'}
                      onPress={() => handleStatusChange(item.id, a.status)}
                      loading={actionLoading === item.id}
                      className="mr-2"
                    >
                      {a.label}
                    </Button>
                  ))}
                </View>
              )}
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

