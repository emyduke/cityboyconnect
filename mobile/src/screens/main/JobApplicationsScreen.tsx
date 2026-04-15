import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { getJobApplications, updateApplicationStatus } from '../../api/opportunities';
import { unwrap } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import Skeleton from '../../components/ui/Skeleton';
import Avatar from '../../components/ui/Avatar';

const STATUS_TABS = ['ALL', 'APPLIED', 'REVIEWED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED'];
const STATUS_OPTIONS = ['REVIEWED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED'];

export default function JobApplicationsScreen() {
  const route = useRoute<any>();
  const toast = useToastStore((s) => s.show);
  const { jobId } = route.params;
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = unwrap(await getJobApplications(jobId));
      setApps(Array.isArray(res) ? res : res.results || []);
    } catch { toast('Failed to load applications', 'error'); }
    setLoading(false);
  }, [jobId]);

  useEffect(() => { load(); }, []);

  const filtered = tab === 'ALL' ? apps : apps.filter((a) => a.status === tab);

  const handleStatusChange = async (appId: number, status: string) => {
    try {
      await updateApplicationStatus(jobId, appId, { status, recruiter_notes: notes || undefined });
      setApps((p) => p.map((a) => (a.id === appId ? { ...a, status } : a)));
      toast('Status updated', 'success');
      setExpandedId(null);
      setNotes('');
    } catch { toast('Failed to update', 'error'); }
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      APPLIED: colors.info, REVIEWED: colors.warning, SHORTLISTED: colors.primary,
      ACCEPTED: colors.success, REJECTED: colors.danger,
    };
    return map[s] || colors.textSecondary;
  };

  const renderItem = ({ item }: { item: any }) => {
    const expanded = expandedId === item.id;
    return (
      <Pressable style={styles.card} onPress={() => { setExpandedId(expanded ? null : item.id); setNotes(item.recruiter_notes || ''); }}>
        <View style={styles.cardHeader}>
          <Avatar name={item.applicant_name || item.applicant?.full_name || 'User'} size={40} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.name}>{item.applicant_name || item.applicant?.full_name || 'Applicant'}</Text>
            <Text style={styles.date}>Applied {new Date(item.created_at || item.applied_at).toLocaleDateString()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
          </View>
        </View>
        {item.cover_letter && <Text style={styles.coverLetter} numberOfLines={expanded ? undefined : 3}>{item.cover_letter}</Text>}

        {expanded && (
          <View style={styles.expandedSection}>
            <TextInput
              style={styles.notesInput}
              placeholder="Recruiter notes..."
              placeholderTextColor={colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
            <View style={styles.statusActions}>
              {STATUS_OPTIONS.map((s) => (
                <Pressable key={s} style={[styles.statusBtn, { borderColor: statusColor(s) }]} onPress={() => handleStatusChange(item.id, s)}>
                  <Text style={[styles.statusBtnText, { color: statusColor(s) }]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </Pressable>
    );
  };

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
  name: { ...typography.bodyMedium, color: colors.text },
  date: { ...typography.caption, color: colors.textSecondary },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  statusText: { ...typography.caption },
  coverLetter: { ...typography.bodySm, color: colors.textSecondary, marginTop: spacing.sm },
  expandedSection: { marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider },
  notesInput: { backgroundColor: colors.background, borderRadius: radius.sm, padding: spacing.sm, ...typography.bodySm, color: colors.text, minHeight: 60, borderWidth: 1, borderColor: colors.border, textAlignVertical: 'top' },
  statusActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  statusBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm, borderWidth: 1 },
  statusBtnText: { ...typography.caption },
  empty: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl },
});
