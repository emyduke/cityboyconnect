import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, TextInput, RefreshControl, Pressable, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { getMembers } from '../../api/members';
import { unwrap } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import MemberCard from '../../components/MemberCard';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';

type FilterKey = 'all' | 'verified' | 'pending' | 'ward';

const FILTERS: { key: FilterKey; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: '👥' },
  { key: 'verified', label: 'Verified', icon: '✅' },
  { key: 'pending', label: 'Pending', icon: '⏳' },
  { key: 'ward', label: 'My Ward', icon: '📍' },
];

export default function MembersScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const canAdd = user?.role && ['SUPER_ADMIN','NATIONAL_OFFICER','STATE_DIRECTOR','LGA_COORDINATOR','WARD_COORDINATOR'].includes(user.role);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const fetchMembers = useCallback(async () => {
    try {
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (filter === 'verified') params.voter_verification_status = 'VERIFIED';
      if (filter === 'pending') params.voter_verification_status = 'PENDING';
      if (filter === 'ward') params.scope = 'ward';
      const res = await getMembers(params);
      const data = unwrap(res);
      setMembers(Array.isArray(data) ? data : data?.results || []);
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, [search, filter]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const onRefresh = () => { setRefreshing(true); fetchMembers(); };

  if (loading) {
    return (
      <View className="flex-1 bg-background p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="list" className="mb-2" />
        ))}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background p-4">
      {canAdd && (
        <Pressable className="bg-forest rounded-lg py-2 items-center mb-2" onPress={() => navigation.navigate('MoreTab', { screen: 'AddMember' })}>
          <Text className="text-base font-body-semibold text-white">+ Add Member</Text>
        </Pressable>
      )}
      <View className="flex-row items-center bg-surface rounded-xl px-4 border border-gray-200 mb-2">
        <Text className="text-base mr-1">🔍</Text>
        <TextInput
          className="flex-1 py-2.5 text-base font-body text-gray-900"
          placeholder="Search by name, phone, or ID..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={fetchMembers}
        />
      </View>

      <View className="flex-row gap-1 mb-4">
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            className={`flex-row items-center px-2.5 py-1.5 rounded-full border gap-1 ${filter === f.key ? 'bg-forest border-forest' : 'bg-surface border-gray-200'}`}
            onPress={() => { setFilter(f.key); setLoading(true); }}
          >
            <Text className="text-xs">{f.icon}</Text>
            <Text className={`text-xs font-body ${filter === f.key ? 'text-white font-body-semibold' : 'text-gray-500'}`}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <MemberCard
            member={item}
            onPress={() => navigation.navigate('MemberDetail', { id: item.id })}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState icon="👥" title="No Members Found" description="Try adjusting your search or filter" />}
        contentContainerStyle={{ paddingBottom: 48 }}
      />
    </View>
  );
}
