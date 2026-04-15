import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { getBusinessDetail } from '../../api/opportunities';
import { unwrap } from '../../api/client';
import Avatar from '../../components/ui/Avatar';
import Skeleton from '../../components/ui/Skeleton';

export default function BusinessDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { id } = route.params;
  const [biz, setBiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getBusinessDetail(id);
        setBiz(unwrap(res));
      } catch { navigation.goBack(); }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <SafeAreaView style={styles.safe}><View style={styles.pad}><Skeleton variant="card" /></View></SafeAreaView>;
  if (!biz) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Avatar name={biz.name || ''} size="lg" />
          <Text style={styles.name}>{biz.name}</Text>
          <Text style={styles.category}>{biz.category_display || biz.category}</Text>
        </View>

        {biz.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.body}>{biz.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.body}>{biz.address || ''}</Text>
          {biz.state_name && <Text style={styles.meta}>{biz.state_name}{biz.lga_name ? ` · ${biz.lga_name}` : ''}</Text>}
          {biz.operates_nationwide && <Text style={styles.badge}>Operates Nationwide</Text>}
        </View>

        <View style={styles.actions}>
          {biz.phone && (
            <Pressable style={styles.actionBtn} onPress={() => Linking.openURL(`tel:${biz.phone}`)}>
              <Text style={styles.actionBtnText}>📞 Call</Text>
            </Pressable>
          )}
          {biz.whatsapp && (
            <Pressable style={[styles.actionBtn, styles.secondary]} onPress={() => Linking.openURL(`https://wa.me/${biz.whatsapp.replace(/\+/g, '')}`)}>
              <Text style={[styles.actionBtnText, styles.secondaryText]}>💬 WhatsApp</Text>
            </Pressable>
          )}
          {biz.website && (
            <Pressable style={[styles.actionBtn, styles.secondary]} onPress={() => Linking.openURL(biz.website)}>
              <Text style={[styles.actionBtnText, styles.secondaryText]}>🌐 Website</Text>
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
  section: { padding: spacing.md, backgroundColor: colors.surface, marginTop: spacing.sm, ...shadows.sm },
  sectionTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.textSecondary },
  meta: { ...typography.bodySm, color: colors.textTertiary, marginTop: spacing.xs },
  badge: { ...typography.captionBold, color: colors.primary, marginTop: spacing.sm },
  actions: { padding: spacing.md, gap: spacing.sm },
  actionBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
  actionBtnText: { ...typography.button, color: colors.textInverse },
  secondaryText: { color: colors.primary },
});
