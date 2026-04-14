import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, shadows } from '../../theme';
import { getMyBubbles, Bubble } from '../../api/bubbles';
import { unwrap } from '../../api/client';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/ui/Button';

const CAT_COLORS: Record<string, string> = {
  TOOLS: '#1a472a', OPPORTUNITIES: '#2563eb', SERVICES: '#ea580c',
  SUPPORT: '#7c3aed', OTHER: '#6b7280',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fef3c7', text: '#854d0e' },
  IN_REVIEW: { bg: '#3b82f6', text: '#fff' },
  APPROVED: { bg: '#22c55e', text: '#fff' },
  IN_PROGRESS: { bg: '#f97316', text: '#fff' },
  DELIVERED: { bg: '#10b981', text: '#fff' },
  REJECTED: { bg: '#ef4444', text: '#fff' },
};

const STATUS_ORDER = ['PENDING', 'IN_REVIEW', 'APPROVED', 'IN_PROGRESS', 'DELIVERED'];

export default function MyBubblesScreen() {
  const navigation = useNavigation<any>();
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const res = await getMyBubbles();
      const data = unwrap(res);
      setBubbles(Array.isArray(data) ? data : data?.results || []);
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const renderCard = ({ item }: { item: Bubble }) => {
    const sc = STATUS_COLORS[item.status] || STATUS_COLORS.PENDING;
    const idx = STATUS_ORDER.indexOf(item.status);
    return (
      <Pressable style={styles.card} onPress={() => navigation.navigate('BubbleDetail', { id: item.id })}>
        {!['REJECTED', 'CANCELLED'].includes(item.status) && (
          <View style={styles.stepper}>
            {STATUS_ORDER.map((s, i) => (
              <View key={s} style={[styles.stepperBar, i < idx && styles.stepperDone, i === idx && styles.stepperActive]} />
            ))}
          </View>
        )}
        <View style={styles.cardTop}>
          <View style={[styles.catBadge, { backgroundColor: CAT_COLORS[item.category] || '#6b7280' }]}>
            <Text style={styles.catBadgeText}>{item.category_display}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusBadgeText, { color: sc.text }]}>{item.status_display}</Text>
          </View>
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
          <Text style={styles.cardDate}>{item.images_count} photo{item.images_count !== 1 ? 's' : ''}</Text>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.container}>
          {[1, 2].map((k) => <Skeleton key={k} variant="card" style={{ marginBottom: spacing.sm }} />)}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={bubbles}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCard}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={colors.primary} />}
        ListHeaderComponent={
          <Button variant="primary" size="sm" onPress={() => navigation.navigate('CreateBubble')} style={{ marginBottom: spacing.md }}>
            + Create Bubble
          </Button>
        }
        ListEmptyComponent={
          <EmptyState icon="🫧" title="No Bubbles Yet" description="You haven't created any bubbles yet. Leaders can create bubbles to request local support." />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: spacing.sm, ...shadows.sm },
  stepper: { flexDirection: 'row', gap: 4, marginBottom: 10 },
  stepperBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  stepperDone: { backgroundColor: colors.primary },
  stepperActive: { backgroundColor: colors.accent },
  cardTop: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  catBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 100 },
  catBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 100 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  cardDate: { fontSize: 12, color: colors.textTertiary },
});
