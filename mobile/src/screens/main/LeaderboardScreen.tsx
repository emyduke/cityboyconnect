import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, shadows, radius } from '../../theme';
import { getLeaderboardScores, getMyRank } from '../../api/dashboard';
import { unwrap } from '../../api/client';
import Avatar from '../../components/ui/Avatar';
import Skeleton from '../../components/ui/Skeleton';
import Card from '../../components/ui/Card';

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
    { key: 'national', label: 'National' },
    { key: 'state', label: 'State' },
    { key: 'lga', label: 'LGA' },
  ];

  const medalColors = ['#d4a017', '#C0C0C0', '#CD7F32'];

  const renderPodium = () => {
    const top3 = entries.slice(0, 3);
    if (top3.length === 0) return null;
    return (
      <View style={styles.podiumRow}>
        {top3.map((item, idx) => (
          <View key={item.id || idx} style={[styles.podiumItem, idx === 0 && styles.podiumFirst]}>
            <View style={[styles.medal, { backgroundColor: medalColors[idx] || colors.border }]}>
              <Text style={styles.medalText}>{idx + 1}</Text>
            </View>
            <Avatar name={item.full_name || ''} size="md" />
            <Text style={styles.podiumName} numberOfLines={1}>{item.full_name || 'Member'}</Text>
            <Text style={styles.podiumScore}>{item.total_score ?? item.score ?? 0}</Text>
          </View>
        ))}
      </View>
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
          <Card style={styles.myRank}>
            <Text style={styles.myRankLabel}>Your Rank</Text>
            <View style={styles.myRankRow}>
              <Text style={styles.myRankPosition}>#{myRank.rank ?? '-'}</Text>
              <Text style={styles.myRankScore}>{myRank.total_score ?? myRank.score ?? 0} pts</Text>
            </View>
          </Card>
        )}

        <FlatList
          data={entries}
          keyExtractor={(item, idx) => String(item.id || idx)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListHeaderComponent={renderPodium}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <Text style={styles.rank}>{index + 1}</Text>
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
  tabs: { flexDirection: 'row', marginBottom: spacing.md, backgroundColor: colors.borderLight, borderRadius: radius.md, padding: 2 },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.surface, ...shadows.sm },
  tabLabel: { ...typography.bodySm, color: colors.textSecondary },
  tabLabelActive: { ...typography.bodyMedium, color: colors.primary },
  myRank: { marginBottom: spacing.md, backgroundColor: colors.primaryDark, borderRadius: radius.lg },
  myRankLabel: { ...typography.caption, color: colors.accentLight },
  myRankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  myRankPosition: { ...typography.h2, color: colors.textInverse },
  myRankScore: { ...typography.h4, color: colors.accent },
  podiumRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginBottom: spacing.lg, gap: spacing.md },
  podiumItem: { alignItems: 'center', width: 90 },
  podiumFirst: { marginBottom: spacing.md },
  medal: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  medalText: { ...typography.captionBold, color: '#fff' },
  podiumName: { ...typography.caption, color: colors.text, marginTop: 4, textAlign: 'center' },
  podiumScore: { ...typography.captionBold, color: colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider, gap: spacing.sm },
  rank: { ...typography.bodyMedium, color: colors.textSecondary, width: 30, textAlign: 'center' },
  rowInfo: { flex: 1 },
  rowName: { ...typography.bodyMedium, color: colors.text },
  rowMeta: { ...typography.caption, color: colors.textSecondary },
  rowScore: { ...typography.bodyMedium, color: colors.primary },
});
