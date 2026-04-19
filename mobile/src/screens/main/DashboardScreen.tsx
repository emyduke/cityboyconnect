import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getDashboardOverview } from '../../api/dashboard';
import { getAnnouncements } from '../../api/announcements';
import { unwrap } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import MembershipCard from '../../components/ui/MembershipCard';
import Avatar from '../../components/ui/Avatar';
import Skeleton from '../../components/ui/Skeleton';

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<any>();
  const [data, setData] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, annRes] = await Promise.all([
        getDashboardOverview(),
        getAnnouncements({ page_size: 3 }),
      ]);
      setData(unwrap(dashRes));
      const annData = unwrap(annRes);
      setAnnouncements(Array.isArray(annData) ? annData.slice(0, 3) : (annData?.results || []).slice(0, 3));
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.full_name?.split(' ')[0] || 'Member';
  const isAdmin = user?.role && ['SUPER_ADMIN', 'NATIONAL_OFFICER', 'STATE_DIRECTOR'].includes(user.role);

  const stats = [
    { icon: '👥', label: 'Members', value: data?.total_members ?? 0, color: '#1a472a' },
    { icon: '✅', label: 'Verified', value: data?.verified_members ?? 0, color: '#16a34a' },
    { icon: '🔗', label: 'Referrals', value: data?.my_referrals ?? 0, color: '#d4a017' },
    { icon: '⭐', label: 'Score', value: data?.my_score ?? 0, color: '#d97706' },
  ];

  const quickActions = [
    { icon: '📱', label: 'My QR', screen: 'MyQRCode', tab: 'MoreTab' },
    { icon: '🌐', label: 'Network', screen: 'MyNetwork', tab: 'MoreTab' },
    { icon: '�', label: 'Opportunities', screen: 'Opportunities', tab: 'MoreTab' },
    { icon: '📋', label: 'Jobs', screen: 'Jobs', tab: 'MoreTab' },
    { icon: '�📅', label: 'Events', screen: null, tab: 'EventsTab' },
    { icon: '📢', label: 'Announce', screen: 'Announcements', tab: 'MoreTab' },
    { icon: '🏆', label: 'Ranks', screen: null, tab: 'RanksTab' },
  ];

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="p-6">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="card" className="mt-4" />
          <Skeleton variant="card" className="mt-4" />
          <Skeleton variant="card" className="mt-4" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 64 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        bounces
      >
        {/* Green Header */}
        <LinearGradient colors={['#0d2416', '#1a472a']} className="pb-16 px-6">
          <SafeAreaView edges={['top']}>
            <View className="pt-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-body text-white/80">{greeting()},</Text>
                  <Text className="text-2xl font-display-bold text-white mt-0.5">{firstName} 👋</Text>
                </View>
                <Pressable onPress={() => navigation.navigate('MoreTab', { screen: 'Profile' })}>
                  <Avatar name={user?.full_name || ''} size="md" />
                </Pressable>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Membership Card - overlapping header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} className="-mt-10 px-6 mb-4">
          {user && <MembershipCard user={user} compact onPress={() => navigation.navigate('MoreTab', { screen: 'Profile' })} />}
        </Animated.View>

        <View className="px-6">
          {/* Stats Grid 2x2 */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} className="flex-row flex-wrap gap-2 mb-6">
            {stats.map((s, i) => (
              <View key={s.label} className="w-[48%] bg-surface rounded-xl p-4 shadow-sm grow">
                <View
                  className="w-9 h-9 rounded-full justify-center items-center mb-1"
                  style={{ backgroundColor: s.color + '15' }}
                >
                  <Text style={{ fontSize: 20 }}>{s.icon}</Text>
                </View>
                <Text className="text-2xl font-display-bold text-gray-900">{s.value}</Text>
                <Text className="text-xs font-body text-gray-500 mt-0.5">{s.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Text className="text-lg font-display-semibold text-gray-900 mb-2">Quick Actions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 24 }}>
              {quickActions.map((item) => (
                <Pressable
                  key={item.label}
                  className="flex-row items-center bg-surface rounded-full px-4 py-2 shadow-sm gap-1"
                  onPress={() => {
                    if (item.screen) {
                      navigation.navigate(item.tab, { screen: item.screen });
                    } else {
                      navigation.navigate(item.tab);
                    }
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                  <Text className="text-sm font-body-medium text-gray-900">{item.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Recent Announcements */}
          {announcements.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400).duration(400)}>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-lg font-display-semibold text-gray-900">Recent Announcements</Text>
                <Pressable onPress={() => navigation.navigate('MoreTab', { screen: 'Announcements' })}>
                  <Text className="text-sm font-body-semibold text-forest">See all →</Text>
                </Pressable>
              </View>
              {announcements.map((ann) => (
                <Pressable
                  key={ann.id}
                  className="flex-row items-center bg-surface rounded-lg p-4 mb-2 gap-2 shadow-sm"
                  onPress={() => navigation.navigate('MoreTab', { screen: 'AnnouncementDetail', params: { id: ann.id } })}
                >
                  <View
                    className="w-8 h-8 rounded-full justify-center items-center"
                    style={{
                      backgroundColor: ann.priority === 'URGENT' ? '#dc262620' : ann.priority === 'IMPORTANT' ? '#d4a01720' : '#2d6a4f15',
                    }}
                  >
                    <Text style={{ fontSize: 12 }}>
                      {ann.priority === 'URGENT' ? '🔴' : ann.priority === 'IMPORTANT' ? '🟡' : '🟢'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-body-medium text-gray-900" numberOfLines={1}>{ann.title}</Text>
                    <Text className="text-xs font-body text-gray-400 mt-0.5">
                      {ann.published_at ? new Date(ann.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </Animated.View>
          )}

          {/* City Boys Bubbles */}
          <Animated.View entering={FadeInDown.delay(450).duration(400)}>
            <Pressable
              className="bg-surface rounded-xl p-6 mt-4 shadow-sm"
              onPress={() => navigation.navigate('MoreTab', { screen: 'Bubbles' })}
            >
              <Text className="text-lg font-display-semibold text-forest">🫧 City Boys Bubbles</Text>
              <Text className="text-sm font-body text-gray-500 mt-0.5">Local support for your community</Text>
            </Pressable>
          </Animated.View>

          {/* Admin Panel */}
          {isAdmin && (
            <Animated.View entering={FadeInDown.delay(500).duration(400)}>
              <Pressable
                className="bg-forest rounded-xl p-6 mt-6 shadow-md"
                onPress={() => navigation.navigate('MoreTab', { screen: 'AdminDashboard' })}
              >
                <Text className="text-lg font-display-semibold text-gold">🛡️ Admin Panel →</Text>
                <Text className="text-sm font-body text-white opacity-80 mt-0.5">Manage members, verifications & more</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
