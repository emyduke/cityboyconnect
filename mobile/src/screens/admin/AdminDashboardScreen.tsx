import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { adminApi } from '../../api/admin';
import StatCard from '../../components/StatCard';
import Skeleton from '../../components/ui/Skeleton';
import Card from '../../components/ui/Card';

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const [overview, setOverview] = useState<any>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [ov, af] = await Promise.all([
        adminApi.getOverview(),
        adminApi.getActivityFeed(20),
      ]);
      setOverview(ov.data || ov);
      setFeed(Array.isArray(af.data) ? af.data : af.results || []);
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        <View className="flex-1 p-4">
          <Skeleton variant="card" />
          <Skeleton variant="card" className="mt-2" />
        </View>
      </SafeAreaView>
    );
  }

  const stats = [
    { label: 'Total Members', value: overview?.total_members ?? 0 },
    { label: 'Pending', value: overview?.pending_verifications ?? 0 },
    { label: 'Verified', value: overview?.verified_members ?? 0 },
    { label: 'Suspended', value: overview?.suspended_members ?? 0 },
  ];

  const adminLinks = [
    { label: 'Members', screen: 'AdminMembers', icon: '👥' },
    { label: 'Verifications', screen: 'AdminVerifications', icon: '✅' },
    { label: 'Structure', screen: 'AdminStructure', icon: '🏛️' },
    { label: 'Events', screen: 'AdminEvents', icon: '📅' },
    { label: 'Announcements', screen: 'AdminAnnouncements', icon: '📢' },
    { label: 'Reports', screen: 'AdminReports', icon: '📊' },
    { label: 'Bubbles', screen: 'AdminBubbles', icon: '🫧' },
    { label: 'Audit Log', screen: 'AdminAuditLog', icon: '📋' },
    { label: 'Settings', screen: 'AdminSettings', icon: '⚙️' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView
        className="flex-1 p-4"
        contentContainerStyle={{ paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a472a" />}
      >
        {/* Stats grid */}
        <View className="flex-row flex-wrap gap-2 mb-6">
          {stats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} className="flex-1" />
          ))}
        </View>

        {/* Quick links */}
        <Text className="text-lg font-display-semibold text-gray-900 mb-2">Admin Sections</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {adminLinks.map((link) => (
            <Card key={link.screen} className="w-[47%] items-center p-4" onPress={() => navigation.navigate(link.screen)}>
              <Text className="text-[28px] mb-1">{link.icon}</Text>
              <Text className="text-sm font-body text-gray-900 text-center">{link.label}</Text>
            </Card>
          ))}
        </View>

        {/* Activity feed */}
        <Text className="text-lg font-display-semibold text-gray-900 mb-2">Recent Activity</Text>
        {feed.length === 0 ? (
          <Text className="text-sm font-body text-gray-400 text-center mt-4">No recent activity</Text>
        ) : (
          feed.slice(0, 10).map((item, idx) => (
            <View key={idx} className="bg-surface rounded p-2 mb-1 shadow-sm">
              <Text className="text-sm font-body text-gray-900">{item.description || item.action || JSON.stringify(item)}</Text>
              <Text className="text-xs font-body text-gray-400 mt-0.5">{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

