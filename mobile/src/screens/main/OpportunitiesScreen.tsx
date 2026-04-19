import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, Pressable, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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
    <Pressable className="flex-row items-center bg-surface rounded-md p-4 mb-2 shadow-sm" onPress={() => navigateToDetail(item)}>
      <Avatar name={item.full_name || item.name || ''} size="md" />
      <View className="flex-1 ml-4">
        <Text className="text-base font-body-medium text-gray-900" numberOfLines={1}>{item.full_name || item.name || item.title}</Text>
        <Text className="text-sm font-body text-gray-500 mt-0.5" numberOfLines={1}>
          {tab === 'talents' ? item.category_display || item.category : tab === 'professionals' ? item.headline : item.category_display}
        </Text>
        {item.state_name && <Text className="text-xs font-body text-gray-400 mt-0.5">{item.state_name}{item.lga_name ? ` · ${item.lga_name}` : ''}</Text>}
      </View>
      <Text className="text-xl text-gray-400">›</Text>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row justify-between items-center px-4 py-2">
        <Text className="text-2xl font-display-bold text-gray-900">Opportunities</Text>
        <Pressable className="bg-forest px-4 py-2 rounded-sm" onPress={() => navigation.navigate('MyOpportunities')}>
          <Text className="text-[13px] font-body-bold text-white">My Profiles</Text>
        </Pressable>
      </View>

      <View className="flex-row px-4 gap-1 mb-2">
        {tabs.map(t => (
          <Pressable key={t.key} className={`flex-1 py-2 rounded-sm items-center ${tab === t.key ? 'bg-forest' : 'bg-surface'}`} onPress={() => { setTab(t.key); setSelectedCategory(''); }}>
            <Text className={`text-base font-body-medium ${tab === t.key ? 'text-white' : 'text-gray-500'}`}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <View className="px-4 mb-2">
        <TextInput className="bg-surface rounded-sm px-4 py-2 text-base font-body text-gray-900 border border-gray-200" placeholder="Search..." placeholderTextColor="#9ca3af" value={search} onChangeText={setSearch} />
      </View>

      {tab === 'talents' && categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2" style={{ maxHeight: 40 }} contentContainerClassName="px-4">
          <Pressable className={`px-4 py-1 rounded-full mr-1 border ${!selectedCategory ? 'bg-forest border-forest' : 'bg-surface border-gray-200'}`} onPress={() => setSelectedCategory('')}>
            <Text className={`text-sm font-body ${!selectedCategory ? 'text-white' : 'text-gray-500'}`}>All</Text>
          </Pressable>
          {categories.map((c: any) => (
            <Pressable key={c.value} className={`px-4 py-1 rounded-full mr-1 border ${selectedCategory === c.value ? 'bg-forest border-forest' : 'bg-surface border-gray-200'}`} onPress={() => setSelectedCategory(c.value)}>
              <Text className={`text-sm font-body ${selectedCategory === c.value ? 'text-white' : 'text-gray-500'}`}>{c.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {loading ? (
        <View className="p-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="card" className="mb-2" />)}
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, i) => String(item.id || i)}
          renderItem={renderCard}
          contentContainerClassName="px-4 pb-12"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a472a" />}
          ListEmptyComponent={<Text className="text-base font-body text-gray-500 text-center p-8">No results found</Text>}
        />
      )}
    </SafeAreaView>
  );
}
