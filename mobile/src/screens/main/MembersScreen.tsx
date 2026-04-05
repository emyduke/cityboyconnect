import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, TextInput, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography } from '../../theme';
import { getMembers } from '../../api/members';
import { unwrap } from '../../api/client';
import MemberCard from '../../components/MemberCard';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';

export default function MembersScreen() {
  const navigation = useNavigation<any>();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchMembers = useCallback(async () => {
    try {
      const res = await getMembers({ search: search || undefined });
      const data = unwrap(res);
      setMembers(Array.isArray(data) ? data : data?.results || []);
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, [search]);

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
      <TextInput
        style={styles.search}
        placeholder="Search members..."
        placeholderTextColor={colors.textTertiary}
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
        onSubmitEditing={fetchMembers}
      />
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
        ListEmptyComponent={<EmptyState icon="👥" title="No Members Found" description="No members match your search" />}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  search: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
