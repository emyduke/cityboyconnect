import api from './client';

export const adminApi = {
  // Overview
  getOverview: () => api.get('/admin/overview/').then(r => r.data),
  getActivityFeed: (limit = 50) =>
    api.get('/admin/activity-feed/', { params: { limit } }).then(r => r.data),

  // Members
  getMembers: (params = {}) =>
    api.get('/admin/members/', { params }).then(r => r.data),
  getMemberDetail: (pk: number) =>
    api.get(`/admin/members/${pk}/`).then(r => r.data),
  verifyMember: (pk: number) =>
    api.post(`/admin/members/${pk}/verify/`).then(r => r.data),
  rejectMember: (pk: number, reason: string) =>
    api.post(`/admin/members/${pk}/reject/`, { reason }).then(r => r.data),
  suspendMember: (pk: number, reason: string) =>
    api.post(`/admin/members/${pk}/suspend/`, { reason }).then(r => r.data),
  unsuspendMember: (pk: number) =>
    api.post(`/admin/members/${pk}/unsuspend/`).then(r => r.data),
  changeMemberRole: (pk: number, role: string) =>
    api.patch(`/admin/members/${pk}/role/`, { role }).then(r => r.data),
  deleteMember: (pk: number) =>
    api.delete(`/admin/members/${pk}/delete/`, { data: { confirm: true } }).then(r => r.data),

  // Verifications
  getVerificationQueue: (params = {}) =>
    api.get('/admin/verifications/', { params }).then(r => r.data),
  getVerificationStats: () =>
    api.get('/admin/verifications/stats/').then(r => r.data),

  // Structure & Leadership
  getStructureOverview: () => api.get('/admin/structure/').then(r => r.data),
  getStates: () => api.get('/admin/structure/states/').then(r => r.data),
  appointLeader: (data: Record<string, any>) =>
    api.post('/admin/leadership/appoint/', data).then(r => r.data),
  removeLeader: (pk: number) =>
    api.delete(`/admin/leadership/${pk}/remove/`).then(r => r.data),

  // Events
  getEvents: (params = {}) =>
    api.get('/admin/events/', { params }).then(r => r.data),
  cancelEvent: (pk: number) =>
    api.post(`/admin/events/${pk}/cancel/`).then(r => r.data),
  deleteEvent: (pk: number) =>
    api.delete(`/admin/events/${pk}/delete/`).then(r => r.data),

  // Announcements
  getAnnouncements: (params = {}) =>
    api.get('/admin/announcements/', { params }).then(r => r.data),
  publishAnnouncement: (pk: number) =>
    api.post(`/admin/announcements/${pk}/publish/`).then(r => r.data),
  unpublishAnnouncement: (pk: number) =>
    api.post(`/admin/announcements/${pk}/unpublish/`).then(r => r.data),
  deleteAnnouncement: (pk: number) =>
    api.delete(`/admin/announcements/${pk}/delete/`).then(r => r.data),

  // Reports
  getReports: (params = {}) =>
    api.get('/admin/reports/', { params }).then(r => r.data),
  acknowledgeReport: (pk: number) =>
    api.post(`/admin/reports/${pk}/acknowledge/`).then(r => r.data),
  reviewReport: (pk: number) =>
    api.post(`/admin/reports/${pk}/review/`).then(r => r.data),

  // Audit Log
  getAuditLog: (params = {}) =>
    api.get('/admin/audit-log/', { params }).then(r => r.data),

  // Settings
  getSettings: () => api.get('/admin/settings/').then(r => r.data),
  updateSettings: (data: Record<string, any>) =>
    api.patch('/admin/settings/', data).then(r => r.data),
};
