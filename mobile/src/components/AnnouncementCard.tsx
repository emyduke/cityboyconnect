import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Badge from './ui/Badge';

interface AnnouncementCardProps {
  announcement: {
    id: number;
    title: string;
    body?: string;
    priority?: string;
    published_at?: string;
    is_read?: boolean;
  };
  onPress?: () => void;
}

export default function AnnouncementCard({ announcement, onPress }: AnnouncementCardProps) {
  const priorityVariant = announcement.priority === 'URGENT' ? 'danger'
    : announcement.priority === 'IMPORTANT' ? 'warning' : 'default';

  return (
    <Pressable
      onPress={onPress}
      className={`bg-surface rounded-md p-4 mb-2 relative shadow-sm ${!announcement.is_read ? 'border-l-[3px] border-l-forest' : ''}`}
    >
      <View className="flex-row justify-between items-start gap-2">
        <Text className="text-[15px] font-body-medium leading-[22px] text-gray-900 flex-1" numberOfLines={2}>
          {announcement.title}
        </Text>
        {announcement.priority && announcement.priority !== 'NORMAL' && (
          <Badge label={announcement.priority} variant={priorityVariant} />
        )}
      </View>
      {announcement.body ? (
        <Text className="text-[13px] font-body leading-[18px] text-gray-500 mt-1" numberOfLines={2}>
          {announcement.body}
        </Text>
      ) : null}
      {announcement.published_at ? (
        <Text className="text-xs font-body tracking-wide text-gray-400 mt-1">
          {new Date(announcement.published_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
        </Text>
      ) : null}
      {!announcement.is_read && (
        <View className="absolute top-4 right-4 w-2 h-2 rounded-full bg-forest" />
      )}
    </Pressable>
  );
}
