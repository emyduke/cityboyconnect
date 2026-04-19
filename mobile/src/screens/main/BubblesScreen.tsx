import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { getBubbles, Bubble } from '../../api/bubbles';
import { unwrap } from '../../api/client';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';

const ROLE_HIERARCHY: Record<string, number> = {
  MEMBER: 1, WARD_COORDINATOR: 2, LGA_COORDINATOR: 4,
  STATE_DIRECTOR: 6, NATIONAL_OFFICER: 8, SUPER_ADMIN: 10,
};

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
  CANCELLED: { bg: '#6b7280', text: '#fff' },
};

const CATEGORIES = ['', 'TOOLS', 'OPPORTUNITIES', 'SERVICES', 'SUPPORT', 'OTHER'];
const CAT_LABELS: Record<string, string> = {
  '': 'All', TOOLS: 'Tools', OPPORTUNITIES: 'Opportunities',
  SERVICES: 'Services', SUPPORT: 'Support', OTHER: 'Other',
};

export default function BubblesScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const canCreate = (ROLE_HIERARCHY[user?.role || ''] ?? 0) >= 2;
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('');

  const fetch = useCallback(async () => {
    try {
      const params: Record<string, any> = {};
      if (category) params.category = category;
      const res = await getBubbles(params);
      const data = unwrap(res);
      setBubbles(Array.isArray(data) ? data : data?.results || []);
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, [category]);

  useEffect(() => { fetch(); }, [fetch]);

  const renderCard = ({ item }: { item: Bubble }) => {
    const sc = STATUS_COLORS[item.status] || STATUS_COLORS.PENDING;
    return (
      <Pressable className="bg-surface rounded-lg p-5 mb-2 shadow-sm" onPress={() => navigation.navigate('BubbleDetail', { id: item.id })}>
        <View className="flex-row gap-2 mb-2">
          <View className="px-2.5 py-0.5 rounded-full" style={{ backgroundColor: CAT_COLORS[item.category] || '#6b7280' }}>
            <Text className="text-white text-xs font-body-semibold">{item.category_display}</Text>
          </View>
          <View className="px-2.5 py-0.5 rounded-full" style={{ backgroundColor: sc.bg }}>
            <Text className="text-xs font-body-semibold" style={{ color: sc.text }}>{item.status_display}</Text>
          </View>
        </View>
        <Text className="text-base font-bold text-gray-900 mb-1" numberOfLines={1}>{item.title}</Text>
        <Text className="text-[13px] text-gray-500 mb-2" numberOfLines={2}>{item.description}</Text>
        <View className="flex-row justify-between items-center">
          <Text className="text-xs text-gray-400">📍 {[item.ward_name, item.lga_name].filter(Boolean).join(', ') || 'N/A'}</Text>
          <Text className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        <View className="p-4">
          {[1, 2, 3].map((k) => <Skeleton key={k} variant="card" className="mb-2" />)}
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
          <View>
            {canCreate && (
              <Button variant="primary" size="sm" onPress={() => navigation.navigate('CreateBubble')} className="mb-4">
                + Create Bubble
              </Button>
            )}
            <FlatList
              horizontal
              data={CATEGORIES}
              keyExtractor={(c) => c || 'all'}
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              renderItem={({ item: c }) => (
                <Pressable
                  className={`px-3.5 py-1.5 rounded-full border-[1.5px] mr-2 ${category === c ? 'bg-forest border-forest' : 'bg-surface border-gray-200'}`}
                  onPress={() => setCategory(c)}
                >
                  <Text className={`text-[13px] font-body-medium ${category === c ? 'text-white' : 'text-gray-500'}`}>
                    {CAT_LABELS[c]}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        }
        ListEmptyComponent={<EmptyState icon="🫧" title="No Bubbles" description="No bubbles in your area yet" />}
      />
    </SafeAreaView>
  );
}


