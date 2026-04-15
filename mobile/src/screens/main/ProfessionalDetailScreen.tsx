import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { getOpportunityProfile } from '../../api/opportunities';
import { unwrap } from '../../api/client';
import Avatar from '../../components/ui/Avatar';
import Skeleton from '../../components/ui/Skeleton';

export default function ProfessionalDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { userId } = route.params;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getOpportunityProfile('professional', userId);
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
          {profile.headline && <Text style={styles.headline}>{profile.headline}</Text>}
        </View>

        {profile.skills?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsRow}>
              {profile.skills.map((s: any, i: number) => (
                <View key={i} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{typeof s === 'string' ? s : s.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {profile.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.body}>{profile.bio}</Text>
          </View>
        )}

        {profile.work_experience?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {profile.work_experience.map((w: any, i: number) => (
              <View key={i} style={styles.expItem}>
                <Text style={styles.expTitle}>{w.title || w.role}</Text>
                <Text style={styles.expCompany}>{w.company}{w.years ? ` · ${w.years}` : ''}</Text>
              </View>
            ))}
          </View>
        )}

        {profile.education?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {profile.education.map((e: any, i: number) => (
              <View key={i} style={styles.expItem}>
                <Text style={styles.expTitle}>{e.degree || e.qualification}</Text>
                <Text style={styles.expCompany}>{e.school || e.institution}{e.year ? ` · ${e.year}` : ''}</Text>
              </View>
            ))}
          </View>
        )}

        {profile.cv_url && (
          <Pressable style={styles.cvBtn} onPress={() => Linking.openURL(profile.cv_url)}>
            <Text style={styles.cvBtnText}>📄 Download CV</Text>
          </Pressable>
        )}
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
  headline: { ...typography.bodyMedium, color: colors.primary, marginTop: spacing.xs, textAlign: 'center', paddingHorizontal: spacing.lg },
  section: { padding: spacing.md, backgroundColor: colors.surface, marginTop: spacing.sm, ...shadows.sm },
  sectionTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.textSecondary },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  skillBadge: { backgroundColor: colors.primary + '15', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full },
  skillText: { ...typography.bodySm, color: colors.primary },
  expItem: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  expTitle: { ...typography.bodyMedium, color: colors.text },
  expCompany: { ...typography.bodySm, color: colors.textSecondary, marginTop: 2 },
  cvBtn: { margin: spacing.md, backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  cvBtnText: { ...typography.button, color: colors.textInverse },
});
