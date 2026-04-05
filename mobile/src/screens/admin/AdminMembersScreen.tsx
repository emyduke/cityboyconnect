import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TextInput, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radius, shadows } from '../../theme';
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
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.container}>
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="card" style={{ marginTop: spacing.sm }} />
          <Skeleton variant="card" style={{ marginTop: spacing.sm }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <TextInput
          style={styles.search}
          placeholder="Search members..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          returnKeyType="search"
        />

        <FlatList
          data={members}
          keyExtractor={(item) => String(item.id || item.pk)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState title="No members found" />}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => navigation.navigate('AdminMemberDetail', { pk: item.id || item.pk })}
            >
              <Avatar name={item.full_name || ''} size="sm" />
              <View style={styles.rowInfo}>
                <Text style={styles.rowName} numberOfLines={1}>{item.full_name || 'Member'}</Text>
                <Text style={styles.rowMeta}>{item.phone_number || ''} · {item.state_name || ''}</Text>
              </View>
              <Badge
                label={item.voter_verification_status || item.status || 'pending'}
                variant={item.voter_verification_status === 'VERIFIED' ? 'success' : item.voter_verification_status === 'REJECTED' ? 'danger' : 'warning'}
              />
            </Pressable>
          )}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.md },
  search: {
    backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, ...typography.body, color: colors.text,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.xs, gap: spacing.sm, ...shadows.sm,
  },
  rowInfo: { flex: 1 },
  rowName: { ...typography.bodyMedium, color: colors.text },
  rowMeta: { ...typography.caption, color: colors.textSecondary },
});
