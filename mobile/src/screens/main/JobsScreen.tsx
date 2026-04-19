import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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
    <Pressable className="bg-surface rounded-md p-4 mb-2 shadow-sm" onPress={() => navigation.navigate('JobDetail', { id: item.id })}>
      <View className="flex-row justify-between items-center">
        <Text className="font-body-medium text-base text-gray-900 flex-1 mr-2" numberOfLines={1}>{item.title}</Text>
        <Pressable onPress={() => toggleSave(item.id)}>
          <Text style={{ fontSize: 18 }}>{item.is_saved ? '🔖' : '🏷'}</Text>
        </Pressable>
      </View>
      <Text className="font-body text-sm text-gray-500 mt-0.5">{item.company_name}</Text>
      <View className="flex-row gap-1 mt-2">
        {item.job_type && <View className="bg-forest/10 px-2 py-0.5 rounded-sm"><Text className="font-body text-xs text-forest">{JOB_TYPES[item.job_type] || item.job_type}</Text></View>}
        {item.work_mode && <View className="bg-info-light px-2 py-0.5 rounded-sm"><Text className="font-body text-xs text-info">{WORK_MODES[item.work_mode] || item.work_mode}</Text></View>}
      </View>
      <View className="flex-row justify-between mt-2">
        <Text className="font-body text-sm text-gray-400">{item.location || item.state_name || 'Remote'}</Text>
        <Text className="font-body-medium text-[13px] text-gold">{item.salary_display || (item.hide_salary ? 'Competitive' : item.salary_min ? `₦${item.salary_min.toLocaleString()}` : '')}</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row justify-between items-center px-4 py-2">
        <Text className="font-display-bold text-2xl text-gray-900">Job Board</Text>
        <View className="flex-row gap-1">
          <Pressable className="bg-forest px-4 py-2 rounded-sm" onPress={() => navigation.navigate('CreateJob')}>
            <Text className="font-body-semibold text-[13px] text-white">Post</Text>
          </Pressable>
          <Pressable className="bg-surface px-4 py-2 rounded-sm border border-forest" onPress={() => navigation.navigate('MyJobListings')}>
            <Text className="font-body-semibold text-[13px] text-forest">My Jobs</Text>
          </Pressable>
        </View>
      </View>

      <View className="px-4 mb-2">
        <TextInput className="bg-surface rounded-sm px-4 py-2 font-body text-base text-gray-900 border border-gray-200" placeholder="Search jobs..." placeholderTextColor="#9ca3af" value={search} onChangeText={setSearch} />
      </View>

      {loading ? (
        <View className="p-4">{[1, 2, 3].map(i => <Skeleton key={i} variant="card" className="mb-2" />)}</View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={item => String(item.id)}
          renderItem={renderJob}
          contentContainerClassName="px-4 pb-12"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a472a" />}
          ListEmptyComponent={<Text className="font-body text-base text-gray-500 text-center p-8">No jobs found. Try different search terms.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

