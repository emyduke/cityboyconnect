import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { getMember } from '../../api/members';
import { unwrap } from '../../api/client';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import { MembersStackParamList } from '../../navigation/types';

type Route = RouteProp<MembersStackParamList, 'MemberDetail'>;

export default function MemberDetailScreen() {
  const { params } = useRoute<Route>();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMember(params.id);
        setMember(unwrap(res));
      } catch { /* handled */ }
      setLoading(false);
    })();
  }, [params.id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Skeleton variant="avatar" width={80} height={80} style={{ alignSelf: 'center' }} />
        <Skeleton variant="text" width="50%" style={{ alignSelf: 'center', marginTop: spacing.md }} />
        <Skeleton variant="card" style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  if (!member) {
    return <View style={styles.container}><Text style={styles.error}>Member not found</Text></View>;
  }

  const statusVariant = member.voter_verification_status === 'VERIFIED' ? 'success'
    : member.voter_verification_status === 'REJECTED' ? 'danger' : 'warning';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <View style={styles.header}>
        <Avatar uri={member.profile_photo} name={member.full_name} size="xl" />
        <Text style={styles.name}>{member.full_name}</Text>
        <View style={styles.badges}>
          {member.role && <Badge label={member.role.replace(/_/g, ' ')} variant="info" />}
          <Badge label={member.voter_verification_status || 'PENDING'} variant={statusVariant} />
        </View>
      </View>

      <Card style={styles.infoCard}>
        <InfoRow label="Phone" value={member.phone_number_masked || '***'} />
        <InfoRow label="State" value={member.state_name} />
        <InfoRow label="LGA" value={member.lga_name} />
        <InfoRow label="Ward" value={member.ward_name} />
        <InfoRow label="Occupation" value={member.occupation} />
        <InfoRow label="Gender" value={member.gender === 'M' ? 'Male' : member.gender === 'F' ? 'Female' : member.gender} />
        <InfoRow label="Membership ID" value={member.membership_id} />
        <InfoRow label="Referral Code" value={member.referral_code} />
        <InfoRow label="Joined" value={member.joined_at ? new Date(member.joined_at).toLocaleDateString() : ''} />
      </Card>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  name: { ...typography.h2, color: colors.text, marginTop: spacing.sm },
  badges: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  infoCard: { marginTop: spacing.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  infoLabel: { ...typography.bodySm, color: colors.textSecondary },
  infoValue: { ...typography.bodyMedium, color: colors.text, textAlign: 'right', flex: 1, marginLeft: spacing.md },
  error: { ...typography.body, color: colors.danger, textAlign: 'center', marginTop: spacing.xxl },
});
