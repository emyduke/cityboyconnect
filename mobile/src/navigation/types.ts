export type AuthStackParamList = {
  Login: undefined;
  Join: { ref?: string };
};

export type MainTabsParamList = {
  HomeTab: undefined;
  MembersTab: undefined;
  EventsTab: undefined;
  RanksTab: undefined;
  MoreTab: undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
};

export type MembersStackParamList = {
  Members: undefined;
  MemberDetail: { id: number };
};

export type EventsStackParamList = {
  Events: undefined;
  EventDetail: { id: number };
  CreateEvent: undefined;
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  Profile: undefined;
  Announcements: undefined;
  AnnouncementDetail: { id: number };
  Reports: undefined;
  NewReport: undefined;
  MyQRCode: undefined;
  MyNetwork: undefined;
  AdminDashboard: undefined;
  AdminMembers: undefined;
  AdminMemberDetail: { pk: number };
  AdminVerifications: undefined;
  AdminStructure: undefined;
  AdminEvents: undefined;
  AdminAnnouncements: undefined;
  AdminReports: undefined;
  AdminAuditLog: undefined;
  AdminSettings: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Suspended: undefined;
};
