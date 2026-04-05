import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Avatar from './ui/Avatar';
import Badge from './ui/Badge';
import { colors, spacing, radius, typography, shadows } from '../theme';

interface MemberCardProps {
  member: {
    id: number;
    full_name: string;
    profile_photo?: string;
    state_name?: string;
    role?: string;
    voter_verification_status?: string;
  };
  onPress?: () => void;
}

export default function MemberCard({ member, onPress }: MemberCardProps) {
  const statusVariant = member.voter_verification_status === 'VERIFIED' ? 'success'
    : member.voter_verification_status === 'REJECTED' ? 'danger' : 'warning';

  return (
    <Pressable onPress={onPress} style={[styles.card, shadows.sm]}>
      <Avatar uri={member.profile_photo} name={member.full_name} size="md" />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{member.full_name}</Text>
        <Text style={styles.sub} numberOfLines={1}>{member.state_name || 'No state'}</Text>
      </View>
      <View style={styles.badges}>
        {member.role && member.role !== 'MEMBER' && (
          <Badge label={member.role.replace(/_/g, ' ')} variant="info" />
        )}
        <Badge label={member.voter_verification_status || 'PENDING'} variant={statusVariant} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  info: { flex: 1, marginLeft: spacing.sm },
  name: { ...typography.bodyMedium, color: colors.text },
  sub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  badges: { alignItems: 'flex-end', gap: 4 },
});
