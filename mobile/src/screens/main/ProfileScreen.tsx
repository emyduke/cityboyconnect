import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../../components/ui/Avatar';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigation = useNavigation<any>();

  const handleLogout = () => {
    logout();
  };

  const maskPhone = (phone?: string) => {
    if (!phone || phone.length < 6) return phone || '';
    return phone.slice(0, 4) + '****' + phone.slice(-3);
  };

  const infoRows: { label: string; value: string }[] = [
    { label: 'Phone', value: maskPhone(user?.phone_number) },
    { label: 'Email', value: user?.email || 'Not set' },
    { label: 'Membership ID', value: user?.membership_id || '-' },
    { label: 'Referral Code', value: user?.referral_code || '-' },
    { label: 'Role', value: user?.role || '-' },
    { label: 'State', value: user?.state_name || '-' },
    { label: 'LGA', value: user?.lga_name || '-' },
    { label: 'Ward', value: user?.ward_name || '-' },
    { label: 'Occupation', value: user?.occupation || '-' },
    { label: 'Voter Card', value: user?.voter_verification_status || '-' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Avatar name={user?.full_name || ''} size="xl" />
          <Text style={styles.name}>{user?.full_name}</Text>
          <Text style={styles.sub}>{user?.state_name || ''}</Text>
        </View>

        <View style={styles.card}>
          {infoRows.map((row, i) => (
            <View key={row.label} style={[styles.row, i < infoRows.length - 1 && styles.rowBorder]}>
              <Text style={styles.label}>{row.label}</Text>
              <Text style={styles.value}>{row.value}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        <Text style={styles.version}>City Boy Connect v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md, paddingBottom: spacing.xxxl },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  name: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  sub: { ...typography.bodySm, color: colors.textSecondary },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadows.sm, marginBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  label: { ...typography.bodySm, color: colors.textSecondary },
  value: { ...typography.bodyMedium, color: colors.text, maxWidth: '55%', textAlign: 'right' },
  logoutBtn: { backgroundColor: colors.dangerLight, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  logoutText: { ...typography.button, color: colors.danger },
  version: { ...typography.caption, color: colors.textTertiary, textAlign: 'center' },
});
