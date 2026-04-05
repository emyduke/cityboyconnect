import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, Pressable, Animated, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { adminApi } from '../../api/admin';
import { useToastStore } from '../../store/toastStore';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';

const REJECTION_REASONS = [
  'Invalid voter card',
  'Blurry or unreadable voter card image',
  'Name mismatch on voter card',
  'Duplicate account detected',
  'Incomplete profile information',
  'Other',
];

export default function AdminVerificationsScreen() {
  const toast = useToastStore((s) => s.show);
  const [queue, setQueue] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [qRes, sRes] = await Promise.all([
        adminApi.getVerificationQueue({ status: 'PENDING', page_size: 200 }),
        adminApi.getVerificationStats(),
      ]);
      setQueue(qRes.data?.results || qRes.results || qRes.data || []);
      setStats(sRes.data || sRes);
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleApprove = async (pk: number) => {
    setActionLoading(pk);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await adminApi.verifyMember(pk);
      toast('Member verified', 'success');
      setQueue((prev) => prev.filter((m) => (m.id || m.pk) !== pk));
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to verify', 'error');
    }
    setActionLoading(null);
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason) return;
    setActionLoading(rejectTarget);
    try {
      await adminApi.rejectMember(rejectTarget, rejectReason);
      toast('Member rejected', 'success');
      setQueue((prev) => prev.filter((m) => (m.id || m.pk) !== rejectTarget));
      setRejectTarget(null);
      setRejectReason('');
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to reject', 'error');
    }
    setActionLoading(null);
  };

  if (loading) {
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
        {/* Stats bar */}
        {stats && (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.pending ?? 0}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>{stats.approved_today ?? 0}</Text>
              <Text style={styles.statLabel}>Today ✓</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.danger }]}>{stats.rejected_today ?? 0}</Text>
              <Text style={styles.statLabel}>Today ✕</Text>
            </View>
          </View>
        )}

        <FlatList
          data={queue}
          keyExtractor={(item) => String(item.id || item.pk)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState title="No pending verifications" />}
          renderItem={({ item }) => {
            const pk = item.id || item.pk;
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Avatar name={item.full_name || ''} size="sm" />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{item.full_name}</Text>
                    <Text style={styles.cardMeta}>{item.phone_number} · {item.state_name || ''}</Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <Button
                    size="sm"
                    onPress={() => handleApprove(pk)}
                    loading={actionLoading === pk}
                    style={{ flex: 1 }}
                  >
                    ✓ Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onPress={() => { setRejectTarget(pk); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                    style={{ flex: 1 }}
                  >
                    ✕ Reject
                  </Button>
                </View>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
        />
      </View>

      {/* Reject modal */}
      <Modal visible={rejectTarget !== null} transparent animationType="slide" onRequestClose={() => setRejectTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Verification</Text>
            {REJECTION_REASONS.map((reason) => (
              <Pressable key={reason} style={[styles.reasonRow, rejectReason === reason && styles.reasonRowActive]} onPress={() => setRejectReason(reason)}>
                <View style={[styles.radio, rejectReason === reason && styles.radioActive]} />
                <Text style={styles.reasonText}>{reason}</Text>
              </Pressable>
            ))}
            <View style={styles.modalActions}>
              <Button variant="secondary" onPress={() => { setRejectTarget(null); setRejectReason(''); }} style={{ flex: 1 }}>Cancel</Button>
              <Button variant="danger" onPress={handleReject} disabled={!rejectReason} loading={actionLoading === rejectTarget} style={{ flex: 1 }}>Reject</Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.md },
  statsBar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
  statItem: { alignItems: 'center' },
  statValue: { ...typography.h3, color: colors.primary },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  cardInfo: { flex: 1 },
  cardName: { ...typography.bodyMedium, color: colors.text },
  cardMeta: { ...typography.caption, color: colors.textSecondary },
  cardActions: { flexDirection: 'row', gap: spacing.sm },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg },
  modalTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  reasonRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm },
  reasonRowActive: {},
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  reasonText: { ...typography.body, color: colors.text },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
