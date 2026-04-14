import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, spacing, typography, shadows, radius } from '../../theme';
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
    const top3 = entries.slice(0, 3);
    if (top3.length === 0) return null;
    // Display order: 2nd, 1st, 3rd
    const order = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
    const indexOrder = top3.length >= 3 ? [1, 0, 2] : top3.map((_, i) => i);
    return (
      <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.podiumRow}>
        {order.map((item, displayIdx) => {
          const actualIdx = indexOrder[displayIdx];
          return (
            <View key={item.id || displayIdx} style={styles.podiumItem}>
              <View style={[styles.medal, { backgroundColor: medalColors[actualIdx] }]}>
                <Text style={styles.medalText}>{actualIdx + 1}</Text>
              </View>
              <Avatar name={item.full_name || ''} size={actualIdx === 0 ? 'lg' : 'md'} />
              <Text style={styles.podiumName} numberOfLines={1}>{item.full_name || 'Member'}</Text>
              <Text style={styles.podiumScore}>{item.total_score ?? item.score ?? 0} pts</Text>
              <View style={[styles.podiumBar, { height: podiumHeights[actualIdx], backgroundColor: medalColors[actualIdx] + '30' }]}>
                <View style={[styles.podiumBarFill, { backgroundColor: medalColors[actualIdx], height: '100%' }]} />
              </View>
            </View>
          );
        })}
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.container}>
          <Skeleton variant="card" />
          <Skeleton variant="card" style={{ marginTop: spacing.sm }} />
          <Skeleton variant="card" style={{ marginTop: spacing.sm }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        {/* Scope tabs */}
        <View style={styles.tabs}>
          {scopes.map((s) => (
            <Pressable key={s.key} style={[styles.tab, scope === s.key && styles.tabActive]} onPress={() => setScope(s.key)}>
              <Text style={[styles.tabLabel, scope === s.key && styles.tabLabelActive]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* My rank */}
        {myRank && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.myRank}>
              <View style={styles.myRankInner}>
                <View>
                  <Text style={styles.myRankLabel}>Your Rank</Text>
                  <Text style={styles.myRankPosition}>#{myRank.rank ?? '-'}</Text>
                </View>
                <View style={styles.myRankRight}>
                  <Text style={styles.myRankScoreLabel}>Score</Text>
                  <Text style={styles.myRankScore}>{myRank.total_score ?? myRank.score ?? 0}</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        <FlatList
          data={entries.slice(3)}
          keyExtractor={(item, idx) => String(item.id || idx)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListHeaderComponent={renderPodium}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <View style={styles.rankCircle}>
                <Text style={styles.rankNum}>{index + 4}</Text>
              </View>
              <Avatar name={item.full_name || ''} size="sm" />
              <View style={styles.rowInfo}>
                <Text style={styles.rowName} numberOfLines={1}>{item.full_name || 'Member'}</Text>
                <Text style={styles.rowMeta}>{item.state_name || ''}</Text>
              </View>
              <Text style={styles.rowScore}>{item.total_score ?? item.score ?? 0}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.md },
  tabs: { flexDirection: 'row', marginBottom: spacing.md, backgroundColor: colors.borderLight, borderRadius: radius.lg, padding: 3 },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.md },
  tabActive: { backgroundColor: colors.surface, ...shadows.sm },
  tabLabel: { ...typography.bodySm, color: colors.textSecondary },
  tabLabelActive: { ...typography.bodyMedium, color: colors.primary },
  myRank: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, overflow: 'hidden' },
  myRankInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  myRankLabel: { ...typography.caption, color: 'rgba(255,255,255,0.7)' },
  myRankPosition: { ...typography.h1, color: colors.accent },
  myRankRight: { alignItems: 'flex-end' },
  myRankScoreLabel: { ...typography.caption, color: 'rgba(255,255,255,0.7)' },
  myRankScore: { ...typography.h3, color: '#fff' },
  podiumRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginBottom: spacing.lg, gap: spacing.md },
  podiumItem: { alignItems: 'center', width: 95 },
  medal: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  medalText: { fontSize: 14, fontFamily: 'PlusJakartaSans-Bold', color: '#fff' },
  podiumName: { ...typography.caption, color: colors.text, marginTop: spacing.xs, textAlign: 'center' },
  podiumScore: { ...typography.caption, color: colors.primary, fontFamily: 'PlusJakartaSans-Bold' },
  podiumBar: { width: '100%', borderRadius: radius.sm, marginTop: spacing.xs, overflow: 'hidden' },
  podiumBarFill: { width: '100%', borderRadius: radius.sm, opacity: 0.3 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
    gap: spacing.sm,
  },
  rankCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.borderLight,
    justifyContent: 'center', alignItems: 'center',
  },
  rankNum: { ...typography.caption, fontFamily: 'PlusJakartaSans-Bold', color: colors.textSecondary },
  rowInfo: { flex: 1 },
  rowName: { ...typography.bodyMedium, color: colors.text },
  rowMeta: { ...typography.caption, color: colors.textSecondary },
  rowScore: { ...typography.bodyMedium, color: colors.primary, fontFamily: 'PlusJakartaSans-Bold' },
});
