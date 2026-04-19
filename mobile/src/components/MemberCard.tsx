import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Avatar from './ui/Avatar';
import Badge from './ui/Badge';

interface MemberCardProps {
  member: {
    id: number;
    full_name: string;
    profile_photo?: string;
    state_name?: string;
    role?: string;
    voter_verification_status?: string;
  };
  onPress?: () => void;
}

export default function MemberCard({ member, onPress }: MemberCardProps) {
  const statusVariant = member.voter_verification_status === 'VERIFIED' ? 'success'
    : member.voter_verification_status === 'REJECTED' ? 'danger' : 'warning';

  return (
    <Pressable onPress={onPress} className="bg-surface rounded-md p-4 flex-row items-center mb-2 shadow-sm">
      <Avatar uri={member.profile_photo} name={member.full_name} size="md" />
      <View className="flex-1 ml-2">
        <Text className="text-[15px] font-body-medium leading-[22px] text-gray-900" numberOfLines={1}>
          {member.full_name}
        </Text>
        <Text className="text-xs font-body tracking-wide text-gray-500 mt-0.5" numberOfLines={1}>
          {member.state_name || 'No state'}
        </Text>
      </View>
      <View className="items-end gap-1">
        {member.role && member.role !== 'MEMBER' && (
          <Badge label={member.role.replace(/_/g, ' ')} variant="info" />
        )}
        <Badge label={member.voter_verification_status || 'PENDING'} variant={statusVariant} />
      </View>
    </Pressable>
  );
}
