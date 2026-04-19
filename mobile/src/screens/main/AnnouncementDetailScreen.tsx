import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { getAnnouncement, markAnnouncementRead } from '../../api/announcements';
import { unwrap } from '../../api/client';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import { MoreStackParamList } from '../../navigation/types';

type Route = RouteProp<MoreStackParamList, 'AnnouncementDetail'>;

export default function AnnouncementDetailScreen() {
  const { params } = useRoute<Route>();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setItem(unwrap(await getAnnouncement(params.id)));
        markAnnouncementRead(params.id).catch(() => {});
      } catch { /* handled */ }
      setLoading(false);
    })();
  }, [params.id]);

  if (loading) return <View className="flex-1 bg-background p-4"><Skeleton variant="text" /><Skeleton variant="card" className="mt-4" /></View>;
  if (!item) return <View className="flex-1 bg-background p-4"><Text className="text-base font-body text-danger text-center mt-12">Not found</Text></View>;

  const priorityVariant = item.priority === 'URGENT' ? 'danger' : item.priority === 'IMPORTANT' ? 'warning' : 'default';

  return (
    <ScrollView className="flex-1 bg-background p-4" contentContainerStyle={{ paddingBottom: 48 }}>
      <Text className="text-2xl font-display-bold text-gray-900">{item.title}</Text>
      <View className="flex-row items-center gap-2 mt-1 mb-6">
        {item.priority && item.priority !== 'NORMAL' && <Badge label={item.priority} variant={priorityVariant} />}
        <Text className="text-xs font-body text-gray-500">{item.published_at ? new Date(item.published_at).toLocaleDateString() : ''}</Text>
      </View>
      <Text className="text-base font-body text-gray-900 leading-6">{item.body}</Text>
    </ScrollView>
  );
}
