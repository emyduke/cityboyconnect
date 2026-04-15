import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';
import { MainTabsParamList, HomeStackParamList, MembersStackParamList, EventsStackParamList, MoreStackParamList } from './types';
import TabBar from '../components/ui/TabBar';

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
import BubblesScreen from '../screens/main/BubblesScreen';
import BubbleDetailScreen from '../screens/main/BubbleDetailScreen';
import CreateBubbleScreen from '../screens/main/CreateBubbleScreen';
import MyBubblesScreen from '../screens/main/MyBubblesScreen';

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
import AdminBubblesScreen from '../screens/admin/AdminBubblesScreen';

import OpportunitiesScreen from '../screens/main/OpportunitiesScreen';
import TalentDetailScreen from '../screens/main/TalentDetailScreen';
import ProfessionalDetailScreen from '../screens/main/ProfessionalDetailScreen';
import BusinessDetailScreen from '../screens/main/BusinessDetailScreen';
import MyOpportunitiesScreen from '../screens/main/MyOpportunitiesScreen';
import JobsScreen from '../screens/main/JobsScreen';
import JobDetailScreen from '../screens/main/JobDetailScreen';
import CreateJobScreen from '../screens/main/CreateJobScreen';
import MyJobListingsScreen from '../screens/main/MyJobListingsScreen';
import JobApplicationsScreen from '../screens/main/JobApplicationsScreen';
import MyApplicationsScreen from '../screens/main/MyApplicationsScreen';
import SavedJobsScreen from '../screens/main/SavedJobsScreen';
import AddMemberScreen from '../screens/main/AddMemberScreen';
import CreateAnnouncementScreen from '../screens/main/CreateAnnouncementScreen';
import EditEventScreen from '../screens/main/EditEventScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';

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
      <MoreStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <MoreStack.Screen name="Announcements" component={AnnouncementsScreen} options={{ title: 'Announcements' }} />
      <MoreStack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} options={{ title: 'Announcement' }} />
      <MoreStack.Screen name="CreateAnnouncement" component={CreateAnnouncementScreen} options={{ title: 'Create Announcement' }} />
      <MoreStack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
      <MoreStack.Screen name="NewReport" component={NewReportScreen} options={{ title: 'New Report' }} />
      <MoreStack.Screen name="MyQRCode" component={MyQRCodeScreen} options={{ title: 'My QR Code', headerShown: false }} />
      <MoreStack.Screen name="MyNetwork" component={MyNetworkScreen} options={{ title: 'My Network' }} />
      <MoreStack.Screen name="Bubbles" component={BubblesScreen} options={{ title: 'Bubbles' }} />
      <MoreStack.Screen name="BubbleDetail" component={BubbleDetailScreen} options={{ title: 'Bubble' }} />
      <MoreStack.Screen name="CreateBubble" component={CreateBubbleScreen} options={{ title: 'Create Bubble' }} />
      <MoreStack.Screen name="MyBubbles" component={MyBubblesScreen} options={{ title: 'My Bubbles' }} />
      <MoreStack.Screen name="Opportunities" component={OpportunitiesScreen} options={{ title: 'Opportunities' }} />
      <MoreStack.Screen name="TalentDetail" component={TalentDetailScreen} options={{ title: 'Talent' }} />
      <MoreStack.Screen name="ProfessionalDetail" component={ProfessionalDetailScreen} options={{ title: 'Professional' }} />
      <MoreStack.Screen name="BusinessDetail" component={BusinessDetailScreen} options={{ title: 'Business' }} />
      <MoreStack.Screen name="MyOpportunities" component={MyOpportunitiesScreen} options={{ title: 'My Profiles' }} />
      <MoreStack.Screen name="Jobs" component={JobsScreen} options={{ title: 'Jobs' }} />
      <MoreStack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job Detail' }} />
      <MoreStack.Screen name="CreateJob" component={CreateJobScreen} options={{ title: 'Post Job' }} />
      <MoreStack.Screen name="MyJobListings" component={MyJobListingsScreen} options={{ title: 'My Job Listings' }} />
      <MoreStack.Screen name="JobApplications" component={JobApplicationsScreen} options={{ title: 'Applications' }} />
      <MoreStack.Screen name="MyApplications" component={MyApplicationsScreen} options={{ title: 'My Applications' }} />
      <MoreStack.Screen name="SavedJobs" component={SavedJobsScreen} options={{ title: 'Saved Jobs' }} />
      <MoreStack.Screen name="AddMember" component={AddMemberScreen} options={{ title: 'Add Member' }} />
      <MoreStack.Screen name="EditEvent" component={EditEventScreen} options={{ title: 'Edit Event' }} />
      <MoreStack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Dashboard' }} />
      <MoreStack.Screen name="AdminMembers" component={AdminMembersScreen} options={{ title: 'Manage Members' }} />
      <MoreStack.Screen name="AdminMemberDetail" component={AdminMemberDetailScreen} options={{ title: 'Member Detail' }} />
      <MoreStack.Screen name="AdminVerifications" component={AdminVerificationsScreen} options={{ title: 'Verifications' }} />
      <MoreStack.Screen name="AdminStructure" component={AdminStructureScreen} options={{ title: 'Structure' }} />
      <MoreStack.Screen name="AdminEvents" component={AdminEventsScreen} options={{ title: 'Admin Events' }} />
      <MoreStack.Screen name="AdminAnnouncements" component={AdminAnnouncementsScreen} options={{ title: 'Admin Announcements' }} />
      <MoreStack.Screen name="AdminReports" component={AdminReportsScreen} options={{ title: 'Admin Reports' }} />
      <MoreStack.Screen name="AdminBubbles" component={AdminBubblesScreen} options={{ title: 'Admin Bubbles' }} />
      <MoreStack.Screen name="AdminAuditLog" component={AdminAuditLogScreen} options={{ title: 'Audit Log' }} />
      <MoreStack.Screen name="AdminSettings" component={AdminSettingsScreen} options={{ title: 'Settings' }} />
    </MoreStack.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      screenListeners={{
        tabPress: () => { Haptics.selectionAsync(); },
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeStackScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="MembersTab" component={MembersStackScreen} options={{ tabBarLabel: 'Members' }} />
      <Tab.Screen name="EventsTab" component={EventsStackScreen} options={{ tabBarLabel: 'Events' }} />
      <Tab.Screen name="RanksTab" component={LeaderboardScreen} options={{ tabBarLabel: 'Ranks' }} />
      <Tab.Screen name="MoreTab" component={MoreStackScreen} options={{ tabBarLabel: 'More' }} />
    </Tab.Navigator>
  );
}
