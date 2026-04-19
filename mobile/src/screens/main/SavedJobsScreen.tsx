import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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
      <Pressable className="bg-surface rounded-md p-4 mb-2 shadow-sm" onPress={() => navigation.navigate('JobDetail', { id: jobId })}>
        <View className="flex-row items-center">
          <View className="flex-1">
            <Text className="font-body-medium text-base text-gray-900" numberOfLines={1}>{job.title}</Text>
            <Text className="font-body text-xs text-gray-500">{job.company_name}</Text>
          </View>
          <Pressable className="py-1 px-2 bg-warning-light rounded-sm" onPress={() => handleUnsave(jobId)}>
            <Text className="font-body text-xs text-warning">🔖 Remove</Text>
          </Pressable>
        </View>
        {job.location && <Text className="font-body text-sm text-gray-500 mt-1">📍 {job.location}</Text>}
        {job.job_type && <Text className="font-body text-xs text-gray-400 mt-0.5">{job.job_type.replace('_', ' ')} • {job.work_mode || ''}</Text>}
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      {loading ? (
        <View className="p-4"><Skeleton variant="card" /><Skeleton variant="card" className="mt-2" /></View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item, i) => (item.id || i).toString()}
          renderItem={renderItem}
          contentContainerClassName="p-4 pb-12"
          ListEmptyComponent={<Text className="font-body text-base text-gray-500 text-center mt-12">No saved jobs yet</Text>}
        />
      )}
    </SafeAreaView>
  );
}

