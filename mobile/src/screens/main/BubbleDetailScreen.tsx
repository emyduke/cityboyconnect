import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Pressable, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography, shadows } from '../../theme';
import { getBubble, addBubbleImage, Bubble, BubbleImage as BImg } from '../../api/bubbles';
import { unwrap } from '../../api/client';
import Skeleton from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import * as ImagePicker from 'expo-image-picker';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fef3c7', text: '#854d0e' },
  IN_REVIEW: { bg: '#3b82f6', text: '#fff' },
  APPROVED: { bg: '#22c55e', text: '#fff' },
  IN_PROGRESS: { bg: '#f97316', text: '#fff' },
  DELIVERED: { bg: '#10b981', text: '#fff' },
  REJECTED: { bg: '#ef4444', text: '#fff' },
};

const CAT_COLORS: Record<string, string> = {
  TOOLS: '#1a472a', OPPORTUNITIES: '#2563eb', SERVICES: '#ea580c',
  SUPPORT: '#7c3aed', OTHER: '#6b7280',
};

const STATUS_ORDER = ['PENDING', 'IN_REVIEW', 'APPROVED', 'IN_PROGRESS', 'DELIVERED'];

export default function BubbleDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params;
  const user = useAuthStore((s) => s.user);
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await getBubble(id);
      setBubble(unwrap(res));
    } catch { /* handled */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const fd = new FormData();
    fd.append('image', {
      uri: asset.uri,
      type: asset.mimeType || 'image/jpeg',
      name: asset.fileName || 'photo.jpg',
    } as any);
    try {
      await addBubbleImage(id, fd);
      Alert.alert('Success', 'Photo added');
      load();
    } catch {
      Alert.alert('Error', 'Failed to upload photo');
    }
  };

  if (loading) return <View style={styles.container}><Skeleton variant="card" /></View>;
  if (!bubble) return <View style={styles.container}><Text>Bubble not found.</Text></View>;

  const sc = STATUS_COLORS[bubble.status] || STATUS_COLORS.PENDING;
  const idx = STATUS_ORDER.indexOf(bubble.status);
  const requestImages = (bubble.images || []).filter((i) => i.image_type === 'REQUEST');
  const deliveryImages = (bubble.images || []).filter((i) => i.image_type === 'DELIVERY');
  const isCreator = user?.full_name === bubble.created_by_name;
  const canAddPhoto = isCreator && ['PENDING', 'IN_REVIEW'].includes(bubble.status);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Status Stepper */}
        {!['REJECTED', 'CANCELLED'].includes(bubble.status) && (
          <View style={styles.stepper}>
            {STATUS_ORDER.map((s, i) => (
              <View key={s} style={[styles.stepperBar, i < idx && styles.stepperDone, i === idx && styles.stepperActive]} />
            ))}
          </View>
        )}

        <View style={styles.badges}>
          <View style={[styles.catBadge, { backgroundColor: CAT_COLORS[bubble.category] || '#6b7280' }]}>
            <Text style={styles.catBadgeText}>{bubble.category_display}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusBadgeText, { color: sc.text }]}>{bubble.status_display}</Text>
          </View>
        </View>

        <Text style={styles.title}>{bubble.title}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.desc}>{bubble.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.locationText}>
            {[bubble.state_name, bubble.lga_name, bubble.ward_name].filter(Boolean).join(' → ') || 'N/A'}
          </Text>
        </View>

        {(bubble.contact_phone || bubble.contact_whatsapp) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <View style={styles.contactRow}>
              {bubble.contact_phone && (
                <Pressable style={styles.contactBtn} onPress={() => Linking.openURL(`tel:${bubble.contact_phone}`)}>
                  <Text style={styles.contactBtnText}>📞 {bubble.contact_phone}</Text>
                </Pressable>
              )}
              {bubble.contact_whatsapp && (
                <Pressable style={[styles.contactBtn, { backgroundColor: '#dcfce7' }]} onPress={() => Linking.openURL(`https://wa.me/${bubble.contact_whatsapp?.replace(/[^0-9]/g, '')}`)}>
                  <Text style={[styles.contactBtnText, { color: '#15803d' }]}>💬 WhatsApp</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {requestImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {requestImages.map((img) => (
                <Image key={img.id} source={{ uri: img.image }} style={styles.imgThumb} />
              ))}
            </ScrollView>
          </View>
        )}

        {canAddPhoto && (
          <Button variant="secondary" size="sm" onPress={handleAddPhoto} style={{ marginBottom: spacing.md }}>
            + Add Photo
          </Button>
        )}

        {bubble.status === 'DELIVERED' && (
          <View style={styles.deliveryBox}>
            <Text style={styles.sectionTitle}>Delivery</Text>
            <Text style={styles.desc}>{bubble.delivery_notes}</Text>
            {bubble.delivered_at && (
              <Text style={styles.deliveryDate}>Delivered {new Date(bubble.delivered_at).toLocaleDateString()}</Text>
            )}
            {deliveryImages.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                {deliveryImages.map((img) => (
                  <Image key={img.id} source={{ uri: img.image }} style={styles.imgThumb} />
                ))}
              </ScrollView>
            )}
          </View>
        )}

        <Text style={styles.metaText}>
          Created by {bubble.created_by_name} · {new Date(bubble.created_at).toLocaleDateString()}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md },
  stepper: { flexDirection: 'row', gap: 4, marginBottom: spacing.md },
  stepperBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  stepperDone: { backgroundColor: colors.primary },
  stepperActive: { backgroundColor: colors.accent },
  badges: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
  catBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },
  catBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  section: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: spacing.md, ...shadows.sm },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textTertiary, marginBottom: 8 },
  desc: { fontSize: 15, lineHeight: 22, color: colors.text },
  locationText: { fontSize: 14, color: colors.textSecondary },
  contactRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  contactBtn: { backgroundColor: '#e8f5e9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md },
  contactBtnText: { fontWeight: '600', fontSize: 14, color: colors.primary },
  imgThumb: { width: 120, height: 120, borderRadius: radius.md, marginRight: 8 },
  deliveryBox: { backgroundColor: '#f0fdf4', borderRadius: radius.md, padding: 16, marginBottom: spacing.md },
  deliveryDate: { fontSize: 13, color: colors.textTertiary, marginTop: 4 },
  metaText: { fontSize: 13, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.sm },
});
