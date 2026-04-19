import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Badge from './ui/Badge';

interface EventCardProps {
  event: {
    id: number;
    title: string;
    event_type?: string;
    venue_name?: string;
    start_datetime?: string;
    attendance_count?: number;
  };
  onPress?: () => void;
}

export default function EventCard({ event, onPress }: EventCardProps) {
  return (
    <Pressable onPress={onPress} className="bg-surface rounded-md p-4 flex-row mb-2 shadow-sm">
      <View className="w-[50px] h-[50px] bg-forest-light rounded-sm items-center justify-center mr-2">
        <Text className="text-xl font-display-bold text-white">
          {event.start_datetime ? new Date(event.start_datetime).getDate() : '--'}
        </Text>
        <Text className="text-xs font-body-bold tracking-wide text-gold-light">
          {event.start_datetime ? new Date(event.start_datetime).toLocaleString('en', { month: 'short' }).toUpperCase() : ''}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-body-medium leading-[22px] text-gray-900" numberOfLines={2}>
          {event.title}
        </Text>
        {event.venue_name ? (
          <Text className="text-xs font-body tracking-wide text-gray-500 mt-0.5" numberOfLines={1}>
            📍 {event.venue_name}
          </Text>
        ) : null}
        <View className="flex-row items-center gap-2 mt-1">
          {event.event_type ? <Badge label={event.event_type} /> : null}
          <Text className="text-xs font-body tracking-wide text-gray-500">
            👥 {event.attendance_count ?? 0}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
