import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
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

  if (loading) return <SafeAreaView className="flex-1 bg-background"><View className="p-4"><Skeleton variant="card" /><Skeleton variant="card" className="mt-4" /></View></SafeAreaView>;
  if (!profile) return null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView contentContainerClassName="pb-12">
        <View className="items-center py-8 bg-surface shadow-sm">
          <Avatar name={profile.full_name || ''} size="lg" />
          <Text className="text-2xl font-display-bold text-gray-900 mt-2">{profile.full_name}</Text>
          {profile.headline && <Text className="text-base font-body-medium text-forest mt-1 text-center px-6">{profile.headline}</Text>}
        </View>

        {profile.skills?.length > 0 && (
          <View className="p-4 bg-surface mt-2 shadow-sm">
            <Text className="text-lg font-display-semibold text-gray-900 mb-2">Skills</Text>
            <View className="flex-row flex-wrap gap-1">
              {profile.skills.map((s: any, i: number) => (
                <View key={i} className="bg-forest/15 px-2 py-1 rounded-full">
                  <Text className="text-sm font-body text-forest">{typeof s === 'string' ? s : s.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {profile.bio && (
          <View className="p-4 bg-surface mt-2 shadow-sm">
            <Text className="text-lg font-display-semibold text-gray-900 mb-2">About</Text>
            <Text className="text-base font-body text-gray-500">{profile.bio}</Text>
          </View>
        )}

        {profile.work_experience?.length > 0 && (
          <View className="p-4 bg-surface mt-2 shadow-sm">
            <Text className="text-lg font-display-semibold text-gray-900 mb-2">Experience</Text>
            {profile.work_experience.map((w: any, i: number) => (
              <View key={i} className="py-2 border-b border-gray-200">
                <Text className="text-base font-body-medium text-gray-900">{w.title || w.role}</Text>
                <Text className="text-sm font-body text-gray-500 mt-0.5">{w.company}{w.years ? ` · ${w.years}` : ''}</Text>
              </View>
            ))}
          </View>
        )}

        {profile.education?.length > 0 && (
          <View className="p-4 bg-surface mt-2 shadow-sm">
            <Text className="text-lg font-display-semibold text-gray-900 mb-2">Education</Text>
            {profile.education.map((e: any, i: number) => (
              <View key={i} className="py-2 border-b border-gray-200">
                <Text className="text-base font-body-medium text-gray-900">{e.degree || e.qualification}</Text>
                <Text className="text-sm font-body text-gray-500 mt-0.5">{e.school || e.institution}{e.year ? ` · ${e.year}` : ''}</Text>
              </View>
            ))}
          </View>
        )}

        {profile.cv_url && (
          <Pressable className="mx-4 mt-4 bg-forest py-4 rounded-md items-center" onPress={() => Linking.openURL(profile.cv_url)}>
            <Text className="text-sm font-body-bold text-white">📄 Download CV</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
