import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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
    const map: Record<string, string> = { ACTIVE: '#16a34a', DRAFT: '#d97706', PAUSED: '#2563eb', CLOSED: '#6b7280' };
    return map[s] || '#6b7280';
  };

  const renderItem = ({ item }: { item: any }) => (
    <Pressable className="bg-surface rounded-md p-4 mb-2 shadow-sm" onPress={() => navigation.navigate('JobDetail', { id: item.id })}>
      <View className="flex-row justify-between items-center">
        <Text className="font-body-medium text-base text-gray-900 flex-1 mr-2" numberOfLines={1}>{item.title}</Text>
        <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: statusColor(item.status) + '20' }}>
          <Text className="font-body text-xs" style={{ color: statusColor(item.status) }}>{item.status}</Text>
        </View>
      </View>
      <Text className="font-body text-xs text-gray-500 mt-1">{item.company_name} • {item.application_count ?? 0} applicants</Text>
      <View className="flex-row gap-2 mt-2 flex-wrap">
        <Pressable className="py-1 px-2 bg-background rounded-sm" onPress={() => navigation.navigate('CreateJob', { id: item.id })}>
          <Text className="font-body text-xs text-forest">Edit</Text>
        </Pressable>
        <Pressable className="py-1 px-2 bg-background rounded-sm" onPress={() => navigation.navigate('JobApplications', { jobId: item.id })}>
          <Text className="font-body text-xs text-forest">Applications</Text>
        </Pressable>
        {item.status === 'DRAFT' && (
          <Pressable className="py-1 px-2 bg-background rounded-sm" onPress={() => handleStatusChange(item.id, 'ACTIVE')}>
            <Text className="font-body text-xs text-success">Publish</Text>
          </Pressable>
        )}
        {item.status === 'ACTIVE' && (
          <Pressable className="py-1 px-2 bg-background rounded-sm" onPress={() => handleStatusChange(item.id, 'PAUSED')}>
            <Text className="font-body text-xs text-warning">Pause</Text>
          </Pressable>
        )}
        {item.status === 'PAUSED' && (
          <Pressable className="py-1 px-2 bg-background rounded-sm" onPress={() => handleStatusChange(item.id, 'ACTIVE')}>
            <Text className="font-body text-xs text-success">Resume</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <View className="flex-row px-2 py-1 bg-surface shadow-sm">
        {STATUS_TABS.map((t) => (
          <Pressable key={t} className={`px-2 py-1 rounded-full mr-1 ${tab === t ? 'bg-forest' : ''}`} onPress={() => setTab(t)}>
            <Text className={`font-body text-xs ${tab === t ? 'text-white' : 'text-gray-500'}`}>{t}</Text>
          </Pressable>
        ))}
      </View>
      {loading ? (
        <View className="p-4"><Skeleton variant="card" /><Skeleton variant="card" className="mt-2" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerClassName="p-4 pb-12"
          ListEmptyComponent={<Text className="font-body text-base text-gray-500 text-center mt-12">No job listings yet</Text>}
        />
      )}
    </SafeAreaView>
  );
}

