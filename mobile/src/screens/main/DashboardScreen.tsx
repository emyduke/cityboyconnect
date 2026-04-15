import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, spacing, typography, shadows, radius } from '../../theme';
import { getDashboardOverview } from '../../api/dashboard';
import { getAnnouncements } from '../../api/announcements';
import { unwrap } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import MembershipCard from '../../components/ui/MembershipCard';
import Avatar from '../../components/ui/Avatar';
import Skeleton from '../../components/ui/Skeleton';

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<any>();
  const [data, setData] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, annRes] = await Promise.all([
        getDashboardOverview(),
        getAnnouncements({ page_size: 3 }),
      ]);
      setData(unwrap(dashRes));
      const annData = unwrap(annRes);
      setAnnouncements(Array.isArray(annData) ? annData.slice(0, 3) : (annData?.results || []).slice(0, 3));
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

  const firstName = user?.full_name?.split(' ')[0] || 'Member';
  const isAdmin = user?.role && ['SUPER_ADMIN', 'NATIONAL_OFFICER', 'STATE_DIRECTOR'].includes(user.role);

  const stats = [
    { icon: '👥', label: 'Members', value: data?.total_members ?? 0, color: colors.primary },
    { icon: '✅', label: 'Verified', value: data?.verified_members ?? 0, color: '#16a34a' },
    { icon: '🔗', label: 'Referrals', value: data?.my_referrals ?? 0, color: colors.accent },
    { icon: '⭐', label: 'Score', value: data?.my_score ?? 0, color: '#d97706' },
  ];

  const quickActions = [
    { icon: '📱', label: 'My QR', screen: 'MyQRCode', tab: 'MoreTab' },
    { icon: '🌐', label: 'Network', screen: 'MyNetwork', tab: 'MoreTab' },
    { icon: '�', label: 'Opportunities', screen: 'Opportunities', tab: 'MoreTab' },
    { icon: '📋', label: 'Jobs', screen: 'Jobs', tab: 'MoreTab' },
    { icon: '�📅', label: 'Events', screen: null, tab: 'EventsTab' },
    { icon: '📢', label: 'Announce', screen: 'Announcements', tab: 'MoreTab' },
    { icon: '🏆', label: 'Ranks', screen: null, tab: 'RanksTab' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadWrap}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="card" style={{ marginTop: spacing.md }} />
          <Skeleton variant="card" style={{ marginTop: spacing.md }} />
          <Skeleton variant="card" style={{ marginTop: spacing.md }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        bounces
      >
        {/* Green Header */}
        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.header}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <View style={styles.greetingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.greetingText}>{greeting()},</Text>
                  <Text style={styles.nameText}>{firstName} 👋</Text>
                </View>
                <Pressable onPress={() => navigation.navigate('MoreTab', { screen: 'Profile' })}>
                  <Avatar name={user?.full_name || ''} size="md" />
                </Pressable>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Membership Card - overlapping header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.cardWrap}>
          {user && <MembershipCard user={user} compact onPress={() => navigation.navigate('MoreTab', { screen: 'Profile' })} />}
        </Animated.View>

        <View style={styles.body}>
          {/* Stats Grid 2x2 */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statsGrid}>
            {stats.map((s, i) => (
              <View key={s.label} style={styles.statCard}>
                <View style={[styles.statIconBg, { backgroundColor: s.color + '15' }]}>
                  <Text style={{ fontSize: 20 }}>{s.icon}</Text>
                </View>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {quickActions.map((item) => (
                <Pressable
                  key={item.label}
                  style={styles.chip}
                  onPress={() => {
                    if (item.screen) {
                      navigation.navigate(item.tab, { screen: item.screen });
                    } else {
                      navigation.navigate(item.tab);
                    }
                  }}
                >
                  <Text style={styles.chipIcon}>{item.icon}</Text>
                  <Text style={styles.chipLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Recent Announcements */}
          {announcements.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400).duration(400)}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Announcements</Text>
                <Pressable onPress={() => navigation.navigate('MoreTab', { screen: 'Announcements' })}>
                  <Text style={styles.seeAll}>See all →</Text>
                </Pressable>
              </View>
              {announcements.map((ann) => (
                <Pressable
                  key={ann.id}
                  style={styles.annCard}
                  onPress={() => navigation.navigate('MoreTab', { screen: 'AnnouncementDetail', params: { id: ann.id } })}
                >
                  <View style={[styles.annPriority, {
                    backgroundColor: ann.priority === 'URGENT' ? colors.danger + '20' : ann.priority === 'IMPORTANT' ? colors.accent + '20' : colors.primaryLight + '15',
                  }]}>
                    <Text style={{ fontSize: 12 }}>
                      {ann.priority === 'URGENT' ? '🔴' : ann.priority === 'IMPORTANT' ? '🟡' : '🟢'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.annTitle} numberOfLines={1}>{ann.title}</Text>
                    <Text style={styles.annDate}>
                      {ann.published_at ? new Date(ann.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </Animated.View>
          )}

          {/* City Boys Bubbles */}
          <Animated.View entering={FadeInDown.delay(450).duration(400)}>
            <Pressable
              style={[styles.bubblesCard, shadows.sm]}
              onPress={() => navigation.navigate('MoreTab', { screen: 'Bubbles' })}
            >
              <Text style={styles.bubblesTitle}>🫧 City Boys Bubbles</Text>
              <Text style={styles.bubblesSub}>Local support for your community</Text>
            </Pressable>
          </Animated.View>

          {/* Admin Panel */}
          {isAdmin && (
            <Animated.View entering={FadeInDown.delay(500).duration(400)}>
              <Pressable
                style={[styles.adminCard, shadows.md]}
                onPress={() => navigation.navigate('MoreTab', { screen: 'AdminDashboard' })}
              >
                <Text style={styles.adminText}>🛡️ Admin Panel →</Text>
                <Text style={styles.adminSub}>Manage members, verifications & more</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loadWrap: { padding: spacing.lg },
  scroll: { paddingBottom: spacing.xxxl },
  header: {
    paddingBottom: spacing.xxl + spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    paddingTop: spacing.md,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingText: { ...typography.body, color: 'rgba(255,255,255,0.8)' },
  nameText: { ...typography.h2, color: '#fff', marginTop: 2 },
  cardWrap: {
    marginTop: -spacing.xl - spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  body: { paddingHorizontal: spacing.lg },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.sm,
    flexGrow: 1,
  },
  statIconBg: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statValue: { ...typography.h2, color: colors.text },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  seeAll: { ...typography.bodySm, color: colors.primary, fontFamily: 'PlusJakartaSans-SemiBold' },
  chipsRow: { gap: spacing.sm, paddingBottom: spacing.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
    gap: spacing.xs,
  },
  chipIcon: { fontSize: 16 },
  chipLabel: { ...typography.bodySm, color: colors.text, fontFamily: 'PlusJakartaSans-Medium' },
  annCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    ...shadows.sm,
  },
  annPriority: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  annTitle: { ...typography.bodyMedium, color: colors.text },
  annDate: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
  adminCard: {
    backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg,
    marginTop: spacing.lg,
  },
  adminText: { ...typography.h4, color: colors.accent },
  adminSub: { ...typography.bodySm, color: colors.textInverse, opacity: 0.8, marginTop: 2 },
  bubblesCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    marginTop: spacing.md,
  },
  bubblesTitle: { ...typography.h4, color: colors.primary },
  bubblesSub: { ...typography.bodySm, color: colors.textSecondary, marginTop: 2 },
});
