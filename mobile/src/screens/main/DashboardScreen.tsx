import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, shadows, radius } from '../../theme';
import { getDashboardOverview } from '../../api/dashboard';
import { unwrap } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import StatCard from '../../components/StatCard';
import Skeleton from '../../components/ui/Skeleton';

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<any>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await getDashboardOverview();
      setData(unwrap(res));
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const isAdmin = user?.role && ['SUPER_ADMIN', 'NATIONAL_OFFICER', 'STATE_DIRECTOR'].includes(user.role);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="card" style={{ marginTop: spacing.md }} />
          <Skeleton variant="card" style={{ marginTop: spacing.md }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.greeting}>{greeting()},</Text>
        <Text style={styles.name}>{user?.full_name?.split(' ')[0]} 👋</Text>

        {/* Quick Actions */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow}>
          {[
            { icon: '📱', label: 'My QR', screen: 'MyQRCode', tab: 'MoreTab' },
            { icon: '🌐', label: 'Network', screen: 'MyNetwork', tab: 'MoreTab' },
            { icon: '📅', label: 'Events', screen: null, tab: 'EventsTab' },
            { icon: '📢', label: 'Announce', screen: 'Announcements', tab: 'MoreTab' },
          ].map((item) => (
            <Pressable
              key={item.label}
              style={styles.quickItem}
              onPress={() => {
                if (item.screen) {
                  navigation.navigate(item.tab, { screen: item.screen });
                } else {
                  navigation.navigate(item.tab);
                }
              }}
            >
              <View style={styles.quickIcon}><Text style={{ fontSize: 22 }}>{item.icon}</Text></View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCard label="Members" value={data?.total_members ?? 0} icon="👥" />
          <StatCard label="Verified" value={data?.verified_members ?? 0} icon="✅" />
        </View>
        <View style={[styles.statsGrid, { marginTop: spacing.sm }]}>
          <StatCard label="My Referrals" value={data?.my_referrals ?? 0} icon="🔗" />
          <StatCard label="Score" value={data?.my_score ?? 0} icon="⭐" />
        </View>

        {/* Admin card */}
        {isAdmin && (
          <Pressable
            style={[styles.adminCard, shadows.md]}
            onPress={() => navigation.navigate('MoreTab', { screen: 'AdminDashboard' })}
          >
            <Text style={styles.adminText}>Admin Panel →</Text>
            <Text style={styles.adminSub}>Manage members, verifications & more</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  greeting: { ...typography.body, color: colors.textSecondary },
  name: { ...typography.h1, color: colors.text, marginBottom: spacing.lg },
  quickRow: { marginBottom: spacing.lg },
  quickItem: { alignItems: 'center', marginRight: spacing.lg },
  quickIcon: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', ...shadows.sm,
  },
  quickLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  statsGrid: { flexDirection: 'row', gap: spacing.sm },
  adminCard: {
    backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg,
    marginTop: spacing.lg,
  },
  adminText: { ...typography.h4, color: colors.accent },
  adminSub: { ...typography.bodySm, color: colors.textInverse, opacity: 0.8, marginTop: 2 },
});
