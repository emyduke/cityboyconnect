import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { getOpportunityProfile } from '../../api/opportunities';
import { unwrap } from '../../api/client';
import Avatar from '../../components/ui/Avatar';
import Skeleton from '../../components/ui/Skeleton';

export default function TalentDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { userId } = route.params;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getOpportunityProfile('talent', userId);
        setProfile(unwrap(res));
      } catch { navigation.goBack(); }
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return <SafeAreaView style={styles.safe}><View style={styles.pad}><Skeleton variant="card" /><Skeleton variant="card" style={{ marginTop: spacing.md }} /></View></SafeAreaView>;
  if (!profile) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Avatar name={profile.full_name || ''} size="lg" />
          <Text style={styles.name}>{profile.full_name}</Text>
          <Text style={styles.category}>{profile.category_display || profile.category}</Text>
          {profile.title && <Text style={styles.tagline}>{profile.title}</Text>}
        </View>

        {profile.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.body}>{profile.bio}</Text>
          </View>
        )}

        {profile.years_of_experience > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            <Text style={styles.body}>{profile.years_of_experience} year{profile.years_of_experience !== 1 ? 's' : ''}</Text>
          </View>
        )}

        {profile.portfolio_items?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portfolio</Text>
            {profile.portfolio_items.map((p: any) => (
              <View key={p.id} style={styles.portfolioItem}>
                <Text style={styles.portfolioTitle}>{p.title}</Text>
                {p.description && <Text style={styles.body}>{p.description}</Text>}
              </View>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          {profile.show_phone && profile.phone_number && (
            <Pressable style={styles.actionBtn} onPress={() => Linking.openURL(`tel:${profile.phone_number}`)}>
              <Text style={styles.actionBtnText}>📞 Call</Text>
            </Pressable>
          )}
          {profile.show_whatsapp && profile.whatsapp_number && (
            <Pressable style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => Linking.openURL(`https://wa.me/${profile.whatsapp_number.replace(/\+/g, '')}`)}>
              <Text style={[styles.actionBtnText, styles.actionBtnTextSecondary]}>💬 WhatsApp</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  pad: { padding: spacing.md },
  scroll: { paddingBottom: spacing.xxl },
  hero: { alignItems: 'center', paddingVertical: spacing.xl, backgroundColor: colors.surface, ...shadows.sm },
  name: { ...typography.h2, color: colors.text, marginTop: spacing.sm },
  category: { ...typography.bodyMedium, color: colors.primary, marginTop: spacing.xs },
  tagline: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  section: { padding: spacing.md, backgroundColor: colors.surface, marginTop: spacing.sm, ...shadows.sm },
  sectionTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.textSecondary },
  portfolioItem: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  portfolioTitle: { ...typography.bodyMedium, color: colors.text },
  actions: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  actionBtn: { flex: 1, backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  actionBtnSecondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
  actionBtnText: { ...typography.button, color: colors.textInverse },
  actionBtnTextSecondary: { color: colors.primary },
});
