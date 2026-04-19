import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, Pressable, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
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

  if (loading) return <View className="p-4"><Skeleton variant="card" /></View>;
  if (!bubble) return <View className="p-4"><Text>Bubble not found.</Text></View>;

  const sc = STATUS_COLORS[bubble.status] || STATUS_COLORS.PENDING;
  const idx = STATUS_ORDER.indexOf(bubble.status);
  const requestImages = (bubble.images || []).filter((i) => i.image_type === 'REQUEST');
  const deliveryImages = (bubble.images || []).filter((i) => i.image_type === 'DELIVERY');
  const isCreator = user?.full_name === bubble.created_by_name;
  const canAddPhoto = isCreator && ['PENDING', 'IN_REVIEW'].includes(bubble.status);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView contentContainerClassName="p-4">
        {/* Status Stepper */}
        {!['REJECTED', 'CANCELLED'].includes(bubble.status) && (
          <View className="flex-row gap-1 mb-4">
            {STATUS_ORDER.map((s, i) => (
              <View key={s} className={`flex-1 h-1 rounded-[2px] ${i < idx ? 'bg-forest' : i === idx ? 'bg-gold' : 'bg-gray-200'}`} />
            ))}
          </View>
        )}

        <View className="flex-row gap-2 mb-2">
          <View className="px-2.5 py-[3px] rounded-full" style={{ backgroundColor: CAT_COLORS[bubble.category] || '#6b7280' }}>
            <Text className="text-white text-xs font-body-semibold">{bubble.category_display}</Text>
          </View>
          <View className="px-2.5 py-[3px] rounded-full" style={{ backgroundColor: sc.bg }}>
            <Text className="text-xs font-body-semibold" style={{ color: sc.text }}>{bubble.status_display}</Text>
          </View>
        </View>

        <Text className="text-[22px] font-extrabold text-gray-900 mb-4">{bubble.title}</Text>

        <View className="bg-surface rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Description</Text>
          <Text className="text-[15px] leading-[22px] text-gray-900">{bubble.description}</Text>
        </View>

        <View className="bg-surface rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Location</Text>
          <Text className="text-sm text-gray-500">
            {[bubble.state_name, bubble.lga_name, bubble.ward_name].filter(Boolean).join(' → ') || 'N/A'}
          </Text>
        </View>

        {(bubble.contact_phone || bubble.contact_whatsapp) && (
          <View className="bg-surface rounded-lg p-4 mb-4 shadow-sm">
            <Text className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Contact</Text>
            <View className="flex-row gap-3 flex-wrap">
              {bubble.contact_phone && (
                <Pressable className="bg-[#e8f5e9] px-3.5 py-2 rounded-md" onPress={() => Linking.openURL(`tel:${bubble.contact_phone}`)}>
                  <Text className="font-semibold text-sm text-forest">📞 {bubble.contact_phone}</Text>
                </Pressable>
              )}
              {bubble.contact_whatsapp && (
                <Pressable className="bg-success-light px-3.5 py-2 rounded-md" onPress={() => Linking.openURL(`https://wa.me/${bubble.contact_whatsapp?.replace(/[^0-9]/g, '')}`)}>
                  <Text className="font-semibold text-sm text-green-700">💬 WhatsApp</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {requestImages.length > 0 && (
          <View className="bg-surface rounded-lg p-4 mb-4 shadow-sm">
            <Text className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {requestImages.map((img) => (
                <Image key={img.id} source={{ uri: img.image }} className="w-[120px] h-[120px] rounded-md mr-2" />
              ))}
            </ScrollView>
          </View>
        )}

        {canAddPhoto && (
          <Button variant="secondary" size="sm" onPress={handleAddPhoto} className="mb-4">
            + Add Photo
          </Button>
        )}

        {['SERVICES', 'ENTERTAINMENT', 'EDUCATION', 'TECHNOLOGY'].includes(bubble.category) && (
          <Pressable className="bg-forest/10 border border-forest rounded-md p-4 mb-4" onPress={() => navigation.navigate('MoreTab', { screen: 'Opportunities' })}>
            <Text className="font-body text-sm text-forest">💡 Looking for a specific talent? <Text className="font-bold">Search our directory →</Text></Text>
          </Pressable>
        )}

        {bubble.status === 'DELIVERED' && (
          <View className="bg-success-light rounded-md p-4 mb-4">
            <Text className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Delivery</Text>
            <Text className="text-[15px] leading-[22px] text-gray-900">{bubble.delivery_notes}</Text>
            {bubble.delivered_at && (
              <Text className="text-[13px] text-gray-400 mt-1">Delivered {new Date(bubble.delivered_at).toLocaleDateString()}</Text>
            )}
            {deliveryImages.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
                {deliveryImages.map((img) => (
                  <Image key={img.id} source={{ uri: img.image }} className="w-[120px] h-[120px] rounded-md mr-2" />
                ))}
              </ScrollView>
            )}
          </View>
        )}

        <Text className="text-[13px] text-gray-400 text-center mt-2">
          Created by {bubble.created_by_name} · {new Date(bubble.created_at).toLocaleDateString()}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

