import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { getJobs, saveJob } from '../../api/opportunities';
import { unwrap } from '../../api/client';
import Skeleton from '../../components/ui/Skeleton';

const JOB_TYPES: Record<string, string> = { FULL_TIME: 'Full Time', PART_TIME: 'Part Time', CONTRACT: 'Contract', FREELANCE: 'Freelance', INTERNSHIP: 'Internship', VOLUNTEER: 'Volunteer' };
const WORK_MODES: Record<string, string> = { ONSITE: 'On-site', REMOTE: 'Remote', HYBRID: 'Hybrid' };

export default function JobsScreen() {
  const navigation = useNavigation<any>();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page };
      if (search) params.search = search;
      const res = await getJobs(params);
      const d = unwrap(res);
      setJobs(Array.isArray(d) ? d : d?.results || []);
    } catch { setJobs([]); }
    setLoading(false);
    setRefreshing(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const toggleSave = async (id: number) => {
    try {
      await saveJob(id);
      setJobs(prev => prev.map(j => j.id === id ? { ...j, is_saved: !j.is_saved } : j));
    } catch { /* ok */ }
  };

  const renderJob = ({ item }: { item: any }) => (
    <Pressable style={styles.card} onPress={() => navigation.navigate('JobDetail', { id: item.id })}>
      <View style={styles.cardHeader}>
        <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
        <Pressable onPress={() => toggleSave(item.id)}>
          <Text style={{ fontSize: 18 }}>{item.is_saved ? '🔖' : '🏷'}</Text>
        </Pressable>
      </View>
      <Text style={styles.company}>{item.company_name}</Text>
      <View style={styles.badges}>
        {item.job_type && <View style={styles.badge}><Text style={styles.badgeText}>{JOB_TYPES[item.job_type] || item.job_type}</Text></View>}
        {item.work_mode && <View style={[styles.badge, styles.badgeSecondary]}><Text style={[styles.badgeText, styles.badgeTextSecondary]}>{WORK_MODES[item.work_mode] || item.work_mode}</Text></View>}
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.location}>{item.location || item.state_name || 'Remote'}</Text>
        <Text style={styles.salary}>{item.salary_display || (item.hide_salary ? 'Competitive' : item.salary_min ? `₦${item.salary_min.toLocaleString()}` : '')}</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Job Board</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerBtn} onPress={() => navigation.navigate('CreateJob')}>
            <Text style={styles.headerBtnText}>Post</Text>
          </Pressable>
          <Pressable style={styles.headerBtnSec} onPress={() => navigation.navigate('MyJobListings')}>
            <Text style={styles.headerBtnSecText}>My Jobs</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <TextInput style={styles.searchInput} placeholder="Search jobs..." placeholderTextColor={colors.textTertiary} value={search} onChangeText={setSearch} />
      </View>

      {loading ? (
        <View style={styles.loadWrap}>{[1, 2, 3].map(i => <Skeleton key={i} variant="card" style={{ marginBottom: spacing.sm }} />)}</View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={item => String(item.id)}
          renderItem={renderJob}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<Text style={styles.empty}>No jobs found. Try different search terms.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  title: { ...typography.h2, color: colors.text },
  headerActions: { flexDirection: 'row', gap: spacing.xs },
  headerBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm },
  headerBtnText: { ...typography.button, color: colors.textInverse, fontSize: 13 },
  headerBtnSec: { backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary },
  headerBtnSecText: { ...typography.button, color: colors.primary, fontSize: 13 },
  searchWrap: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  searchInput: { backgroundColor: colors.surface, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.body, color: colors.text, borderWidth: 1, borderColor: colors.border },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobTitle: { ...typography.bodyMedium, color: colors.text, flex: 1, marginRight: spacing.sm },
  company: { ...typography.bodySm, color: colors.textSecondary, marginTop: 2 },
  badges: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  badge: { backgroundColor: colors.primary + '15', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  badgeSecondary: { backgroundColor: colors.infoLight },
  badgeText: { ...typography.caption, color: colors.primary },
  badgeTextSecondary: { color: colors.info },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  location: { ...typography.bodySm, color: colors.textTertiary },
  salary: { ...typography.bodyMedium, color: colors.accent, fontSize: 13 },
  loadWrap: { padding: spacing.md },
  empty: { ...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.xl },
});
