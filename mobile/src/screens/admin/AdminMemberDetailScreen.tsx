import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Modal, TextInput, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { adminApi } from '../../api/admin';
import { useToastStore } from '../../store/toastStore';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';

const REJECTION_REASONS = [
  'Invalid voter card',
  'Blurry or unreadable voter card image',
  'Name mismatch on voter card',
  'Duplicate account detected',
  'Incomplete profile information',
  'Other',
];

export default function AdminMemberDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const toast = useToastStore((s) => s.show);
  const pk = route.params?.pk;
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal states  
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [suspendModalVisible, setSuspendModalVisible] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await adminApi.getMemberDetail(pk);
      setMember(res.data || res);
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, [pk]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleAction = async (action: string, payload?: any) => {
    setActionLoading(action);
    try {
      switch (action) {
        case 'verify': await adminApi.verifyMember(pk); break;
        case 'reject': await adminApi.rejectMember(pk, payload); setRejectModalVisible(false); break;
        case 'suspend': await adminApi.suspendMember(pk, payload); setSuspendModalVisible(false); break;
        case 'unsuspend': await adminApi.unsuspendMember(pk); break;
      }
      toast(`Member ${action}ed successfully`, 'success');
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || `Failed to ${action}`, 'error');
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        <View className="p-4 pb-12">
          <Skeleton variant="card" height={200} />
          <Skeleton variant="card" className="mt-4" />
        </View>
      </SafeAreaView>
    );
  }

  if (!member) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        <View className="p-4 pb-12 flex-1 items-center justify-center">
          <Text className="text-base font-body text-gray-900">Member not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const infoRows = [
    { label: 'Phone', value: member.phone_number || '-' },
    { label: 'Email', value: member.email || '-' },
    { label: 'Gender', value: member.gender || '-' },
    { label: 'Date of Birth', value: member.date_of_birth || '-' },
    { label: 'Occupation', value: member.occupation || '-' },
    { label: 'State', value: member.state_name || '-' },
    { label: 'LGA', value: member.lga_name || '-' },
    { label: 'Ward', value: member.ward_name || '-' },
    { label: 'Membership ID', value: member.membership_id || '-' },
    { label: 'Role', value: member.role || '-' },
    { label: 'Voter Card', value: member.voter_verification_status || '-' },
    { label: 'Voter Card #', value: member.voter_card_number || '-' },
    { label: 'Joined', value: member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '-' },
    { label: 'Referred By', value: member.referred_by_name || '-' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView
        contentContainerClassName="p-4 pb-12"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a472a" />}
      >
        {/* Header */}
        <View className="items-center mb-6">
          <Avatar name={member.full_name || ''} size="xl" />
          <Text className="text-xl font-display-bold text-gray-900 mt-2">{member.full_name}</Text>
          <View className="flex-row gap-1 mt-1">
            <Badge label={member.role || 'MEMBER'} variant="info" />
            <Badge
              label={member.voter_verification_status || 'PENDING'}
              variant={member.voter_verification_status === 'VERIFIED' ? 'success' : member.voter_verification_status === 'REJECTED' ? 'danger' : 'warning'}
            />
            {!member.is_active && <Badge label="SUSPENDED" variant="danger" />}
          </View>
        </View>

        {/* Info card */}
        <Card className="mb-6">
          {infoRows.map((row, i) => (
            <View key={row.label} className={`flex-row justify-between py-2 ${i < infoRows.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <Text className="text-sm font-body text-gray-500">{row.label}</Text>
              <Text className="text-base font-body-medium text-gray-900 max-w-[55%] text-right">{row.value}</Text>
            </View>
          ))}
        </Card>

        {/* Voter Card Image */}
        {member.voter_card_image && (
          <View className="mb-4">
            <Text className="text-lg font-display-semibold text-gray-900 mb-2">Voter Card</Text>
            <Image source={{ uri: member.voter_card_image }} className="w-full h-[200px] rounded-lg bg-background" resizeMode="contain" />
          </View>
        )}

        {/* Actions */}
        <Text className="text-lg font-display-semibold text-gray-900 mb-2">Actions</Text>
        <View className="flex-row gap-2 mb-2">
          {member.voter_verification_status !== 'VERIFIED' && (
            <Button onPress={() => handleAction('verify')} loading={actionLoading === 'verify'} className="flex-1">
              Verify
            </Button>
          )}
          {member.voter_verification_status !== 'REJECTED' && (
            <Button variant="danger" onPress={() => setRejectModalVisible(true)} loading={actionLoading === 'reject'} className="flex-1">
              Reject
            </Button>
          )}
        </View>
        <View className="flex-row gap-2 mb-2">
          {member.is_active ? (
            <Button variant="danger" onPress={() => setSuspendModalVisible(true)} loading={actionLoading === 'suspend'} className="flex-1">
              Suspend
            </Button>
          ) : (
            <Button variant="secondary" onPress={() => handleAction('unsuspend')} loading={actionLoading === 'unsuspend'} className="flex-1">
              Unsuspend
            </Button>
          )}
        </View>
      </ScrollView>

      {/* Reject Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="slide" onRequestClose={() => setRejectModalVisible(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-2xl p-6">
            <Text className="text-xl font-display-bold text-gray-900 mb-1">Reject Membership</Text>
            <Text className="text-sm font-body text-gray-500 mb-4">Select a reason:</Text>
            {REJECTION_REASONS.map((reason) => (
              <Pressable key={reason} className={`flex-row items-center py-2 gap-2 ${rejectReason === reason ? 'rounded' : ''}`} onPress={() => setRejectReason(reason)}>
                <View className={`w-5 h-5 rounded-full border-2 ${rejectReason === reason ? 'border-forest bg-forest' : 'border-gray-200'}`} />
                <Text className="text-base font-body text-gray-900">{reason}</Text>
              </Pressable>
            ))}
            <View className="flex-row gap-2">
              <Button variant="secondary" onPress={() => setRejectModalVisible(false)} className="flex-1">Cancel</Button>
              <Button variant="danger" onPress={() => handleAction('reject', rejectReason)} loading={actionLoading === 'reject'} disabled={!rejectReason} className="flex-1">
                Reject
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Suspend Modal */}
      <Modal visible={suspendModalVisible} transparent animationType="slide" onRequestClose={() => setSuspendModalVisible(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-2xl p-6">
            <Text className="text-xl font-display-bold text-gray-900 mb-1">Suspend Member</Text>
            <Text className="text-sm font-body text-gray-500 mb-4">Reason for suspension:</Text>
            <TextInput
              className="bg-background rounded-lg border border-gray-200 p-4 text-base font-body text-gray-900 min-h-[100px] mb-4"
              value={suspendReason}
              onChangeText={setSuspendReason}
              placeholder="Enter reason..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View className="flex-row gap-2">
              <Button variant="secondary" onPress={() => setSuspendModalVisible(false)} className="flex-1">Cancel</Button>
              <Button variant="danger" onPress={() => handleAction('suspend', suspendReason)} loading={actionLoading === 'suspend'} disabled={!suspendReason.trim()} className="flex-1">
                Suspend
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

