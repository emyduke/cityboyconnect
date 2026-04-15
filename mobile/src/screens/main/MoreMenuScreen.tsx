import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, radius, shadows } from '../../theme';
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
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        {visibleItems.map((item) => (
          <Pressable
            key={item.screen}
            style={styles.menuItem}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.navigate(item.screen);
            }}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm,
  },
  menuIcon: { fontSize: 22, marginRight: spacing.md },
  menuLabel: { ...typography.bodyMedium, color: colors.text, flex: 1 },
  chevron: { fontSize: 20, color: colors.textTertiary },
});
