import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
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
        {/* Stats bar */}
        {stats && (
          <View className="flex-row justify-around bg-surface rounded-lg p-4 mb-4 shadow-sm">
            <View className="items-center">
              <Text className="text-xl font-display-bold text-forest">{stats.pending ?? 0}</Text>
              <Text className="text-xs font-body text-gray-500">Pending</Text>
            </View>
            <View className="items-center">
              <Text className="text-xl font-display-bold text-success">{stats.approved_today ?? 0}</Text>
              <Text className="text-xs font-body text-gray-500">Today ✓</Text>
            </View>
            <View className="items-center">
              <Text className="text-xl font-display-bold text-danger">{stats.rejected_today ?? 0}</Text>
              <Text className="text-xs font-body text-gray-500">Today ✕</Text>
            </View>
          </View>
        )}

        <FlatList
          data={queue}
          keyExtractor={(item) => String(item.id || item.pk)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a472a" />}
          ListEmptyComponent={<EmptyState title="No pending verifications" />}
          renderItem={({ item }) => {
            const pk = item.id || item.pk;
            return (
              <View className="bg-surface rounded-lg p-4 mb-2 shadow-sm">
                <View className="flex-row items-center gap-2 mb-2">
                  <Avatar name={item.full_name || ''} size="sm" />
                  <View className="flex-1">
                    <Text className="text-base font-body-medium text-gray-900">{item.full_name}</Text>
                    <Text className="text-xs font-body text-gray-500">{item.phone_number} · {item.state_name || ''}</Text>
                  </View>
                </View>
                {item.voter_card_image && (
                  <Image source={{ uri: item.voter_card_image }} className="w-full h-[150px] rounded bg-background mb-2" resizeMode="contain" />
                )}
                {!item.voter_card_image && (
                  <Text className="text-xs font-body text-gray-400 italic mb-2">No voter card image</Text>
                )}
                <View className="flex-row gap-2">
                  <Button
                    size="sm"
                    onPress={() => handleApprove(pk)}
                    loading={actionLoading === pk}
                    className="flex-1"
                  >
                    ✓ Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onPress={() => { setRejectTarget(pk); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                    className="flex-1"
                  >
                    ✕ Reject
                  </Button>
                </View>
              </View>
            );
          }}
          contentContainerClassName="pb-12"
        />
      </View>

      {/* Reject modal */}
      <Modal visible={rejectTarget !== null} transparent animationType="slide" onRequestClose={() => setRejectTarget(null)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-2xl p-6">
            <Text className="text-xl font-display-bold text-gray-900 mb-4">Reject Verification</Text>
            {REJECTION_REASONS.map((reason) => (
              <Pressable key={reason} className="flex-row items-center py-2 gap-2" onPress={() => setRejectReason(reason)}>
                <View className={`w-5 h-5 rounded-full border-2 ${rejectReason === reason ? 'border-forest bg-forest' : 'border-gray-200'}`} />
                <Text className="text-base font-body text-gray-900">{reason}</Text>
              </Pressable>
            ))}
            <View className="flex-row gap-2 mt-4">
              <Button variant="secondary" onPress={() => { setRejectTarget(null); setRejectReason(''); }} className="flex-1">Cancel</Button>
              <Button variant="danger" onPress={handleReject} disabled={!rejectReason} loading={actionLoading === rejectTarget} className="flex-1">Reject</Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

