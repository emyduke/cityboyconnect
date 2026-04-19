import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, Pressable, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { getAnnouncements } from '../../api/announcements';
import { unwrap } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import AnnouncementCard from '../../components/AnnouncementCard';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';

type PriorityFilter = 'ALL' | 'URGENT' | 'IMPORTANT' | 'NORMAL';

const PRIORITY_FILTERS: { key: PriorityFilter; label: string; color: string }[] = [
  { key: 'ALL', label: 'All', color: '#1a472a' },
  { key: 'URGENT', label: '🔴 Urgent', color: '#dc2626' },
  { key: 'IMPORTANT', label: '🟡 Important', color: '#d4a017' },
  { key: 'NORMAL', label: '🟢 Normal', color: '#16a34a' },
];

export default function AnnouncementsScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const canCreate = user?.role && ['SUPER_ADMIN','NATIONAL_OFFICER','STATE_DIRECTOR','LGA_COORDINATOR','WARD_COORDINATOR'].includes(user.role);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<PriorityFilter>('ALL');

  const fetchAnnouncements = useCallback(async () => {
    try {
      const params: Record<string, any> = {};
      if (filter !== 'ALL') params.priority = filter;
      const res = await getAnnouncements(params);
      const data = unwrap(res);
      setItems(Array.isArray(data) ? data : data?.results || []);
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, [filter]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const priorityColors: Record<string, string> = {
    URGENT: '#dc2626',
    IMPORTANT: '#d4a017',
    NORMAL: '#16a34a',
  };

  if (loading) {
    return <View className="flex-1 bg-background p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="card" className="mb-2" />)}</View>;
  }

  return (
    <View className="flex-1 bg-background p-4">
      {/* Create button for coordinators */}
      {canCreate && (
        <Pressable className="bg-forest rounded-lg py-2 items-center mb-2" onPress={() => navigation.navigate('CreateAnnouncement')}>
          <Text className="text-base font-body-semibold text-white">+ Create Announcement</Text>
        </Pressable>
      )}
      {/* Filter tabs */}
      <View className="flex-row gap-1 mb-4">
        {PRIORITY_FILTERS.map((f) => (
          <Pressable
            key={f.key}
            className={`px-2.5 py-1.5 rounded-full border ${filter === f.key ? 'border-transparent' : 'border-gray-200 bg-surface'}`}
            style={filter === f.key ? { backgroundColor: f.color + '15', borderColor: f.color } : undefined}
            onPress={() => { setFilter(f.key); setLoading(true); }}
          >
            <Text
              className={`text-xs font-body ${filter === f.key ? 'font-body-semibold' : 'text-gray-500'}`}
              style={filter === f.key ? { color: f.color } : undefined}
            >{f.label}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View
            className="rounded-lg mb-2 overflow-hidden"
            style={{ borderLeftWidth: 3, borderLeftColor: priorityColors[item.priority] || '#e5e7eb' }}
          >
            <AnnouncementCard announcement={item} onPress={() => navigation.navigate('AnnouncementDetail', { id: item.id })} />
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAnnouncements(); }} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState icon="📢" title="No Announcements" description="Nothing to report yet" />}
        contentContainerStyle={{ paddingBottom: 48 }}
      />
    </View>
  );
}
