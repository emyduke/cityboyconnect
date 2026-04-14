import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, TextInput, StyleSheet, RefreshControl, Pressable, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography, shadows } from '../../theme';
import { getMembers } from '../../api/members';
import { unwrap } from '../../api/client';
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
      <View style={styles.container}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="list" style={{ marginBottom: spacing.sm }} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.search}
          placeholder="Search by name, phone, or ID..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={fetchMembers}
        />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => { setFilter(f.key); setLoading(true); }}
          >
            <Text style={styles.filterIcon}>{f.icon}</Text>
            <Text style={[styles.filterLabel, filter === f.key && styles.filterLabelActive]}>{f.label}</Text>
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
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  searchIcon: { fontSize: 16, marginRight: spacing.xs },
  search: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    ...typography.body,
    color: colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterIcon: { fontSize: 12 },
  filterLabel: { ...typography.caption, color: colors.textSecondary },
  filterLabelActive: { color: '#fff', fontFamily: 'PlusJakartaSans-SemiBold' },
});
