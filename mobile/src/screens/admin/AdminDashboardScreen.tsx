import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { adminApi } from '../../api/admin';
import StatCard from '../../components/StatCard';
import Skeleton from '../../components/ui/Skeleton';
import Card from '../../components/ui/Card';

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const [overview, setOverview] = useState<any>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [ov, af] = await Promise.all([
        adminApi.getOverview(),
        adminApi.getActivityFeed(20),
      ]);
      setOverview(ov.data || ov);
      setFeed(Array.isArray(af.data) ? af.data : af.results || []);
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

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

  const stats = [
    { label: 'Total Members', value: overview?.total_members ?? 0 },
    { label: 'Pending', value: overview?.pending_verifications ?? 0 },
    { label: 'Verified', value: overview?.verified_members ?? 0 },
    { label: 'Suspended', value: overview?.suspended_members ?? 0 },
  ];

  const adminLinks = [
    { label: 'Members', screen: 'AdminMembers', icon: '👥' },
    { label: 'Verifications', screen: 'AdminVerifications', icon: '✅' },
    { label: 'Structure', screen: 'AdminStructure', icon: '🏛️' },
    { label: 'Events', screen: 'AdminEvents', icon: '📅' },
    { label: 'Announcements', screen: 'AdminAnnouncements', icon: '📢' },
    { label: 'Reports', screen: 'AdminReports', icon: '📊' },
    { label: 'Audit Log', screen: 'AdminAuditLog', icon: '📋' },
    { label: 'Settings', screen: 'AdminSettings', icon: '⚙️' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Stats grid */}
        <View style={styles.grid}>
          {stats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} style={{ flex: 1 }} />
          ))}
        </View>

        {/* Quick links */}
        <Text style={styles.sectionTitle}>Admin Sections</Text>
        <View style={styles.linkGrid}>
          {adminLinks.map((link) => (
            <Card key={link.screen} style={styles.linkCard} onPress={() => navigation.navigate(link.screen)}>
              <Text style={styles.linkIcon}>{link.icon}</Text>
              <Text style={styles.linkLabel}>{link.label}</Text>
            </Card>
          ))}
        </View>

        {/* Activity feed */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {feed.length === 0 ? (
          <Text style={styles.empty}>No recent activity</Text>
        ) : (
          feed.slice(0, 10).map((item, idx) => (
            <View key={idx} style={styles.feedItem}>
              <Text style={styles.feedText}>{item.description || item.action || JSON.stringify(item)}</Text>
              <Text style={styles.feedTime}>{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  sectionTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.sm },
  linkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  linkCard: { width: '47%', alignItems: 'center', padding: spacing.md },
  linkIcon: { fontSize: 28, marginBottom: 4 },
  linkLabel: { ...typography.bodySm, color: colors.text, textAlign: 'center' },
  feedItem: { backgroundColor: colors.surface, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.xs, ...shadows.sm },
  feedText: { ...typography.bodySm, color: colors.text },
  feedTime: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
  empty: { ...typography.bodySm, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.md },
});
