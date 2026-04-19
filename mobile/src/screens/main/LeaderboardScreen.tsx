import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getLeaderboardScores, getMyRank } from '../../api/dashboard';
import { unwrap } from '../../api/client';
import Avatar from '../../components/ui/Avatar';
import Skeleton from '../../components/ui/Skeleton';

type Scope = 'national' | 'state' | 'lga';

export default function LeaderboardScreen() {
  const [entries, setEntries] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scope, setScope] = useState<Scope>('national');
  const insets = useSafeAreaInsets();

  const fetchData = useCallback(async () => {
    try {
      const [scoresRes, rankRes] = await Promise.all([
        getLeaderboardScores({ scope }),
        getMyRank(),
      ]);
      setEntries(unwrap<any[]>(scoresRes) || []);
      setMyRank(unwrap(rankRes));
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, [scope]);

  useEffect(() => { setLoading(true); fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const scopes: { key: Scope; label: string }[] = [
    { key: 'national', label: '🇳🇬 National' },
    { key: 'state', label: '🏛️ State' },
    { key: 'lga', label: '📍 LGA' },
  ];

  const medalColors = ['#d4a017', '#C0C0C0', '#CD7F32'];
  const podiumHeights = [100, 80, 65];

  const renderPodium = () => {
    const top3 = Array.isArray(entries) ? entries.slice(0, 3) : [];
    if (top3.length === 0) return null;
    // Display order: 2nd, 1st, 3rd
    const order = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
    const indexOrder = top3.length >= 3 ? [1, 0, 2] : top3.map((_, i) => i);
    return (
      <Animated.View entering={FadeInDown.delay(150).duration(400)} className="flex-row justify-center items-end mb-6 gap-4">
        {order.map((item, displayIdx) => {
          const actualIdx = indexOrder[displayIdx];
          return (
            <View key={item.id || displayIdx} className="items-center w-[95px]">
              <View
                className="w-[30px] h-[30px] rounded-full items-center justify-center mb-1"
                style={{ backgroundColor: medalColors[actualIdx] }}
              >
                <Text className="text-sm font-body-bold text-white">{actualIdx + 1}</Text>
              </View>
              <Avatar name={item.full_name || ''} size={actualIdx === 0 ? 'lg' : 'md'} />
              <Text className="text-xs font-body text-gray-900 mt-1 text-center" numberOfLines={1}>{item.full_name || 'Member'}</Text>
              <Text className="text-xs font-body-bold text-forest">{item.total_score ?? item.score ?? 0} pts</Text>
              <View
                className="w-full rounded-sm mt-1 overflow-hidden"
                style={{ height: podiumHeights[actualIdx], backgroundColor: medalColors[actualIdx] + '30' }}
              >
                <View className="w-full rounded-sm opacity-30" style={{ backgroundColor: medalColors[actualIdx], height: '100%' }} />
              </View>
            </View>
          );
        })}
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']} style={{ paddingTop: insets.top }}>
        <View className="flex-1 p-4">
          <Skeleton variant="card" />
          <Skeleton variant="card" className="mt-2" />
          <Skeleton variant="card" className="mt-2" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']} style={{ paddingTop: insets.top }}>
      <View className="flex-1 p-4">
        {/* Scope tabs */}
        <View className="flex-row mb-4 bg-gray-100 rounded-lg p-0.5">
          {scopes.map((s) => (
            <Pressable key={s.key} className={`flex-1 py-2 items-center rounded-md ${scope === s.key ? 'bg-surface shadow-sm' : ''}`} onPress={() => setScope(s.key)}>
              <Text className={`${scope === s.key ? 'text-base font-body-medium text-forest' : 'text-sm font-body text-gray-500'}`}>{s.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* My rank */}
        {myRank && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <LinearGradient colors={['#0d2416', '#1a472a']} className="rounded-lg p-4 mb-4 overflow-hidden">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-xs font-body text-white/70">Your Rank</Text>
                  <Text className="text-3xl font-display-bold text-gold">#{myRank.rank ?? '-'}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs font-body text-white/70">Score</Text>
                  <Text className="text-xl font-display-bold text-white">{myRank.total_score ?? myRank.score ?? 0}</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        <FlatList
          data={[...(Array.isArray(entries) ? entries : []).slice(3)]}
          keyExtractor={(item, idx) => String(item.id || idx)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a472a" />}
          ListHeaderComponent={renderPodium}
          renderItem={({ item, index }) => (
            <View className="flex-row items-center py-2.5 px-2 border-b border-gray-200 gap-2">
              <View className="w-7 h-7 rounded-full bg-gray-100 justify-center items-center">
                <Text className="text-xs font-body-bold text-gray-500">{index + 4}</Text>
              </View>
              <Avatar name={item.full_name || ''} size="sm" />
              <View className="flex-1">
                <Text className="text-base font-body-medium text-gray-900" numberOfLines={1}>{item.full_name || 'Member'}</Text>
                <Text className="text-xs font-body text-gray-500">{item.state_name || ''}</Text>
              </View>
              <Text className="text-base font-body-bold text-forest">{item.total_score ?? item.score ?? 0}</Text>
            </View>
          )}
          contentContainerClassName="pb-12"
        />
      </View>
    </SafeAreaView>
  );
}
