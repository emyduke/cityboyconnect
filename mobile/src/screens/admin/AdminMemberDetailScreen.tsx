import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, Modal, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radius, shadows } from '../../theme';
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
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.container}>
          <Skeleton variant="card" height={200} />
          <Skeleton variant="card" style={{ marginTop: spacing.md }} />
        </View>
      </SafeAreaView>
    );
  }

  if (!member) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={typography.body}>Member not found</Text>
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
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Avatar name={member.full_name || ''} size="xl" />
          <Text style={styles.name}>{member.full_name}</Text>
          <View style={styles.badges}>
            <Badge label={member.role || 'MEMBER'} variant="info" />
            <Badge
              label={member.voter_verification_status || 'PENDING'}
              variant={member.voter_verification_status === 'VERIFIED' ? 'success' : member.voter_verification_status === 'REJECTED' ? 'danger' : 'warning'}
            />
            {!member.is_active && <Badge label="SUSPENDED" variant="danger" />}
          </View>
        </View>

        {/* Info card */}
        <Card style={styles.infoCard}>
          {infoRows.map((row, i) => (
            <View key={row.label} style={[styles.infoRow, i < infoRows.length - 1 && styles.infoRowBorder]}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          ))}
        </Card>

        {/* Actions */}
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actions}>
          {member.voter_verification_status !== 'VERIFIED' && (
            <Button onPress={() => handleAction('verify')} loading={actionLoading === 'verify'} style={{ flex: 1 }}>
              Verify
            </Button>
          )}
          {member.voter_verification_status !== 'REJECTED' && (
            <Button variant="danger" onPress={() => setRejectModalVisible(true)} loading={actionLoading === 'reject'} style={{ flex: 1 }}>
              Reject
            </Button>
          )}
        </View>
        <View style={styles.actions}>
          {member.is_active ? (
            <Button variant="danger" onPress={() => setSuspendModalVisible(true)} loading={actionLoading === 'suspend'} style={{ flex: 1 }}>
              Suspend
            </Button>
          ) : (
            <Button variant="secondary" onPress={() => handleAction('unsuspend')} loading={actionLoading === 'unsuspend'} style={{ flex: 1 }}>
              Unsuspend
            </Button>
          )}
        </View>
      </ScrollView>

      {/* Reject Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="slide" onRequestClose={() => setRejectModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Membership</Text>
            <Text style={styles.modalSubtitle}>Select a reason:</Text>
            {REJECTION_REASONS.map((reason) => (
              <Pressable key={reason} style={[styles.reasonRow, rejectReason === reason && styles.reasonRowActive]} onPress={() => setRejectReason(reason)}>
                <View style={[styles.radio, rejectReason === reason && styles.radioActive]} />
                <Text style={styles.reasonText}>{reason}</Text>
              </Pressable>
            ))}
            <View style={styles.modalActions}>
              <Button variant="secondary" onPress={() => setRejectModalVisible(false)} style={{ flex: 1 }}>Cancel</Button>
              <Button variant="danger" onPress={() => handleAction('reject', rejectReason)} loading={actionLoading === 'reject'} disabled={!rejectReason} style={{ flex: 1 }}>
                Reject
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Suspend Modal */}
      <Modal visible={suspendModalVisible} transparent animationType="slide" onRequestClose={() => setSuspendModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Suspend Member</Text>
            <Text style={styles.modalSubtitle}>Reason for suspension:</Text>
            <TextInput
              style={styles.textarea}
              value={suspendReason}
              onChangeText={setSuspendReason}
              placeholder="Enter reason..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <Button variant="secondary" onPress={() => setSuspendModalVisible(false)} style={{ flex: 1 }}>Cancel</Button>
              <Button variant="danger" onPress={() => handleAction('suspend', suspendReason)} loading={actionLoading === 'suspend'} disabled={!suspendReason.trim()} style={{ flex: 1 }}>
                Suspend
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  name: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  badges: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  infoCard: { marginBottom: spacing.lg },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  infoLabel: { ...typography.bodySm, color: colors.textSecondary },
  infoValue: { ...typography.bodyMedium, color: colors.text, maxWidth: '55%', textAlign: 'right' },
  sectionTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg },
  modalTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  modalSubtitle: { ...typography.bodySm, color: colors.textSecondary, marginBottom: spacing.md },
  reasonRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm },
  reasonRowActive: { borderRadius: radius.sm },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  reasonText: { ...typography.body, color: colors.text },
  textarea: {
    backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, ...typography.body, color: colors.text,
    minHeight: 100, marginBottom: spacing.md,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
});
