import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../../components/ui/Avatar';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const maskPhone = (phone?: string) => {
    if (!phone || phone.length < 6) return phone || '';
    return phone.slice(0, 4) + '****' + phone.slice(-3);
  };

  const identityRows = [
    { label: 'Phone', value: maskPhone(user?.phone_number) },
    { label: 'Email', value: user?.email || 'Not set' },
    { label: 'Occupation', value: user?.occupation || '-' },
  ];

  const locationRows = [
    { label: 'State', value: user?.state_name || '-' },
    { label: 'LGA', value: user?.lga_name || '-' },
    { label: 'Ward', value: user?.ward_name || '-' },
  ];

  const membershipRows = [
    { label: 'Membership ID', value: user?.membership_id || '-' },
    { label: 'Referral Code', value: user?.referral_code || '-' },
    { label: 'Role', value: user?.role?.replace(/_/g, ' ') || '-' },
    { label: 'Voter Card', value: user?.voter_verification_status || '-' },
  ];

  const renderGroup = (title: string, rows: { label: string; value: string }[], delay: number) => (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} className="mb-4">
      <Text className="text-sm font-body-semibold text-gray-500 uppercase tracking-wide mb-1 pl-1">{title}</Text>
      <View className="bg-surface rounded-xl p-4 shadow-sm">
        {rows.map((row, i) => (
          <View key={row.label} className={`flex-row justify-between py-2 ${i < rows.length - 1 ? 'border-b border-gray-100' : ''}`}>
            <Text className="text-sm font-body text-gray-500">{row.label}</Text>
            <Text className="text-base font-body-medium text-gray-900 max-w-[55%] text-right">{row.value}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 64 }} bounces>
        {/* Hero Header */}
        <LinearGradient colors={['#0d2416', '#1a472a', '#2d6a4f']} className="pb-10 px-6">
          <SafeAreaView edges={['top']}>
            <View className="items-center pt-8">
              <Avatar name={user?.full_name || ''} size="xl" />
              <Text className="text-2xl font-display-bold text-white mt-2">{user?.full_name}</Text>
              {user?.role && (
                <View className="bg-gold px-4 py-1 rounded-full mt-1">
                  <Text className="text-xs font-body-bold text-forest-dark capitalize">{user.role.replace(/_/g, ' ')}</Text>
                </View>
              )}
              <Text className="text-sm font-body text-white/70 mt-1">{[user?.state_name, user?.lga_name].filter(Boolean).join(' • ')}</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View className="px-6 -mt-4">
          {renderGroup('Identity', identityRows, 100)}
          {renderGroup('Location', locationRows, 200)}
          {renderGroup('Membership', membershipRows, 300)}

          <Animated.View entering={FadeInDown.delay(400).duration(400)} className="mt-4">
            <Pressable className="bg-surface rounded-xl py-4 items-center border border-forest/20 mb-2 shadow-sm" onPress={() => navigation.navigate('EditProfile')}>
              <Text className="text-base font-body-semibold text-forest">✏️ Edit Profile</Text>
            </Pressable>
            <Pressable className="bg-surface rounded-xl py-4 items-center border border-forest/20 mb-2 shadow-sm" onPress={() => navigation.navigate('MyOpportunities')}>
              <Text className="text-base font-body-semibold text-forest">💼 My Opportunity Profiles</Text>
            </Pressable>
            <Pressable className="bg-danger/10 rounded-xl py-4 items-center border border-danger/20" onPress={logout}>
              <Text className="text-base font-body-semibold text-danger">Log Out</Text>
            </Pressable>
          </Animated.View>

          <Text className="text-xs font-body text-gray-400 text-center mt-6">City Boy Connect v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}
