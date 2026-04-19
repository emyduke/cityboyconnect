import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { getMyBubbles, Bubble } from '../../api/bubbles';
import { unwrap } from '../../api/client';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/ui/Button';

const CAT_COLORS: Record<string, string> = {
  TOOLS: '#1a472a', OPPORTUNITIES: '#2563eb', SERVICES: '#ea580c',
  SUPPORT: '#7c3aed', OTHER: '#6b7280',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fef3c7', text: '#854d0e' },
  IN_REVIEW: { bg: '#3b82f6', text: '#fff' },
  APPROVED: { bg: '#22c55e', text: '#fff' },
  IN_PROGRESS: { bg: '#f97316', text: '#fff' },
  DELIVERED: { bg: '#10b981', text: '#fff' },
  REJECTED: { bg: '#ef4444', text: '#fff' },
};

const STATUS_ORDER = ['PENDING', 'IN_REVIEW', 'APPROVED', 'IN_PROGRESS', 'DELIVERED'];

export default function MyBubblesScreen() {
  const navigation = useNavigation<any>();
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const res = await getMyBubbles();
      const data = unwrap(res);
      setBubbles(Array.isArray(data) ? data : data?.results || []);
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const renderCard = ({ item }: { item: Bubble }) => {
    const sc = STATUS_COLORS[item.status] || STATUS_COLORS.PENDING;
    const idx = STATUS_ORDER.indexOf(item.status);
    return (
      <Pressable className="bg-surface rounded-lg p-5 mb-2 shadow-sm" onPress={() => navigation.navigate('BubbleDetail', { id: item.id })}>
        {!['REJECTED', 'CANCELLED'].includes(item.status) && (
          <View className="flex-row gap-1 mb-2.5">
            {STATUS_ORDER.map((s, i) => (
              <View key={s} className={`flex-1 h-1 rounded-[2px] ${i < idx ? 'bg-forest' : i === idx ? 'bg-gold' : 'bg-gray-200'}`} />
            ))}
          </View>
        )}
        <View className="flex-row gap-2 mb-2">
          <View className="px-2.5 py-0.5 rounded-full" style={{ backgroundColor: CAT_COLORS[item.category] || '#6b7280' }}>
            <Text className="text-white text-xs font-body-semibold">{item.category_display}</Text>
          </View>
          <View className="px-2.5 py-0.5 rounded-full" style={{ backgroundColor: sc.bg }}>
            <Text className="text-xs font-body-semibold" style={{ color: sc.text }}>{item.status_display}</Text>
          </View>
        </View>
        <Text className="text-base font-bold text-gray-900 mb-1" numberOfLines={1}>{item.title}</Text>
        <View className="flex-row justify-between">
          <Text className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</Text>
          <Text className="text-xs text-gray-400">{item.images_count} photo{item.images_count !== 1 ? 's' : ''}</Text>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        <View className="p-4">
          {[1, 2].map((k) => <Skeleton key={k} variant="card" className="mb-2" />)}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <FlatList
        data={bubbles}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCard}
        contentContainerClassName="p-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor="#1a472a" />}
        ListHeaderComponent={
          <Button variant="primary" size="sm" onPress={() => navigation.navigate('CreateBubble')} className="mb-4">
            + Create Bubble
          </Button>
        }
        ListEmptyComponent={
          <EmptyState icon="🫧" title="No Bubbles Yet" description="You haven't created any bubbles yet. Leaders can create bubbles to request local support." />
        }
      />
    </SafeAreaView>
  );
}

