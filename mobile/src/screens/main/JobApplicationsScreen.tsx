import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
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
      APPLIED: '#2563eb', REVIEWED: '#d97706', SHORTLISTED: '#1a472a',
      ACCEPTED: '#16a34a', REJECTED: '#dc2626',
    };
    return map[s] || '#6b7280';
  };

  const renderItem = ({ item }: { item: any }) => {
    const expanded = expandedId === item.id;
    return (
      <Pressable className="bg-surface rounded-md p-4 mb-2 shadow-sm" onPress={() => { setExpandedId(expanded ? null : item.id); setNotes(item.recruiter_notes || ''); }}>
        <View className="flex-row items-center">
          <Avatar name={item.applicant_name || item.applicant?.full_name || 'User'} size={40} />
          <View className="flex-1 ml-2">
            <Text className="font-body-medium text-base text-gray-900">{item.applicant_name || item.applicant?.full_name || 'Applicant'}</Text>
            <Text className="font-body text-xs text-gray-500">Applied {new Date(item.created_at || item.applied_at).toLocaleDateString()}</Text>
          </View>
          <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: statusColor(item.status) + '20' }}>
            <Text className="font-body text-xs" style={{ color: statusColor(item.status) }}>{item.status}</Text>
          </View>
        </View>
        {item.cover_letter && <Text className="font-body text-sm text-gray-500 mt-2" numberOfLines={expanded ? undefined : 3}>{item.cover_letter}</Text>}

        {expanded && (
          <View className="mt-4 pt-2 border-t border-gray-100">
            <TextInput
              className="bg-background rounded-sm p-2 font-body text-sm text-gray-900 min-h-[60px] border border-gray-200"
              placeholder="Recruiter notes..."
              placeholderTextColor="#9ca3af"
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />
            <View className="flex-row flex-wrap gap-1 mt-2">
              {STATUS_OPTIONS.map((s) => (
                <Pressable key={s} className="px-2 py-1 rounded-sm border" style={{ borderColor: statusColor(s) }} onPress={() => handleStatusChange(item.id, s)}>
                  <Text className="font-body text-xs" style={{ color: statusColor(s) }}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </Pressable>
    );
  };

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

