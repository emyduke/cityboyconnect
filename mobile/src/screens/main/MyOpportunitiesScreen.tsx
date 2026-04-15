import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius, shadows } from '../../theme';
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

  if (loading) return <SafeAreaView style={styles.safe}><View style={styles.pad}><Skeleton variant="card" /><Skeleton variant="card" style={{ marginTop: spacing.md }} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <Text style={styles.pageTitle}>My Opportunity Profiles</Text>

        {/* Professional Profile */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💼 Professional Profile</Text>
          {profProfile ? (
            <>
              <Text style={styles.cardValue}>{profProfile.headline || 'No headline'}</Text>
              <View style={styles.cardActions}>
                <Pressable style={styles.editBtn} onPress={() => { setProfForm({ headline: profProfile.headline || '', bio: profProfile.bio || '' }); setShowProfForm(true); }}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </Pressable>
                <Pressable style={styles.deleteBtn} onPress={deleteProfHandler}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Pressable style={styles.createBtn} onPress={() => { setProfForm({ headline: '', bio: '' }); setShowProfForm(true); }}>
              <Text style={styles.createBtnText}>Create Professional Profile</Text>
            </Pressable>
          )}
        </View>

        {showProfForm && (
          <View style={styles.formCard}>
            <TextInput style={styles.input} placeholder="Headline" placeholderTextColor={colors.textTertiary} value={profForm.headline} onChangeText={t => setProfForm(p => ({ ...p, headline: t }))} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Bio" placeholderTextColor={colors.textTertiary} value={profForm.bio} onChangeText={t => setProfForm(p => ({ ...p, bio: t }))} multiline numberOfLines={4} />
            <View style={styles.formActions}>
              <Pressable style={styles.saveBtn} onPress={saveProfessional} disabled={profSaving}>
                <Text style={styles.saveBtnText}>{profSaving ? 'Saving...' : 'Save'}</Text>
              </Pressable>
              <Pressable onPress={() => setShowProfForm(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Talent Profile */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎨 Talent Profile</Text>
          {talentProfile ? (
            <>
              <Text style={styles.cardValue}>{talentProfile.category_display || talentProfile.category} — {talentProfile.title || 'No title'}</Text>
              <View style={styles.cardActions}>
                <Pressable style={styles.editBtn} onPress={() => { setTalentForm({ category: talentProfile.category || '', title: talentProfile.title || '', bio: talentProfile.bio || '', years_of_experience: String(talentProfile.years_of_experience || '') }); setShowTalentForm(true); }}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </Pressable>
                <Pressable style={styles.deleteBtn} onPress={deleteTalentHandler}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Pressable style={styles.createBtn} onPress={() => { setTalentForm({ category: '', title: '', bio: '', years_of_experience: '' }); setShowTalentForm(true); }}>
              <Text style={styles.createBtnText}>Create Talent Profile</Text>
            </Pressable>
          )}
        </View>

        {showTalentForm && (
          <View style={styles.formCard}>
            <TextInput style={styles.input} placeholder="Title" placeholderTextColor={colors.textTertiary} value={talentForm.title} onChangeText={t => setTalentForm(p => ({ ...p, title: t }))} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Bio" placeholderTextColor={colors.textTertiary} value={talentForm.bio} onChangeText={t => setTalentForm(p => ({ ...p, bio: t }))} multiline numberOfLines={4} />
            <TextInput style={styles.input} placeholder="Years of experience" placeholderTextColor={colors.textTertiary} value={talentForm.years_of_experience} onChangeText={t => setTalentForm(p => ({ ...p, years_of_experience: t }))} keyboardType="numeric" />
            <View style={styles.formActions}>
              <Pressable style={styles.saveBtn} onPress={saveTalent} disabled={talentSaving}>
                <Text style={styles.saveBtnText}>{talentSaving ? 'Saving...' : 'Save'}</Text>
              </Pressable>
              <Pressable onPress={() => setShowTalentForm(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Business Listings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏪 Business Listings</Text>
          {businesses.length === 0 ? (
            <Text style={styles.emptyText}>No business listings yet</Text>
          ) : (
            businesses.map(b => (
              <View key={b.id} style={styles.bizItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bizName}>{b.name}</Text>
                  <Text style={styles.bizCategory}>{b.category_display || b.category}</Text>
                </View>
                <Pressable style={styles.deleteBtn} onPress={() => deleteBizHandler(b.id)}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  pad: { padding: spacing.md },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  pageTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
  cardTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.sm },
  cardValue: { ...typography.body, color: colors.textSecondary },
  cardActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  editBtn: { backgroundColor: colors.primary + '15', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm },
  editBtnText: { ...typography.button, color: colors.primary, fontSize: 13 },
  deleteBtn: { backgroundColor: colors.dangerLight, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm },
  deleteBtnText: { ...typography.button, color: colors.danger, fontSize: 13 },
  createBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center', marginTop: spacing.sm },
  createBtnText: { ...typography.button, color: colors.textInverse },
  formCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
  input: { backgroundColor: colors.background, borderRadius: radius.sm, padding: spacing.md, ...typography.body, color: colors.text, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  saveBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.sm },
  saveBtnText: { ...typography.button, color: colors.textInverse },
  cancelText: { ...typography.bodyMedium, color: colors.textSecondary },
  emptyText: { ...typography.body, color: colors.textTertiary },
  bizItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  bizName: { ...typography.bodyMedium, color: colors.text },
  bizCategory: { ...typography.bodySm, color: colors.textSecondary },
});
