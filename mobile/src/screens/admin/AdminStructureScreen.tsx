import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { adminApi } from '../../api/admin';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';

export default function AdminStructureScreen() {
  const [states, setStates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await adminApi.getStates();
      setStates(res.data || res.results || []);
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.container}>
          <Skeleton variant="card" />
          <Skeleton variant="card" style={{ marginTop: spacing.sm }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <FlatList
          data={states}
          keyExtractor={(item) => String(item.id || item.pk)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState title="No states found" />}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => setSelected(selected?.id === item.id ? null : item)}>
              <Text style={styles.stateName}>{item.name}</Text>
              <View style={styles.rowRight}>
                <Text style={styles.count}>{item.total_members ?? item.member_count ?? '-'} members</Text>
                <Text style={styles.chevron}>{selected?.id === item.id ? '▼' : '›'}</Text>
              </View>
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
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.xs, ...shadows.sm,
  },
  stateName: { ...typography.bodyMedium, color: colors.text },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  count: { ...typography.caption, color: colors.textSecondary },
  chevron: { fontSize: 16, color: colors.textTertiary },
});
