import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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
      APPLIED: '#2563eb', REVIEWED: '#d97706', SHORTLISTED: '#1a472a',
      ACCEPTED: '#16a34a', REJECTED: '#dc2626', WITHDRAWN: '#9ca3af',
    };
    return map[s] || '#6b7280';
  };

  const renderItem = ({ item }: { item: any }) => (
    <Pressable className="bg-surface rounded-md p-4 mb-2 shadow-sm" onPress={() => navigation.navigate('JobDetail', { id: item.job_id || item.job?.id })}>
      <View className="flex-row items-center">
        <View className="flex-1">
          <Text className="font-body-medium text-base text-gray-900" numberOfLines={1}>{item.job_title || item.job?.title || 'Job'}</Text>
          <Text className="font-body text-xs text-gray-500">{item.company_name || item.job?.company_name}</Text>
        </View>
        <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: statusColor(item.status) + '20' }}>
          <Text className="font-body text-xs" style={{ color: statusColor(item.status) }}>{item.status}</Text>
        </View>
      </View>
      <Text className="font-body text-xs text-gray-400 mt-1">Applied {new Date(item.created_at || item.applied_at).toLocaleDateString()}</Text>
      {['APPLIED', 'REVIEWED', 'SHORTLISTED'].includes(item.status) && (
        <Pressable className="mt-2 self-start py-1 px-2 bg-danger-light rounded-sm" onPress={() => handleWithdraw(item.id)}>
          <Text className="font-body text-xs text-danger">Withdraw</Text>
        </Pressable>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <View className="flex-row px-1 py-1 bg-surface shadow-sm flex-wrap">
        {STATUS_TABS.map((t) => (
          <Pressable key={t} className={`px-2 py-1 rounded-full mr-1 mb-1 ${tab === t ? 'bg-forest' : ''}`} onPress={() => setTab(t)}>
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
          ListEmptyComponent={<Text className="font-body text-base text-gray-500 text-center mt-12">No applications yet</Text>}
        />
      )}
    </SafeAreaView>
  );
}

