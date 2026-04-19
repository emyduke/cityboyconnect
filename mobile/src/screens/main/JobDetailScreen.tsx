import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
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

  if (loading) return <SafeAreaView className="flex-1 bg-background"><View className="p-4"><Skeleton variant="card" /><Skeleton variant="card" className="mt-4" /></View></SafeAreaView>;
  if (!job) return null;

  const isOwner = user?.id === (job.posted_by?.id || job.posted_by);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView contentContainerClassName="pb-12">
        <View className="p-4 bg-surface shadow-sm">
          <Text className="font-display-bold text-2xl text-gray-900">{job.title}</Text>
          <Text className="font-body-medium text-base text-gray-500 mt-1">{job.company_name}</Text>
          <View className="flex-row gap-1 mt-2 flex-wrap">
            {job.job_type && <View className="bg-forest/10 px-2 py-0.5 rounded-sm"><Text className="font-body text-xs text-forest">{JOB_TYPES[job.job_type] || job.job_type}</Text></View>}
            {job.work_mode && <View className="bg-info-light px-2 py-0.5 rounded-sm"><Text className="font-body text-xs text-info">{WORK_MODES[job.work_mode] || job.work_mode}</Text></View>}
            {job.experience_level && <View className="bg-warning-light px-2 py-0.5 rounded-sm"><Text className="font-body text-xs text-warning">{job.experience_level}</Text></View>}
          </View>
        </View>

        <View className="p-4 bg-surface mt-2 shadow-sm">
          <View className="flex-row justify-between py-1 border-b border-gray-100"><Text className="font-body text-sm text-gray-500">Location</Text><Text className="font-body-medium text-base text-gray-900">{job.location || job.state_name || 'Remote'}</Text></View>
          <View className="flex-row justify-between py-1 border-b border-gray-100"><Text className="font-body text-sm text-gray-500">Salary</Text><Text className="font-body-medium text-base text-gray-900">{job.salary_display || (job.hide_salary ? 'Competitive' : job.salary_min ? `₦${job.salary_min.toLocaleString()}` : '—')}</Text></View>
          {job.application_deadline && <View className="flex-row justify-between py-1 border-b border-gray-100"><Text className="font-body text-sm text-gray-500">Deadline</Text><Text className="font-body-medium text-base text-gray-900">{new Date(job.application_deadline).toLocaleDateString()}</Text></View>}
          <View className="flex-row justify-between py-1 border-b border-gray-100"><Text className="font-body text-sm text-gray-500">Applications</Text><Text className="font-body-medium text-base text-gray-900">{job.application_count ?? 0}</Text></View>
        </View>

        {job.skills?.length > 0 && (
          <View className="p-4 bg-surface mt-2 shadow-sm">
            <Text className="font-display-semibold text-base text-gray-900 mb-2">Skills</Text>
            <View className="flex-row flex-wrap gap-1">
              {job.skills.map((s: any, i: number) => (
                <View key={i} className="bg-forest/10 px-2 py-1 rounded-full"><Text className="font-body text-sm text-forest">{typeof s === 'string' ? s : s.name}</Text></View>
              ))}
            </View>
          </View>
        )}

        {job.description && (
          <View className="p-4 bg-surface mt-2 shadow-sm">
            <Text className="font-display-semibold text-base text-gray-900 mb-2">Description</Text>
            <Text className="font-body text-base text-gray-500">{job.description}</Text>
          </View>
        )}

        {job.requirements && (
          <View className="p-4 bg-surface mt-2 shadow-sm">
            <Text className="font-display-semibold text-base text-gray-900 mb-2">Requirements</Text>
            <Text className="font-body text-base text-gray-500">{job.requirements}</Text>
          </View>
        )}

        {/* Actions */}
        <View className="p-4 gap-2">
          {isOwner ? (
            <>
              <Pressable className="bg-forest py-4 rounded-md items-center" onPress={() => navigation.navigate('CreateJob', { id: job.id })}>
                <Text className="font-body-semibold text-sm text-white">Edit Job</Text>
              </Pressable>
              <Pressable className="bg-surface border border-forest py-4 rounded-md items-center" onPress={() => navigation.navigate('JobApplications', { jobId: job.id })}>
                <Text className="font-body-semibold text-sm text-forest">Manage Applications</Text>
              </Pressable>
            </>
          ) : job.has_applied ? (
            <>
              <View className="bg-success-light py-4 rounded-md items-center">
                <Text className="font-body-medium text-base text-success">Applied ✓ — {job.application_status || 'Submitted'}</Text>
              </View>
              {['APPLIED', 'REVIEWED', 'SHORTLISTED'].includes(job.application_status) && (
                <Pressable className="bg-danger-light py-4 rounded-md items-center" onPress={handleWithdraw}>
                  <Text className="font-body-semibold text-sm text-danger">Withdraw Application</Text>
                </Pressable>
              )}
            </>
          ) : (
            <Pressable className="bg-forest py-4 rounded-md items-center" onPress={() => setShowApply(true)}>
              <Text className="font-body-semibold text-sm text-white">Apply Now</Text>
            </Pressable>
          )}
          <Pressable className="bg-surface border border-forest py-4 rounded-md items-center" onPress={handleSave}>
            <Text className="font-body-semibold text-sm text-forest">{job.is_saved ? '🔖 Saved' : '🏷 Save Job'}</Text>
          </Pressable>
        </View>

        {showApply && (
          <View className="p-4 bg-surface mt-2 shadow-sm">
            <Text className="font-display-semibold text-base text-gray-900 mb-2">Apply</Text>
            <TextInput className="bg-background rounded-sm p-4 font-body text-base text-gray-900 border border-gray-200 min-h-[100px]" placeholder="Cover letter (optional)" placeholderTextColor="#9ca3af" value={coverLetter} onChangeText={setCoverLetter} multiline textAlignVertical="top" />
            <View className="mt-4">
              <Pressable className="bg-forest py-4 rounded-md items-center" onPress={handleApply} disabled={applying}>
                <Text className="font-body-semibold text-sm text-white">{applying ? 'Submitting...' : 'Submit Application'}</Text>
              </Pressable>
              <Pressable onPress={() => setShowApply(false)}>
                <Text className="font-body-medium text-base text-gray-500 text-center mt-2">Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

