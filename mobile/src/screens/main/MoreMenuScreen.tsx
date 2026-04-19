import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../store/authStore';

interface MenuItem {
  label: string;
  icon: string;
  screen: string;
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  { label: 'Profile', icon: '👤', screen: 'Profile' },
  { label: 'My QR Code', icon: '📱', screen: 'MyQRCode' },
  { label: 'My Network', icon: '🌐', screen: 'MyNetwork' },
  { label: 'Opportunities', icon: '💼', screen: 'Opportunities' },
  { label: 'Jobs', icon: '📋', screen: 'Jobs' },
  { label: 'Bubbles', icon: '🫧', screen: 'Bubbles' },
  { label: 'My Bubbles', icon: '🫧', screen: 'MyBubbles' },
  { label: 'Announcements', icon: '📢', screen: 'Announcements' },
  { label: 'Reports', icon: '📊', screen: 'Reports' },
  { label: 'Admin Panel', icon: '⚙️', screen: 'AdminDashboard', adminOnly: true },
];

const ADMIN_ROLES = ['SUPER_ADMIN', 'NATIONAL_OFFICER', 'STATE_DIRECTOR'];

export default function MoreMenuScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role && ADMIN_ROLES.includes(user.role);

  const visibleItems = menuItems.filter((m) => !m.adminOnly || isAdmin);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView contentContainerClassName="p-4">
        {visibleItems.map((item) => (
          <Pressable
            key={item.screen}
            className="flex-row items-center bg-surface rounded-md p-4 mb-2 shadow-sm"
            onPress={() => {
              Haptics.selectionAsync();
              navigation.navigate(item.screen);
            }}
          >
            <Text className="text-[22px] mr-4">{item.icon}</Text>
            <Text className="text-base font-body-medium text-gray-900 flex-1">{item.label}</Text>
            <Text className="text-xl text-gray-400">›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
