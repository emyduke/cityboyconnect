import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { getSavedJobs, saveJob } from '../../api/opportunities';
import { unwrap } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import Skeleton from '../../components/ui/Skeleton';

export default function SavedJobsScreen() {
  const navigation = useNavigation<any>();
  const toast = useToastStore((s) => s.show);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = unwrap(await getSavedJobs());
      setJobs(Array.isArray(res) ? res : res.results || []);
    } catch { toast('Failed to load saved jobs', 'error'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const handleUnsave = async (id: number) => {
    try {
      await saveJob(id);
      setJobs((p) => p.filter((j) => (j.job_id || j.job?.id || j.id) !== id));
      toast('Removed from saved', 'success');
    } catch { toast('Failed to unsave', 'error'); }
  };

  const renderItem = ({ item }: { item: any }) => {
    const job = item.job || item;
    const jobId = item.job_id || job.id;
    return (
      <Pressable style={styles.card} onPress={() => navigation.navigate('JobDetail', { id: jobId })}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{job.title}</Text>
            <Text style={styles.cardSub}>{job.company_name}</Text>
          </View>
          <Pressable style={styles.unsaveBtn} onPress={() => handleUnsave(jobId)}>
            <Text style={styles.unsaveText}>🔖 Remove</Text>
          </Pressable>
        </View>
        {job.location && <Text style={styles.location}>📍 {job.location}</Text>}
        {job.job_type && <Text style={styles.meta}>{job.job_type.replace('_', ' ')} • {job.work_mode || ''}</Text>}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {loading ? (
        <View style={{ padding: spacing.md }}><Skeleton variant="card" /><Skeleton variant="card" style={{ marginTop: spacing.sm }} /></View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item, i) => (item.id || i).toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
          ListEmptyComponent={<Text style={styles.empty}>No saved jobs yet</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { ...typography.bodyMedium, color: colors.text },
  cardSub: { ...typography.caption, color: colors.textSecondary },
  unsaveBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, backgroundColor: colors.warningLight, borderRadius: radius.sm },
  unsaveText: { ...typography.caption, color: colors.warning },
  location: { ...typography.bodySm, color: colors.textSecondary, marginTop: spacing.xs },
  meta: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
  empty: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl },
});
