import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { adminApi } from '../../api/admin';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';

export default function AdminAuditLogScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await adminApi.getAuditLog({ page_size: 100 });
      setLogs(res.data?.results || res.results || res.data || []);
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
          data={logs}
          keyExtractor={(item, idx) => String(item.id || idx)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState title="No audit logs" />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.dot} />
              <View style={styles.rowContent}>
                <Text style={styles.action}>{item.action || item.description || '-'}</Text>
                <Text style={styles.actor}>{item.actor_name || item.user || ''}</Text>
                <Text style={styles.time}>{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</Text>
              </View>
            </View>
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
  row: { flexDirection: 'row', marginBottom: spacing.sm, gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
  rowContent: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, ...shadows.sm },
  action: { ...typography.bodySm, color: colors.text },
  actor: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  time: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
});
