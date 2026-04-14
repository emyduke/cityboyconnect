import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../../components/ui/Avatar';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const maskPhone = (phone?: string) => {
    if (!phone || phone.length < 6) return phone || '';
    return phone.slice(0, 4) + '****' + phone.slice(-3);
  };

  const identityRows = [
    { label: 'Phone', value: maskPhone(user?.phone_number) },
    { label: 'Email', value: user?.email || 'Not set' },
    { label: 'Occupation', value: user?.occupation || '-' },
  ];

  const locationRows = [
    { label: 'State', value: user?.state_name || '-' },
    { label: 'LGA', value: user?.lga_name || '-' },
    { label: 'Ward', value: user?.ward_name || '-' },
  ];

  const membershipRows = [
    { label: 'Membership ID', value: user?.membership_id || '-' },
    { label: 'Referral Code', value: user?.referral_code || '-' },
    { label: 'Role', value: user?.role?.replace(/_/g, ' ') || '-' },
    { label: 'Voter Card', value: user?.voter_verification_status || '-' },
  ];

  const renderGroup = (title: string, rows: { label: string; value: string }[], delay: number) => (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>
        {rows.map((row, i) => (
          <View key={row.label} style={[styles.row, i < rows.length - 1 && styles.rowBorder]}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue}>{row.value}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} bounces>
        {/* Hero Header */}
        <LinearGradient colors={[colors.primaryDark, colors.primary, colors.primaryLight || '#2d6a4f']} style={styles.hero}>
          <SafeAreaView edges={['top']}>
            <View style={styles.heroContent}>
              <Avatar name={user?.full_name || ''} size="xl" />
              <Text style={styles.heroName}>{user?.full_name}</Text>
              {user?.role && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{user.role.replace(/_/g, ' ')}</Text>
                </View>
              )}
              <Text style={styles.heroLocation}>{[user?.state_name, user?.lga_name].filter(Boolean).join(' • ')}</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          {renderGroup('Identity', identityRows, 100)}
          {renderGroup('Location', locationRows, 200)}
          {renderGroup('Membership', membershipRows, 300)}

          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.actionsSection}>
            <Pressable style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutText}>Log Out</Text>
            </Pressable>
          </Animated.View>

          <Text style={styles.version}>City Boy Connect v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xxxl },
  hero: {
    paddingBottom: spacing.xl + spacing.md,
    paddingHorizontal: spacing.lg,
  },
  heroContent: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  heroName: { ...typography.h2, color: '#fff', marginTop: spacing.sm },
  roleBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  roleBadgeText: { ...typography.caption, color: colors.primaryDark, fontFamily: 'PlusJakartaSans-Bold', textTransform: 'capitalize' },
  heroLocation: { ...typography.bodySm, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs },
  body: { paddingHorizontal: spacing.lg, marginTop: -spacing.md },
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.bodySm, color: colors.textSecondary, fontFamily: 'PlusJakartaSans-SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.xs, paddingLeft: spacing.xs },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadows.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowLabel: { ...typography.bodySm, color: colors.textSecondary },
  rowValue: { ...typography.bodyMedium, color: colors.text, maxWidth: '55%', textAlign: 'right' },
  actionsSection: { marginTop: spacing.md },
  logoutBtn: {
    backgroundColor: colors.dangerLight, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: colors.danger + '30',
  },
  logoutText: { ...typography.button, color: colors.danger },
  version: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg },
});
