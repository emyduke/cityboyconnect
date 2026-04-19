import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
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

  if (loading) return <SafeAreaView className="flex-1 bg-background"><View className="p-4"><Skeleton variant="card" /></View></SafeAreaView>;
  if (!biz) return null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView contentContainerClassName="pb-12">
        <View className="items-center py-8 bg-surface shadow-sm">
          <Avatar name={biz.name || ''} size="lg" />
          <Text className="text-2xl font-display-bold text-gray-900 mt-2">{biz.name}</Text>
          <Text className="text-base font-body-medium text-forest mt-1">{biz.category_display || biz.category}</Text>
        </View>

        {biz.description && (
          <View className="p-4 bg-surface mt-2 shadow-sm">
            <Text className="text-lg font-display-semibold text-gray-900 mb-2">About</Text>
            <Text className="text-base font-body text-gray-500">{biz.description}</Text>
          </View>
        )}

        <View className="p-4 bg-surface mt-2 shadow-sm">
          <Text className="text-lg font-display-semibold text-gray-900 mb-2">Location</Text>
          <Text className="text-base font-body text-gray-500">{biz.address || ''}</Text>
          {biz.state_name && <Text className="text-sm font-body text-gray-400 mt-1">{biz.state_name}{biz.lga_name ? ` · ${biz.lga_name}` : ''}</Text>}
          {biz.operates_nationwide && <Text className="text-xs font-body-bold text-forest mt-2">Operates Nationwide</Text>}
        </View>

        <View className="p-4 gap-2">
          {biz.phone && (
            <Pressable className="bg-forest py-4 rounded-md items-center" onPress={() => Linking.openURL(`tel:${biz.phone}`)}>
              <Text className="text-sm font-body-bold text-white">📞 Call</Text>
            </Pressable>
          )}
          {biz.whatsapp && (
            <Pressable className="bg-surface py-4 rounded-md items-center border border-forest" onPress={() => Linking.openURL(`https://wa.me/${biz.whatsapp.replace(/\+/g, '')}`)}>
              <Text className="text-sm font-body-bold text-forest">💬 WhatsApp</Text>
            </Pressable>
          )}
          {biz.website && (
            <Pressable className="bg-surface py-4 rounded-md items-center border border-forest" onPress={() => Linking.openURL(biz.website)}>
              <Text className="text-sm font-body-bold text-forest">🌐 Website</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
