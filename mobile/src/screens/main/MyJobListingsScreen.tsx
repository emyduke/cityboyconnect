import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { getMyJobListings, deleteJobListing, changeJobStatus } from '../../api/opportunities';
import { unwrap } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import Skeleton from '../../components/ui/Skeleton';

const STATUS_TABS = ['ALL', 'DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED'];

export default function MyJobListingsScreen() {
  const navigation = useNavigation<any>();
  const toast = useToastStore((s) => s.show);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = unwrap(await getMyJobListings());
      setJobs(Array.isArray(res) ? res : res.results || []);
    } catch { toast('Failed to load jobs', 'error'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const filtered = tab === 'ALL' ? jobs : jobs.filter((j) => j.status === tab);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await changeJobStatus(id, { status });
      setJobs((p) => p.map((j) => (j.id === id ? { ...j, status } : j)));
      toast('Status updated', 'success');
    } catch { toast('Failed to update', 'error'); }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteJobListing(id);
      setJobs((p) => p.filter((j) => j.id !== id));
      toast('Job deleted', 'success');
    } catch { toast('Failed to delete', 'error'); }
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = { ACTIVE: colors.success, DRAFT: colors.warning, PAUSED: colors.info, CLOSED: colors.textSecondary };
    return map[s] || colors.textSecondary;
  };

  const renderItem = ({ item }: { item: any }) => (
    <Pressable style={styles.card} onPress={() => navigation.navigate('JobDetail', { id: item.id })}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.cardSub}>{item.company_name} • {item.application_count ?? 0} applicants</Text>
      <View style={styles.cardActions}>
        <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('CreateJob', { id: item.id })}>
          <Text style={styles.actionText}>Edit</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('JobApplications', { jobId: item.id })}>
          <Text style={styles.actionText}>Applications</Text>
        </Pressable>
        {item.status === 'DRAFT' && (
          <Pressable style={styles.actionBtn} onPress={() => handleStatusChange(item.id, 'ACTIVE')}>
            <Text style={[styles.actionText, { color: colors.success }]}>Publish</Text>
          </Pressable>
        )}
        {item.status === 'ACTIVE' && (
          <Pressable style={styles.actionBtn} onPress={() => handleStatusChange(item.id, 'PAUSED')}>
            <Text style={[styles.actionText, { color: colors.warning }]}>Pause</Text>
          </Pressable>
        )}
        {item.status === 'PAUSED' && (
          <Pressable style={styles.actionBtn} onPress={() => handleStatusChange(item.id, 'ACTIVE')}>
            <Text style={[styles.actionText, { color: colors.success }]}>Resume</Text>
          </Pressable>
        )}
      </View>
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
          ListEmptyComponent={<Text style={styles.empty}>No job listings yet</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: colors.surface, ...shadows.sm },
  tab: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full, marginRight: spacing.xs },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.caption, color: colors.textSecondary },
  tabTextActive: { color: colors.textInverse },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { ...typography.bodyMedium, color: colors.text, flex: 1, marginRight: spacing.sm },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  statusText: { ...typography.caption },
  cardSub: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  cardActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  actionBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, backgroundColor: colors.background, borderRadius: radius.sm },
  actionText: { ...typography.caption, color: colors.primary },
  empty: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl },
});
