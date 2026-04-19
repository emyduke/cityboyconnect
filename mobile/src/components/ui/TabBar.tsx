import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const TAB_CONFIG: Record<string, { icon: string; label: string }> = {
  HomeTab: { icon: '🏠', label: 'Home' },
  MembersTab: { icon: '👥', label: 'Members' },
  EventsTab: { icon: '📅', label: 'Events' },
  RanksTab: { icon: '🏆', label: 'Ranks' },
  MoreTab: { icon: '⚙️', label: 'More' },
};

function TabItem({ routeName, isFocused, onPress }: { routeName: string; isFocused: boolean; onPress: () => void }) {
  const config = TAB_CONFIG[routeName] || { icon: '•', label: routeName };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1.1 : 1, { damping: 15 }) }],
  }));

  return (
    <Pressable className="flex-1 items-center relative" onPress={onPress}>
      {isFocused && (
        <View className="absolute -top-2 w-6 h-[3px] rounded-[1.5px] bg-gold" />
      )}
      <Animated.View className="mb-0.5" style={animStyle}>
        <Text className={`text-[22px] ${isFocused ? 'opacity-100' : 'opacity-50'}`}>{config.icon}</Text>
      </Animated.View>
      <Text className={`text-[11px] ${isFocused ? 'text-gold font-body-bold' : 'text-gray-400 font-body-medium'}`}>
        {config.label}
      </Text>
    </Pressable>
  );
}

export default function TabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-row bg-surface border-t border-gray-200 pt-2" style={{ paddingBottom: insets.bottom || 8 }}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const onPress = () => {
          Haptics.selectionAsync();
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        return <TabItem key={route.key} routeName={route.name} isFocused={isFocused} onPress={onPress} />;
      })}
    </View>
  );
}
