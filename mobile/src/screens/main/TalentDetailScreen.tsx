import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
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

  if (loading) return <SafeAreaView className="flex-1 bg-background"><View className="p-4"><Skeleton variant="card" /><Skeleton variant="card" className="mt-4" /></View></SafeAreaView>;
  if (!profile) return null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView contentContainerClassName="pb-12">
        <View className="items-center py-8 bg-surface shadow-sm">
          <Avatar name={profile.full_name || ''} size="lg" />
          <Text className="text-2xl font-display-bold text-gray-900 mt-2">{profile.full_name}</Text>
          <Text className="text-base font-body-medium text-forest mt-1">{profile.category_display || profile.category}</Text>
          {profile.title && <Text className="text-base font-body text-gray-500 mt-1">{profile.title}</Text>}
        </View>

        {profile.bio && (
          <View className="p-4 bg-surface mt-2 shadow-sm">
            <Text className="text-lg font-display-semibold text-gray-900 mb-2">About</Text>
            <Text className="text-base font-body text-gray-500">{profile.bio}</Text>
          </View>
        )}

        {profile.years_of_experience > 0 && (
          <View className="p-4 bg-surface mt-2 shadow-sm">
            <Text className="text-lg font-display-semibold text-gray-900 mb-2">Experience</Text>
            <Text className="text-base font-body text-gray-500">{profile.years_of_experience} year{profile.years_of_experience !== 1 ? 's' : ''}</Text>
          </View>
        )}

        {profile.portfolio_items?.length > 0 && (
          <View className="p-4 bg-surface mt-2 shadow-sm">
            <Text className="text-lg font-display-semibold text-gray-900 mb-2">Portfolio</Text>
            {profile.portfolio_items.map((p: any) => (
              <View key={p.id} className="py-2 border-b border-gray-200">
                <Text className="text-base font-body-medium text-gray-900">{p.title}</Text>
                {p.description && <Text className="text-base font-body text-gray-500">{p.description}</Text>}
              </View>
            ))}
          </View>
        )}

        <View className="flex-row gap-2 p-4">
          {profile.show_phone && profile.phone_number && (
            <Pressable className="flex-1 bg-forest py-4 rounded-md items-center" onPress={() => Linking.openURL(`tel:${profile.phone_number}`)}>
              <Text className="text-sm font-body-bold text-white">📞 Call</Text>
            </Pressable>
          )}
          {profile.show_whatsapp && profile.whatsapp_number && (
            <Pressable className="flex-1 bg-surface py-4 rounded-md items-center border border-forest" onPress={() => Linking.openURL(`https://wa.me/${profile.whatsapp_number.replace(/\+/g, '')}`)}>
              <Text className="text-sm font-body-bold text-forest">💬 WhatsApp</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
