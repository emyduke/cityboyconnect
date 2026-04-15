import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { getMyNetwork, getMyNetworkTree, getMyNetworkRecent } from '../../api/members';
import { unwrap } from '../../api/client';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';

type Tab = 'direct' | 'tree' | 'recent';

export default function MyNetworkScreen() {
  const [tab, setTab] = useState<Tab>('direct');
  const [data, setData] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      if (tab === 'direct') {
        const res = await getMyNetwork();
        const payload = unwrap<any>(res);
        setData(payload);
        setItems(payload?.direct_referrals || payload?.members || []);
      } else if (tab === 'tree') {
        const res = await getMyNetworkTree();
        setItems(unwrap<any[]>(res) || []);
      } else {
        const res = await getMyNetworkRecent();
        setItems(unwrap<any[]>(res) || []);
      }
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, [tab]);

  useEffect(() => { setLoading(true); fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'direct', label: 'Direct' },
    { key: 'tree', label: 'Tree' },
    { key: 'recent', label: 'Recent' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.container}>
          <Skeleton variant="card" />
          <Skeleton variant="card" style={{ marginTop: spacing.sm }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        {data?.network_size != null && (
          <View style={styles.statBar}>
            <Text style={styles.statLabel}>Network Size</Text>
            <Text style={styles.statValue}>{data.network_size}</Text>
          </View>
        )}

        <View style={styles.tabs}>
          {tabs.map((t) => (
            <Pressable key={t.key} style={[styles.tab, tab === t.key && styles.tabActive]} onPress={() => setTab(t.key)}>
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={items}
          keyExtractor={(item, idx) => String(item.id || idx)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState title="No members yet" />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Avatar name={item.full_name || ''} size="sm" />
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{item.full_name || 'Member'}</Text>
                <Text style={styles.rowMeta}>{item.state_name || ''}{item.joined_at ? ` · ${new Date(item.joined_at).toLocaleDateString()}` : ''}</Text>
              </View>
              {item.added_by_leader ? (
                <Badge label="Added" variant="success" />
              ) : item.referral_count != null ? (
                <Badge label={`${item.referral_count} refs`} variant="info" />
              ) : (
                <Badge label="Referred" variant="info" />
              )}
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
  statBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  statLabel: { ...typography.bodyMedium, color: colors.accentLight },
  statValue: { ...typography.h2, color: colors.textInverse },
  tabs: { flexDirection: 'row', marginBottom: spacing.md, backgroundColor: colors.borderLight, borderRadius: radius.md, padding: 2 },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.surface, ...shadows.sm },
  tabLabel: { ...typography.bodySm, color: colors.textSecondary },
  tabLabelActive: { ...typography.bodyMedium, color: colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider, gap: spacing.sm },
  rowInfo: { flex: 1 },
  rowName: { ...typography.bodyMedium, color: colors.text },
  rowMeta: { ...typography.caption, color: colors.textSecondary },
});
