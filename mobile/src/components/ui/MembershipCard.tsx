import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';

cssInterop(Image, { className: 'style' });
cssInterop(LinearGradient, { className: 'style' });

interface MembershipCardUser {
  full_name?: string;
  membership_id?: string;
  role?: string;
  state_name?: string;
  lga_name?: string;
  ward_name?: string;
}

interface MembershipCardProps {
  user: MembershipCardUser;
  compact?: boolean;
  onPress?: () => void;
}

export default function MembershipCard({ user, compact = false, onPress }: MembershipCardProps) {
  const location = [user.ward_name, user.lga_name, user.state_name].filter(Boolean).join(' • ');

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <LinearGradient
        colors={['#0d2416', '#1a472a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className={`rounded-lg shadow-md ${compact ? 'p-4' : 'p-6'}`}
      >
        <Image
          source={require('../../../assets/files/09_horizontal_transparent.png')}
          className={compact ? 'w-[100px] h-6 mb-2' : 'w-[120px] h-8 mb-4'}
          contentFit="contain"
        />

        <View className="flex-row items-center mb-1 gap-2">
          <Text className="text-[17px] font-display-semibold text-white flex-1" numberOfLines={1}>
            {user.full_name || 'Member'}
          </Text>
          {user.role && (
            <View className="bg-gold px-2 py-0.5 rounded-full">
              <Text className="text-[10px] font-body-bold text-forest-dark uppercase">
                {user.role.replace(/_/g, ' ')}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row justify-between items-center">
          <Text className="text-[13px] font-body-medium leading-[18px] text-gold-light">
            {user.membership_id || '—'}
          </Text>
          {location ? (
            <Text className="text-xs font-body tracking-wide text-white/70">
              {location}
            </Text>
          ) : null}
        </View>
      </LinearGradient>
    </Pressable>
  );
}
