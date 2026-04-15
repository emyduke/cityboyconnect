import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { searchTalents, searchProfessionals, searchBusinesses, getTalentCategories } from '../../api/opportunities';
import { unwrap } from '../../api/client';
import Avatar from '../../components/ui/Avatar';
import Skeleton from '../../components/ui/Skeleton';

type Tab = 'talents' | 'professionals' | 'businesses';

export default function OpportunitiesScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<Tab>('talents');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    getTalentCategories().then(r => setCategories(unwrap(r) || [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (selectedCategory && tab === 'talents') params.category = selectedCategory;
      let res;
      if (tab === 'talents') res = await searchTalents(params);
      else if (tab === 'professionals') res = await searchProfessionals(params);
      else res = await searchBusinesses(params);
      const d = unwrap(res);
      setData(Array.isArray(d) ? d : d?.results || []);
    } catch { setData([]); }
    setLoading(false);
    setRefreshing(false);
  }, [tab, search, selectedCategory]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'talents', label: 'Talents' },
    { key: 'professionals', label: 'Professionals' },
    { key: 'businesses', label: 'Businesses' },
  ];

  const navigateToDetail = (item: any) => {
    if (tab === 'talents') navigation.navigate('TalentDetail', { userId: item.user_id || item.user });
    else if (tab === 'professionals') navigation.navigate('ProfessionalDetail', { userId: item.user_id || item.user });
    else navigation.navigate('BusinessDetail', { id: item.id });
  };

  const renderCard = ({ item }: { item: any }) => (
    <Pressable style={styles.card} onPress={() => navigateToDetail(item)}>
      <Avatar name={item.full_name || item.name || ''} size="md" />
      <View style={styles.cardContent}>
        <Text style={styles.cardName} numberOfLines={1}>{item.full_name || item.name || item.title}</Text>
        <Text style={styles.cardSub} numberOfLines={1}>
          {tab === 'talents' ? item.category_display || item.category : tab === 'professionals' ? item.headline : item.category_display}
        </Text>
        {item.state_name && <Text style={styles.cardMeta}>{item.state_name}{item.lga_name ? ` · ${item.lga_name}` : ''}</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Opportunities</Text>
        <Pressable style={styles.myBtn} onPress={() => navigation.navigate('MyOpportunities')}>
          <Text style={styles.myBtnText}>My Profiles</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {tabs.map(t => (
          <Pressable key={t.key} style={[styles.tab, tab === t.key && styles.tabActive]} onPress={() => { setTab(t.key); setSelectedCategory(''); }}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.searchWrap}>
        <TextInput style={styles.searchInput} placeholder="Search..." placeholderTextColor={colors.textTertiary} value={search} onChangeText={setSearch} />
      </View>

      {tab === 'talents' && categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={{ paddingHorizontal: spacing.md }}>
          <Pressable style={[styles.chip, !selectedCategory && styles.chipActive]} onPress={() => setSelectedCategory('')}>
            <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All</Text>
          </Pressable>
          {categories.map((c: any) => (
            <Pressable key={c.value} style={[styles.chip, selectedCategory === c.value && styles.chipActive]} onPress={() => setSelectedCategory(c.value)}>
              <Text style={[styles.chipText, selectedCategory === c.value && styles.chipTextActive]}>{c.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {loading ? (
        <View style={styles.loadWrap}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="card" style={{ marginBottom: spacing.sm }} />)}
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, i) => String(item.id || i)}
          renderItem={renderCard}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<Text style={styles.empty}>No results found</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  title: { ...typography.h2, color: colors.text },
  myBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm },
  myBtnText: { ...typography.button, color: colors.textInverse, fontSize: 13 },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.xs, marginBottom: spacing.sm },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center', backgroundColor: colors.surface },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.bodyMedium, color: colors.textSecondary },
  tabTextActive: { color: colors.textInverse },
  searchWrap: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  searchInput: { backgroundColor: colors.surface, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.body, color: colors.text, borderWidth: 1, borderColor: colors.border },
  chips: { marginBottom: spacing.sm, maxHeight: 40 },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.surface, marginRight: spacing.xs, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.bodySm, color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
  cardContent: { flex: 1, marginLeft: spacing.md },
  cardName: { ...typography.bodyMedium, color: colors.text },
  cardSub: { ...typography.bodySm, color: colors.textSecondary, marginTop: 2 },
  cardMeta: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
  chevron: { fontSize: 20, color: colors.textTertiary },
  loadWrap: { padding: spacing.md },
  empty: { ...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.xl },
});
