import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { getMyApplications, withdrawApplication } from '../../api/opportunities';
import { unwrap } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import Skeleton from '../../components/ui/Skeleton';

const STATUS_TABS = ['ALL', 'APPLIED', 'REVIEWED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'];

export default function MyApplicationsScreen() {
  const navigation = useNavigation<any>();
  const toast = useToastStore((s) => s.show);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = unwrap(await getMyApplications());
      setApps(Array.isArray(res) ? res : res.results || []);
    } catch { toast('Failed to load applications', 'error'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const filtered = tab === 'ALL' ? apps : apps.filter((a) => a.status === tab);

  const handleWithdraw = async (id: number) => {
    try {
      await withdrawApplication(id);
      setApps((p) => p.map((a) => (a.id === id ? { ...a, status: 'WITHDRAWN' } : a)));
      toast('Application withdrawn', 'success');
    } catch { toast('Failed to withdraw', 'error'); }
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      APPLIED: colors.info, REVIEWED: colors.warning, SHORTLISTED: colors.primary,
      ACCEPTED: colors.success, REJECTED: colors.danger, WITHDRAWN: colors.textTertiary,
    };
    return map[s] || colors.textSecondary;
  };

  const renderItem = ({ item }: { item: any }) => (
    <Pressable style={styles.card} onPress={() => navigation.navigate('JobDetail', { id: item.job_id || item.job?.id })}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.job_title || item.job?.title || 'Job'}</Text>
          <Text style={styles.cardSub}>{item.company_name || item.job?.company_name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.date}>Applied {new Date(item.created_at || item.applied_at).toLocaleDateString()}</Text>
      {['APPLIED', 'REVIEWED', 'SHORTLISTED'].includes(item.status) && (
        <Pressable style={styles.withdrawBtn} onPress={() => handleWithdraw(item.id)}>
          <Text style={styles.withdrawText}>Withdraw</Text>
        </Pressable>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.tabs}>
        {STATUS_TABS.map((t) => (
          <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>
      {loading ? (
        <View style={{ padding: spacing.md }}><Skeleton variant="card" /><Skeleton variant="card" style={{ marginTop: spacing.sm }} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
          ListEmptyComponent={<Text style={styles.empty}>No applications yet</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.xs, paddingVertical: spacing.xs, backgroundColor: colors.surface, ...shadows.sm, flexWrap: 'wrap' },
  tab: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full, marginRight: spacing.xs, marginBottom: spacing.xs },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.caption, color: colors.textSecondary },
  tabTextActive: { color: colors.textInverse },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { ...typography.bodyMedium, color: colors.text },
  cardSub: { ...typography.caption, color: colors.textSecondary },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  statusText: { ...typography.caption },
  date: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.xs },
  withdrawBtn: { marginTop: spacing.sm, alignSelf: 'flex-start', paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, backgroundColor: colors.dangerLight, borderRadius: radius.sm },
  withdrawText: { ...typography.caption, color: colors.danger },
  empty: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl },
});
