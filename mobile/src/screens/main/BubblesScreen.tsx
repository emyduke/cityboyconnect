import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography, shadows } from '../../theme';
import { getBubbles, Bubble } from '../../api/bubbles';
import { unwrap } from '../../api/client';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';

const ROLE_HIERARCHY: Record<string, number> = {
  MEMBER: 1, WARD_COORDINATOR: 2, LGA_COORDINATOR: 4,
  STATE_DIRECTOR: 6, NATIONAL_OFFICER: 8, SUPER_ADMIN: 10,
};

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
  CANCELLED: { bg: '#6b7280', text: '#fff' },
};

const CATEGORIES = ['', 'TOOLS', 'OPPORTUNITIES', 'SERVICES', 'SUPPORT', 'OTHER'];
const CAT_LABELS: Record<string, string> = {
  '': 'All', TOOLS: 'Tools', OPPORTUNITIES: 'Opportunities',
  SERVICES: 'Services', SUPPORT: 'Support', OTHER: 'Other',
};

export default function BubblesScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const canCreate = (ROLE_HIERARCHY[user?.role || ''] ?? 0) >= 2;
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('');

  const fetch = useCallback(async () => {
    try {
      const params: Record<string, any> = {};
      if (category) params.category = category;
      const res = await getBubbles(params);
      const data = unwrap(res);
      setBubbles(Array.isArray(data) ? data : data?.results || []);
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, [category]);

  useEffect(() => { fetch(); }, [fetch]);

  const renderCard = ({ item }: { item: Bubble }) => {
    const sc = STATUS_COLORS[item.status] || STATUS_COLORS.PENDING;
    return (
      <Pressable style={styles.card} onPress={() => navigation.navigate('BubbleDetail', { id: item.id })}>
        <View style={styles.cardTop}>
          <View style={[styles.catBadge, { backgroundColor: CAT_COLORS[item.category] || '#6b7280' }]}>
            <Text style={styles.catBadgeText}>{item.category_display}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusBadgeText, { color: sc.text }]}>{item.status_display}</Text>
          </View>
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardLocation}>📍 {[item.ward_name, item.lga_name].filter(Boolean).join(', ') || 'N/A'}</Text>
          <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.container}>
          {[1, 2, 3].map((k) => <Skeleton key={k} variant="card" style={{ marginBottom: spacing.sm }} />)}
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
          <View>
            {canCreate && (
              <Button variant="primary" size="sm" onPress={() => navigation.navigate('CreateBubble')} style={{ marginBottom: spacing.md }}>
                + Create Bubble
              </Button>
            )}
            <FlatList
              horizontal
              data={CATEGORIES}
              keyExtractor={(c) => c || 'all'}
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: spacing.md }}
              renderItem={({ item: c }) => (
                <Pressable
                  style={[styles.chip, category === c && styles.chipActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>
                    {CAT_LABELS[c]}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        }
        ListEmptyComponent={<EmptyState icon="🫧" title="No Bubbles" description="No bubbles in your area yet" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md },
  card: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 20,
    marginBottom: spacing.sm, ...shadows.sm,
  },
  cardTop: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  catBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 100 },
  catBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 100 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLocation: { fontSize: 12, color: colors.textTertiary },
  cardDate: { fontSize: 12, color: colors.textTertiary },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  chipTextActive: { color: '#fff' },
});
