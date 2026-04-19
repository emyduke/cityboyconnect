import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMyProfessionalProfile, createProfessionalProfile, updateProfessionalProfile, deleteProfessionalProfile, getMyTalentProfile, createTalentProfile, updateTalentProfile, deleteTalentProfile, getMyBusinessListings, deleteBusinessListing, getTalentCategories } from '../../api/opportunities';
import { unwrap } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import Skeleton from '../../components/ui/Skeleton';

export default function MyOpportunitiesScreen() {
  const toast = useToastStore((s) => s.show);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profProfile, setProfProfile] = useState<any>(null);
  const [talentProfile, setTalentProfile] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Professional form
  const [showProfForm, setShowProfForm] = useState(false);
  const [profForm, setProfForm] = useState({ headline: '', bio: '' });
  const [profSaving, setProfSaving] = useState(false);

  // Talent form
  const [showTalentForm, setShowTalentForm] = useState(false);
  const [talentForm, setTalentForm] = useState({ category: '', title: '', bio: '', years_of_experience: '' });
  const [talentSaving, setTalentSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [profRes, talentRes, bizRes, catRes] = await Promise.all([
        getMyProfessionalProfile().catch(() => null),
        getMyTalentProfile().catch(() => null),
        getMyBusinessListings().catch(() => ({ data: [] })),
        getTalentCategories().catch(() => ({ data: [] })),
      ]);
      if (profRes) setProfProfile(unwrap(profRes));
      if (talentRes) setTalentProfile(unwrap(talentRes));
      const bizData = unwrap(bizRes as any);
      setBusinesses(Array.isArray(bizData) ? bizData : bizData?.results || []);
      setCategories(unwrap(catRes as any) || []);
    } catch { /* ok */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const saveProfessional = async () => {
    setProfSaving(true);
    try {
      if (profProfile) {
        const res = await updateProfessionalProfile(profForm);
        setProfProfile(unwrap(res));
      } else {
        const res = await createProfessionalProfile(profForm);
        setProfProfile(unwrap(res));
      }
      toast('Professional profile saved!', 'success');
      setShowProfForm(false);
    } catch { toast('Failed to save', 'error'); }
    setProfSaving(false);
  };

  const deleteProfHandler = () => {
    Alert.alert('Delete', 'Delete your professional profile?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteProfessionalProfile(); setProfProfile(null); toast('Deleted', 'success'); } catch { toast('Failed', 'error'); }
      }},
    ]);
  };

  const saveTalent = async () => {
    setTalentSaving(true);
    try {
      const data = { ...talentForm, years_of_experience: parseInt(talentForm.years_of_experience) || 0 };
      if (talentProfile) {
        const res = await updateTalentProfile(data);
        setTalentProfile(unwrap(res));
      } else {
        const res = await createTalentProfile(data);
        setTalentProfile(unwrap(res));
      }
      toast('Talent profile saved!', 'success');
      setShowTalentForm(false);
    } catch { toast('Failed to save', 'error'); }
    setTalentSaving(false);
  };

  const deleteTalentHandler = () => {
    Alert.alert('Delete', 'Delete your talent profile?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteTalentProfile(); setTalentProfile(null); toast('Deleted', 'success'); } catch { toast('Failed', 'error'); }
      }},
    ]);
  };

  const deleteBizHandler = (id: number) => {
    Alert.alert('Delete', 'Delete this business listing?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteBusinessListing(id); setBusinesses(p => p.filter(b => b.id !== id)); toast('Deleted', 'success'); } catch { toast('Failed', 'error'); }
      }},
    ]);
  };

  if (loading) return <SafeAreaView className="flex-1 bg-background"><View className="p-4"><Skeleton variant="card" /><Skeleton variant="card" className="mt-4" /></View></SafeAreaView>;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView contentContainerClassName="p-4 pb-12" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a472a" />}>
        <Text className="text-2xl font-display-bold text-gray-900 mb-4">My Opportunity Profiles</Text>

        {/* Professional Profile */}
        <View className="bg-surface rounded-md p-4 mb-4 shadow-sm">
          <Text className="text-lg font-display-semibold text-gray-900 mb-2">💼 Professional Profile</Text>
          {profProfile ? (
            <>
              <Text className="text-base font-body text-gray-500">{profProfile.headline || 'No headline'}</Text>
              <View className="flex-row gap-2 mt-4">
                <Pressable className="bg-forest/15 px-4 py-2 rounded-sm" onPress={() => { setProfForm({ headline: profProfile.headline || '', bio: profProfile.bio || '' }); setShowProfForm(true); }}>
                  <Text className="text-[13px] font-body-bold text-forest">Edit</Text>
                </Pressable>
                <Pressable className="bg-danger-light px-4 py-2 rounded-sm" onPress={deleteProfHandler}>
                  <Text className="text-[13px] font-body-bold text-danger">Delete</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Pressable className="bg-forest py-4 rounded-md items-center mt-2" onPress={() => { setProfForm({ headline: '', bio: '' }); setShowProfForm(true); }}>
              <Text className="text-sm font-body-bold text-white">Create Professional Profile</Text>
            </Pressable>
          )}
        </View>

        {showProfForm && (
          <View className="bg-surface rounded-md p-4 mb-4 shadow-sm">
            <TextInput className="bg-background rounded-sm p-4 text-base font-body text-gray-900 mb-2 border border-gray-200" placeholder="Headline" placeholderTextColor="#9ca3af" value={profForm.headline} onChangeText={t => setProfForm(p => ({ ...p, headline: t }))} />
            <TextInput className="bg-background rounded-sm p-4 text-base font-body text-gray-900 mb-2 border border-gray-200 min-h-[80px]" style={{ textAlignVertical: 'top' }} placeholder="Bio" placeholderTextColor="#9ca3af" value={profForm.bio} onChangeText={t => setProfForm(p => ({ ...p, bio: t }))} multiline numberOfLines={4} />
            <View className="flex-row items-center gap-4 mt-2">
              <Pressable className="bg-forest px-6 py-2 rounded-sm" onPress={saveProfessional} disabled={profSaving}>
                <Text className="text-sm font-body-bold text-white">{profSaving ? 'Saving...' : 'Save'}</Text>
              </Pressable>
              <Pressable onPress={() => setShowProfForm(false)}>
                <Text className="text-base font-body-medium text-gray-500">Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Talent Profile */}
        <View className="bg-surface rounded-md p-4 mb-4 shadow-sm">
          <Text className="text-lg font-display-semibold text-gray-900 mb-2">🎨 Talent Profile</Text>
          {talentProfile ? (
            <>
              <Text className="text-base font-body text-gray-500">{talentProfile.category_display || talentProfile.category} — {talentProfile.title || 'No title'}</Text>
              <View className="flex-row gap-2 mt-4">
                <Pressable className="bg-forest/15 px-4 py-2 rounded-sm" onPress={() => { setTalentForm({ category: talentProfile.category || '', title: talentProfile.title || '', bio: talentProfile.bio || '', years_of_experience: String(talentProfile.years_of_experience || '') }); setShowTalentForm(true); }}>
                  <Text className="text-[13px] font-body-bold text-forest">Edit</Text>
                </Pressable>
                <Pressable className="bg-danger-light px-4 py-2 rounded-sm" onPress={deleteTalentHandler}>
                  <Text className="text-[13px] font-body-bold text-danger">Delete</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Pressable className="bg-forest py-4 rounded-md items-center mt-2" onPress={() => { setTalentForm({ category: '', title: '', bio: '', years_of_experience: '' }); setShowTalentForm(true); }}>
              <Text className="text-sm font-body-bold text-white">Create Talent Profile</Text>
            </Pressable>
          )}
        </View>

        {showTalentForm && (
          <View className="bg-surface rounded-md p-4 mb-4 shadow-sm">
            <TextInput className="bg-background rounded-sm p-4 text-base font-body text-gray-900 mb-2 border border-gray-200" placeholder="Title" placeholderTextColor="#9ca3af" value={talentForm.title} onChangeText={t => setTalentForm(p => ({ ...p, title: t }))} />
            <TextInput className="bg-background rounded-sm p-4 text-base font-body text-gray-900 mb-2 border border-gray-200 min-h-[80px]" style={{ textAlignVertical: 'top' }} placeholder="Bio" placeholderTextColor="#9ca3af" value={talentForm.bio} onChangeText={t => setTalentForm(p => ({ ...p, bio: t }))} multiline numberOfLines={4} />
            <TextInput className="bg-background rounded-sm p-4 text-base font-body text-gray-900 mb-2 border border-gray-200" placeholder="Years of experience" placeholderTextColor="#9ca3af" value={talentForm.years_of_experience} onChangeText={t => setTalentForm(p => ({ ...p, years_of_experience: t }))} keyboardType="numeric" />
            <View className="flex-row items-center gap-4 mt-2">
              <Pressable className="bg-forest px-6 py-2 rounded-sm" onPress={saveTalent} disabled={talentSaving}>
                <Text className="text-sm font-body-bold text-white">{talentSaving ? 'Saving...' : 'Save'}</Text>
              </Pressable>
              <Pressable onPress={() => setShowTalentForm(false)}>
                <Text className="text-base font-body-medium text-gray-500">Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Business Listings */}
        <View className="bg-surface rounded-md p-4 mb-4 shadow-sm">
          <Text className="text-lg font-display-semibold text-gray-900 mb-2">🏪 Business Listings</Text>
          {businesses.length === 0 ? (
            <Text className="text-base font-body text-gray-400">No business listings yet</Text>
          ) : (
            businesses.map(b => (
              <View key={b.id} className="flex-row items-center py-2 border-b border-gray-200">
                <View className="flex-1">
                  <Text className="text-base font-body-medium text-gray-900">{b.name}</Text>
                  <Text className="text-sm font-body text-gray-500">{b.category_display || b.category}</Text>
                </View>
                <Pressable className="bg-danger-light px-4 py-2 rounded-sm" onPress={() => deleteBizHandler(b.id)}>
                  <Text className="text-[13px] font-body-bold text-danger">Delete</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
