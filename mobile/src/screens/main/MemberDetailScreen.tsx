import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { getMember } from '../../api/members';
import { unwrap } from '../../api/client';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import { MembersStackParamList } from '../../navigation/types';

type Route = RouteProp<MembersStackParamList, 'MemberDetail'>;

export default function MemberDetailScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<any>();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMember(params.id);
        setMember(unwrap(res));
      } catch { /* handled */ }
      setLoading(false);
    })();
  }, [params.id]);

  if (loading) {
    return (
      <View className="flex-1 bg-background p-4">
        <Skeleton variant="avatar" width={80} height={80} className="self-center" />
        <Skeleton variant="text" width="50%" className="self-center mt-4" />
        <Skeleton variant="card" className="mt-6" />
      </View>
    );
  }

  if (!member) {
    return <View className="flex-1 bg-background p-4"><Text className="text-base font-body text-danger text-center mt-12">Member not found</Text></View>;
  }

  const statusVariant = member.voter_verification_status === 'VERIFIED' ? 'success'
    : member.voter_verification_status === 'REJECTED' ? 'danger' : 'warning';

  return (
    <ScrollView className="flex-1 bg-background p-4" contentContainerStyle={{ paddingBottom: 48 }}>
      <View className="items-center mb-6">
        <Avatar uri={member.profile_photo} name={member.full_name} size="xl" />
        <Text className="text-2xl font-display-bold text-gray-900 mt-2">{member.full_name}</Text>
        <View className="flex-row gap-1 mt-1">
          {member.role && <Badge label={member.role.replace(/_/g, ' ')} variant="info" />}
          <Badge label={member.voter_verification_status || 'PENDING'} variant={statusVariant} />
        </View>
      </View>

      <Card className="mt-2">
        <InfoRow label="Phone" value={member.phone_number_masked || '***'} />
        <InfoRow label="State" value={member.state_name} />
        <InfoRow label="LGA" value={member.lga_name} />
        <InfoRow label="Ward" value={member.ward_name} />
        <InfoRow label="Occupation" value={member.occupation} />
        <InfoRow label="Gender" value={member.gender === 'M' ? 'Male' : member.gender === 'F' ? 'Female' : member.gender} />
        <InfoRow label="Membership ID" value={member.membership_id} />
        <InfoRow label="Referral Code" value={member.referral_code} />
        <InfoRow label="Joined" value={member.joined_at ? new Date(member.joined_at).toLocaleDateString() : ''} />
      </Card>

      {(member.has_professional_profile || member.has_talent_profile || member.has_business_listings) && (
        <View className="mt-4">
          <Text className="text-lg font-display-semibold text-gray-900 mb-2">Opportunity Profiles</Text>
          {member.has_professional_profile && (
            <Pressable className="flex-row items-center bg-surface rounded-lg p-4 mb-1 shadow-sm" onPress={() => navigation.navigate('MoreTab', { screen: 'ProfessionalDetail', params: { id: member.id } })}>
              <Text className="text-xl mr-2">💼</Text>
              <Text className="text-base font-body-medium text-gray-900 flex-1">Professional Profile</Text>
              <Text className="text-xl text-gray-400">›</Text>
            </Pressable>
          )}
          {member.has_talent_profile && (
            <Pressable className="flex-row items-center bg-surface rounded-lg p-4 mb-1 shadow-sm" onPress={() => navigation.navigate('MoreTab', { screen: 'TalentDetail', params: { id: member.id } })}>
              <Text className="text-xl mr-2">⭐</Text>
              <Text className="text-base font-body-medium text-gray-900 flex-1">Talent Profile</Text>
              <Text className="text-xl text-gray-400">›</Text>
            </Pressable>
          )}
          {member.has_business_listings && (
            <Pressable className="flex-row items-center bg-surface rounded-lg p-4 mb-1 shadow-sm" onPress={() => navigation.navigate('MoreTab', { screen: 'BusinessDetail', params: { id: member.id } })}>
              <Text className="text-xl mr-2">🏢</Text>
              <Text className="text-base font-body-medium text-gray-900 flex-1">Business Listing</Text>
              <Text className="text-xl text-gray-400">›</Text>
            </Pressable>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View className="flex-row justify-between py-2 border-b border-gray-100">
      <Text className="text-sm font-body text-gray-500">{label}</Text>
      <Text className="text-base font-body-medium text-gray-900 text-right flex-1 ml-4">{value}</Text>
    </View>
  );
}
