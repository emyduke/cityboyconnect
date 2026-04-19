import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { adminApi } from '../../api/admin';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';

export default function AdminMembersScreen() {
  const navigation = useNavigation<any>();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await adminApi.getMembers({ search, page_size: 100 });
      setMembers(res.data?.results || res.results || res.data || []);
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, [search]);

  useEffect(() => { setLoading(true); fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading && members.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        <View className="flex-1 p-4">
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="card" className="mt-2" />
          <Skeleton variant="card" className="mt-2" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <View className="flex-1 p-4">
        <TextInput
          className="bg-surface rounded-lg px-4 py-2 text-base font-body text-gray-900 border border-gray-200 mb-4"
          placeholder="Search members..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          returnKeyType="search"
        />

        <FlatList
          data={members}
          keyExtractor={(item) => String(item.id || item.pk)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a472a" />}
          ListEmptyComponent={<EmptyState title="No members found" />}
          renderItem={({ item }) => (
            <Pressable
              className="flex-row items-center bg-surface rounded-lg p-2 mb-1 gap-2 shadow-sm"
              onPress={() => navigation.navigate('AdminMemberDetail', { pk: item.id || item.pk })}
            >
              <Avatar name={item.full_name || ''} size="sm" />
              <View className="flex-1">
                <Text className="text-base font-body-medium text-gray-900" numberOfLines={1}>{item.full_name || 'Member'}</Text>
                <Text className="text-xs font-body text-gray-500">{item.phone_number || ''} · {item.state_name || ''}</Text>
              </View>
              <Badge
                label={item.voter_verification_status || item.status || 'pending'}
                variant={item.voter_verification_status === 'VERIFIED' ? 'success' : item.voter_verification_status === 'REJECTED' ? 'danger' : 'warning'}
              />
            </Pressable>
          )}
          contentContainerClassName="pb-12"
        />
      </View>
    </SafeAreaView>
  );
}

