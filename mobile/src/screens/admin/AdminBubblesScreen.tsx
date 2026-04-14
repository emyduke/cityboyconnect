import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, Pressable, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, shadows } from '../../theme';
import { getAdminBubbles, updateBubbleStatus, Bubble } from '../../api/bubbles';
import { unwrap } from '../../api/client';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/ui/Button';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fef3c7', text: '#854d0e' },
  IN_REVIEW: { bg: '#3b82f6', text: '#fff' },
  APPROVED: { bg: '#22c55e', text: '#fff' },
  IN_PROGRESS: { bg: '#f97316', text: '#fff' },
  DELIVERED: { bg: '#10b981', text: '#fff' },
  REJECTED: { bg: '#ef4444', text: '#fff' },
};

const STATUS_ACTIONS: Record<string, Array<{ label: string; status: string }>> = {
  PENDING: [{ label: 'Start Review', status: 'IN_REVIEW' }, { label: 'Reject', status: 'REJECTED' }],
  IN_REVIEW: [{ label: 'Approve', status: 'APPROVED' }, { label: 'Reject', status: 'REJECTED' }],
  APPROVED: [{ label: 'In Progress', status: 'IN_PROGRESS' }],
  IN_PROGRESS: [{ label: 'Delivered', status: 'DELIVERED' }],
};

export default function AdminBubblesScreen() {
  const navigation = useNavigation<any>();
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetch = useCallback(async () => {
    try {
      const res = await getAdminBubbles();
      const data = unwrap(res);
      setBubbles(data?.results || []);
      setStats(data?.stats || {});
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    setActionLoading(id);
    try {
      await updateBubbleStatus(id, { status: newStatus });
      Alert.alert('Success', `Status updated to ${newStatus.replace(/_/g, ' ')}`);
      fetch();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error?.message || 'Failed to update');
    }
    setActionLoading(null);
  };

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
      <FlatList
        data={bubbles}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View>
            <View style={styles.statsRow}>
              {[
                { label: 'Pending', value: stats.pending_count, color: '#eab308' },
                { label: 'Review', value: stats.in_review_count, color: '#3b82f6' },
                { label: 'Approved', value: stats.approved_count, color: '#22c55e' },
                { label: 'Progress', value: stats.in_progress_count, color: '#f97316' },
                { label: 'Delivered', value: stats.delivered_count, color: '#10b981' },
              ].map((s) => (
                <View key={s.label} style={styles.statCard}>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value ?? 0}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyState icon="🫧" title="No Bubbles" />}
        renderItem={({ item }) => {
          const sc = STATUS_COLORS[item.status] || STATUS_COLORS.PENDING;
          const actions = STATUS_ACTIONS[item.status] || [];
          return (
            <Pressable style={styles.card} onPress={() => navigation.navigate('BubbleDetail', { id: item.id })}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusText, { color: sc.text }]}>{item.status_display}</Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>{item.created_by_name} · {[item.ward_name, item.lga_name].filter(Boolean).join(', ')}</Text>
              {actions.length > 0 && (
                <View style={styles.actionsRow}>
                  {actions.map((a) => (
                    <Button
                      key={a.status}
                      size="sm"
                      variant={a.status === 'REJECTED' ? 'danger' : 'primary'}
                      onPress={() => handleStatusChange(item.id, a.status)}
                      loading={actionLoading === item.id}
                      style={{ marginRight: 8 }}
                    >
                      {a.label}
                    </Button>
                  ))}
                </View>
              )}
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md },
  statsRow: { flexDirection: 'row', gap: 6, marginBottom: spacing.md, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: 60, backgroundColor: colors.surface, borderRadius: 12, padding: 10, alignItems: 'center', ...shadows.sm },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, color: colors.textTertiary, textTransform: 'uppercase', marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: spacing.sm, ...shadows.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 100 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardMeta: { fontSize: 12, color: colors.textTertiary, marginBottom: 8 },
  actionsRow: { flexDirection: 'row', marginTop: 4 },
});
