import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { getJobDetail, applyToJob, saveJob, withdrawApplication } from '../../api/opportunities';
import { unwrap } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import Skeleton from '../../components/ui/Skeleton';

const JOB_TYPES: Record<string, string> = { FULL_TIME: 'Full Time', PART_TIME: 'Part Time', CONTRACT: 'Contract', FREELANCE: 'Freelance', INTERNSHIP: 'Internship', VOLUNTEER: 'Volunteer' };
const WORK_MODES: Record<string, string> = { ONSITE: 'On-site', REMOTE: 'Remote', HYBRID: 'Hybrid' };

export default function JobDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const toast = useToastStore((s) => s.show);
  const user = useAuthStore((s) => s.user);
  const { id } = route.params;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getJobDetail(id);
        setJob(unwrap(res));
      } catch { navigation.goBack(); }
      setLoading(false);
    })();
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    try {
      const fd = new FormData();
      if (coverLetter) fd.append('cover_letter', coverLetter);
      fd.append('use_profile_cv', 'true');
      await applyToJob(id, fd);
      toast('Application submitted!', 'success');
      setShowApply(false);
      setJob((p: any) => ({ ...p, has_applied: true, application_status: 'APPLIED' }));
    } catch (err: any) {
      toast(err?.response?.data?.error?.message || 'Failed to apply', 'error');
    }
    setApplying(false);
  };

  const handleWithdraw = async () => {
    try {
      await withdrawApplication(job.my_application_id);
      toast('Application withdrawn', 'success');
      setJob((p: any) => ({ ...p, has_applied: false, application_status: null }));
    } catch { toast('Failed to withdraw', 'error'); }
  };

  const handleSave = async () => {
    try {
      await saveJob(id);
      setJob((p: any) => ({ ...p, is_saved: !p.is_saved }));
    } catch { /* ok */ }
  };

  if (loading) return <SafeAreaView style={styles.safe}><View style={styles.pad}><Skeleton variant="card" /><Skeleton variant="card" style={{ marginTop: spacing.md }} /></View></SafeAreaView>;
  if (!job) return null;

  const isOwner = user?.id === (job.posted_by?.id || job.posted_by);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.company}>{job.company_name}</Text>
          <View style={styles.badges}>
            {job.job_type && <View style={styles.badge}><Text style={styles.badgeText}>{JOB_TYPES[job.job_type] || job.job_type}</Text></View>}
            {job.work_mode && <View style={[styles.badge, { backgroundColor: colors.infoLight }]}><Text style={[styles.badgeText, { color: colors.info }]}>{WORK_MODES[job.work_mode] || job.work_mode}</Text></View>}
            {job.experience_level && <View style={[styles.badge, { backgroundColor: colors.warningLight }]}><Text style={[styles.badgeText, { color: colors.warning }]}>{job.experience_level}</Text></View>}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Location</Text><Text style={styles.detailValue}>{job.location || job.state_name || 'Remote'}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Salary</Text><Text style={styles.detailValue}>{job.salary_display || (job.hide_salary ? 'Competitive' : job.salary_min ? `₦${job.salary_min.toLocaleString()}` : '—')}</Text></View>
          {job.application_deadline && <View style={styles.detailRow}><Text style={styles.detailLabel}>Deadline</Text><Text style={styles.detailValue}>{new Date(job.application_deadline).toLocaleDateString()}</Text></View>}
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Applications</Text><Text style={styles.detailValue}>{job.application_count ?? 0}</Text></View>
        </View>

        {job.skills?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsRow}>
              {job.skills.map((s: any, i: number) => (
                <View key={i} style={styles.skillBadge}><Text style={styles.skillText}>{typeof s === 'string' ? s : s.name}</Text></View>
              ))}
            </View>
          </View>
        )}

        {job.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.body}>{job.description}</Text>
          </View>
        )}

        {job.requirements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            <Text style={styles.body}>{job.requirements}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {isOwner ? (
            <>
              <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('CreateJob', { id: job.id })}>
                <Text style={styles.primaryBtnText}>Edit Job</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => navigation.navigate('JobApplications', { jobId: job.id })}>
                <Text style={styles.secondaryBtnText}>Manage Applications</Text>
              </Pressable>
            </>
          ) : job.has_applied ? (
            <>
              <View style={[styles.statusBadge, { backgroundColor: colors.successLight }]}>
                <Text style={{ ...typography.bodyMedium, color: colors.success }}>Applied ✓ — {job.application_status || 'Submitted'}</Text>
              </View>
              {['APPLIED', 'REVIEWED', 'SHORTLISTED'].includes(job.application_status) && (
                <Pressable style={styles.dangerBtn} onPress={handleWithdraw}>
                  <Text style={styles.dangerBtnText}>Withdraw Application</Text>
                </Pressable>
              )}
            </>
          ) : (
            <Pressable style={styles.primaryBtn} onPress={() => setShowApply(true)}>
              <Text style={styles.primaryBtnText}>Apply Now</Text>
            </Pressable>
          )}
          <Pressable style={styles.secondaryBtn} onPress={handleSave}>
            <Text style={styles.secondaryBtnText}>{job.is_saved ? '🔖 Saved' : '🏷 Save Job'}</Text>
          </Pressable>
        </View>

        {showApply && (
          <View style={styles.applyForm}>
            <Text style={styles.sectionTitle}>Apply</Text>
            <TextInput style={[styles.input, { minHeight: 100 }]} placeholder="Cover letter (optional)" placeholderTextColor={colors.textTertiary} value={coverLetter} onChangeText={setCoverLetter} multiline textAlignVertical="top" />
            <View style={styles.applyActions}>
              <Pressable style={styles.primaryBtn} onPress={handleApply} disabled={applying}>
                <Text style={styles.primaryBtnText}>{applying ? 'Submitting...' : 'Submit Application'}</Text>
              </Pressable>
              <Pressable onPress={() => setShowApply(false)}>
                <Text style={{ ...typography.bodyMedium, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  pad: { padding: spacing.md },
  scroll: { paddingBottom: spacing.xxl },
  hero: { padding: spacing.md, backgroundColor: colors.surface, ...shadows.sm },
  title: { ...typography.h2, color: colors.text },
  company: { ...typography.bodyMedium, color: colors.textSecondary, marginTop: spacing.xs },
  badges: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, flexWrap: 'wrap' },
  badge: { backgroundColor: colors.primary + '15', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  badgeText: { ...typography.caption, color: colors.primary },
  section: { padding: spacing.md, backgroundColor: colors.surface, marginTop: spacing.sm, ...shadows.sm },
  sectionTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.textSecondary },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.divider },
  detailLabel: { ...typography.bodySm, color: colors.textSecondary },
  detailValue: { ...typography.bodyMedium, color: colors.text },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  skillBadge: { backgroundColor: colors.primary + '15', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full },
  skillText: { ...typography.bodySm, color: colors.primary },
  actions: { padding: spacing.md, gap: spacing.sm },
  primaryBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  primaryBtnText: { ...typography.button, color: colors.textInverse },
  secondaryBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  secondaryBtnText: { ...typography.button, color: colors.primary },
  dangerBtn: { backgroundColor: colors.dangerLight, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  dangerBtnText: { ...typography.button, color: colors.danger },
  statusBadge: { paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  applyForm: { padding: spacing.md, backgroundColor: colors.surface, marginTop: spacing.sm, ...shadows.sm },
  input: { backgroundColor: colors.background, borderRadius: radius.sm, padding: spacing.md, ...typography.body, color: colors.text, borderWidth: 1, borderColor: colors.border },
  applyActions: { marginTop: spacing.md },
});
