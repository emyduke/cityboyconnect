import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../../theme';
import { getAnnouncements } from '../../api/announcements';
import { unwrap } from '../../api/client';
import AnnouncementCard from '../../components/AnnouncementCard';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';

export default function AnnouncementsScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const res = await getAnnouncements();
      const data = unwrap(res);
      setItems(Array.isArray(data) ? data : data?.results || []);
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) {
    return <View style={styles.container}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="card" style={{ marginBottom: spacing.sm }} />)}</View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <AnnouncementCard announcement={item} onPress={() => navigation.navigate('AnnouncementDetail', { id: item.id })} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState icon="📢" title="No Announcements" description="Nothing to report yet" />}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
});
