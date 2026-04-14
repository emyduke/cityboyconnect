import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, typography, shadows } from '../../theme';
import Badge from './Badge';

interface MembershipCardUser {
  full_name?: string;
  membership_id?: string;
  role?: string;
  state_name?: string;
  lga_name?: string;
  ward_name?: string;
}

interface MembershipCardProps {
  user: MembershipCardUser;
  compact?: boolean;
  onPress?: () => void;
}

export default function MembershipCard({ user, compact = false, onPress }: MembershipCardProps) {
  const location = [user.ward_name, user.lga_name, user.state_name].filter(Boolean).join(' • ');

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, shadows.md, compact && styles.compact]}
      >
        <Image
          source={require('../../../assets/files/09_horizontal_transparent.png')}
          style={compact ? styles.logoCompact : styles.logo}
          contentFit="contain"
        />

        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{user.full_name || 'Member'}</Text>
          {user.role && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user.role.replace(/_/g, ' ')}</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.id}>{user.membership_id || '—'}</Text>
          {location ? <Text style={styles.location}>{location}</Text> : null}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  compact: { padding: spacing.md },
  logo: { width: 120, height: 32, marginBottom: spacing.md },
  logoCompact: { width: 100, height: 24, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs, gap: spacing.sm },
  name: { ...typography.h4, color: colors.textInverse, flex: 1 },
  roleBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  roleText: { ...typography.caption, color: colors.primaryDark, fontFamily: 'PlusJakartaSans-Bold', fontSize: 10, textTransform: 'uppercase' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  id: { ...typography.bodySm, color: colors.accentLight, fontFamily: 'PlusJakartaSans-Medium' },
  location: { ...typography.caption, color: 'rgba(255,255,255,0.7)' },
});
