import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';
import { MainTabsParamList, HomeStackParamList, MembersStackParamList, EventsStackParamList, MoreStackParamList } from './types';

import DashboardScreen from '../screens/main/DashboardScreen';
import MembersScreen from '../screens/main/MembersScreen';
import MemberDetailScreen from '../screens/main/MemberDetailScreen';
import EventsScreen from '../screens/main/EventsScreen';
import EventDetailScreen from '../screens/main/EventDetailScreen';
import CreateEventScreen from '../screens/main/CreateEventScreen';
import LeaderboardScreen from '../screens/main/LeaderboardScreen';
import MoreMenuScreen from '../screens/main/MoreMenuScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import AnnouncementsScreen from '../screens/main/AnnouncementsScreen';
import AnnouncementDetailScreen from '../screens/main/AnnouncementDetailScreen';
import ReportsScreen from '../screens/main/ReportsScreen';
import NewReportScreen from '../screens/main/NewReportScreen';
import MyQRCodeScreen from '../screens/main/MyQRCodeScreen';
import MyNetworkScreen from '../screens/main/MyNetworkScreen';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminMembersScreen from '../screens/admin/AdminMembersScreen';
import AdminMemberDetailScreen from '../screens/admin/AdminMemberDetailScreen';
import AdminVerificationsScreen from '../screens/admin/AdminVerificationsScreen';
import AdminStructureScreen from '../screens/admin/AdminStructureScreen';
import AdminEventsScreen from '../screens/admin/AdminEventsScreen';
import AdminAnnouncementsScreen from '../screens/admin/AdminAnnouncementsScreen';
import AdminReportsScreen from '../screens/admin/AdminReportsScreen';
import AdminAuditLogScreen from '../screens/admin/AdminAuditLogScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';

const Tab = createBottomTabNavigator<MainTabsParamList>();

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const MembersStack = createNativeStackNavigator<MembersStackParamList>();
const EventsStack = createNativeStackNavigator<EventsStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
    </HomeStack.Navigator>
  );
}

function MembersStackScreen() {
  return (
    <MembersStack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}>
      <MembersStack.Screen name="Members" component={MembersScreen} options={{ title: 'Members' }} />
      <MembersStack.Screen name="MemberDetail" component={MemberDetailScreen} options={{ title: 'Member' }} />
    </MembersStack.Navigator>
  );
}

function EventsStackScreen() {
  return (
    <EventsStack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}>
      <EventsStack.Screen name="Events" component={EventsScreen} options={{ title: 'Events' }} />
      <EventsStack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event' }} />
      <EventsStack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Create Event' }} />
    </EventsStack.Navigator>
  );
}

function MoreStackScreen() {
  return (
    <MoreStack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}>
      <MoreStack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ title: 'More' }} />
      <MoreStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <MoreStack.Screen name="Announcements" component={AnnouncementsScreen} options={{ title: 'Announcements' }} />
      <MoreStack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} options={{ title: 'Announcement' }} />
      <MoreStack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
      <MoreStack.Screen name="NewReport" component={NewReportScreen} options={{ title: 'New Report' }} />
      <MoreStack.Screen name="MyQRCode" component={MyQRCodeScreen} options={{ title: 'My QR Code', headerShown: false }} />
      <MoreStack.Screen name="MyNetwork" component={MyNetworkScreen} options={{ title: 'My Network' }} />
      <MoreStack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Dashboard' }} />
      <MoreStack.Screen name="AdminMembers" component={AdminMembersScreen} options={{ title: 'Manage Members' }} />
      <MoreStack.Screen name="AdminMemberDetail" component={AdminMemberDetailScreen} options={{ title: 'Member Detail' }} />
      <MoreStack.Screen name="AdminVerifications" component={AdminVerificationsScreen} options={{ title: 'Verifications' }} />
      <MoreStack.Screen name="AdminStructure" component={AdminStructureScreen} options={{ title: 'Structure' }} />
      <MoreStack.Screen name="AdminEvents" component={AdminEventsScreen} options={{ title: 'Admin Events' }} />
      <MoreStack.Screen name="AdminAnnouncements" component={AdminAnnouncementsScreen} options={{ title: 'Admin Announcements' }} />
      <MoreStack.Screen name="AdminReports" component={AdminReportsScreen} options={{ title: 'Admin Reports' }} />
      <MoreStack.Screen name="AdminAuditLog" component={AdminAuditLogScreen} options={{ title: 'Audit Log' }} />
      <MoreStack.Screen name="AdminSettings" component={AdminSettingsScreen} options={{ title: 'Settings' }} />
    </MoreStack.Navigator>
  );
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = { Home: '🏠', Members: '👥', Events: '📅', Ranks: '🏆', More: '☰' };
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icons[label] || '•'}</Text>;
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 60, paddingBottom: 8 },
        tabBarIcon: ({ focused }) => <TabIcon label={route.name.replace('Tab', '')} focused={focused} />,
        tabBarLabel: route.name.replace('Tab', ''),
      })}
      screenListeners={{
        tabPress: () => { Haptics.selectionAsync(); },
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeStackScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="MembersTab" component={MembersStackScreen} options={{ tabBarLabel: 'Members' }} />
      <Tab.Screen name="EventsTab" component={EventsStackScreen} options={{ tabBarLabel: 'Events' }} />
      <Tab.Screen name="RanksTab" component={LeaderboardScreen} options={{ tabBarLabel: 'Ranks', headerShown: true, headerTitle: 'Leaderboard', headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }} />
      <Tab.Screen name="MoreTab" component={MoreStackScreen} options={{ tabBarLabel: 'More' }} />
    </Tab.Navigator>
  );
}
