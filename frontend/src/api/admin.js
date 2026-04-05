import api from './client';

export const adminApi = {
  // ── OVERVIEW ──────────────────────────────────────────────────────────────
  getOverview: () => api.get('/admin/overview/').then(r => r.data),

  getActivityFeed: (limit = 50) =>
    api.get('/admin/activity-feed/', { params: { limit } }).then(r => r.data),

  getMembershipGrowth: (period = '6months', stateId = null) =>
    api.get('/admin/analytics/growth/', {
      params: { period, ...(stateId && { state_id: stateId }) }
    }).then(r => r.data),

  getMapData: () => api.get('/admin/analytics/map/').then(r => r.data),

  getEventAnalytics: () => api.get('/admin/analytics/events/').then(r => r.data),

  getEngagement: () => api.get('/admin/analytics/engagement/').then(r => r.data),

  // ── MEMBERS ───────────────────────────────────────────────────────────────
  getMembers: (params = {}) =>
    api.get('/admin/members/', { params }).then(r => r.data),

  getMemberDetail: (pk) =>
    api.get(`/admin/members/${pk}/`).then(r => r.data),

  getMemberActivity: (pk) =>
    api.get(`/admin/members/${pk}/activity/`).then(r => r.data),

  getMemberNetwork: (pk) =>
    api.get(`/admin/members/${pk}/network/`).then(r => r.data),

  getVoterCardUrl: (pk) =>
    api.get(`/admin/members/${pk}/voter-card/`).then(r => r.data),

  verifyMember: (pk) =>
    api.post(`/admin/members/${pk}/verify/`).then(r => r.data),

  rejectMember: (pk, reason) =>
    api.post(`/admin/members/${pk}/reject/`, { reason }).then(r => r.data),

  suspendMember: (pk, reason) =>
    api.post(`/admin/members/${pk}/suspend/`, { reason }).then(r => r.data),

  unsuspendMember: (pk) =>
    api.post(`/admin/members/${pk}/unsuspend/`).then(r => r.data),

  changeMemberRole: (pk, role) =>
    api.patch(`/admin/members/${pk}/role/`, { role }).then(r => r.data),

  resetPhone: (pk, phone_number) =>
    api.post(`/admin/members/${pk}/reset-phone/`, { phone_number }).then(r => r.data),

  deleteMember: (pk) =>
    api.delete(`/admin/members/${pk}/delete/`, { data: { confirm: true } }).then(r => r.data),

  exportMembers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    window.open(`${base}/admin/members/export/?${query}`, '_blank');
  },

  bulkAction: (action, memberIds, extra = {}) =>
    api.post('/admin/members/bulk-action/', {
      action, member_ids: memberIds, ...extra
    }).then(r => r.data),

  // ── VERIFICATIONS ─────────────────────────────────────────────────────────
  getVerificationQueue: (params = {}) =>
    api.get('/admin/verifications/', { params }).then(r => r.data),

  getVerificationStats: () =>
    api.get('/admin/verifications/stats/').then(r => r.data),

  // ── STRUCTURE & LEADERSHIP ────────────────────────────────────────────────
  getStructureOverview: () =>
    api.get('/admin/structure/').then(r => r.data),

  getStates: () =>
    api.get('/admin/structure/states/').then(r => r.data),

  getStateDetail: (stateId) =>
    api.get(`/admin/structure/states/${stateId}/`).then(r => r.data),

  getStateOrgChart: (stateId) =>
    api.get(`/admin/structure/states/${stateId}/org-chart/`).then(r => r.data),

  getStateHealth: (stateId) =>
    api.get(`/admin/structure/states/${stateId}/health/`).then(r => r.data),

  getLeadership: (params = {}) =>
    api.get('/admin/leadership/', { params }).then(r => r.data),

  getLeadershipDetail: (pk) =>
    api.get(`/admin/leadership/${pk}/`).then(r => r.data),

  appointLeader: (data) =>
    api.post('/admin/leadership/appoint/', data).then(r => r.data),

  removeLeader: (pk) =>
    api.delete(`/admin/leadership/${pk}/remove/`).then(r => r.data),

  // ── EVENTS ────────────────────────────────────────────────────────────────
  getEvents: (params = {}) =>
    api.get('/admin/events/', { params }).then(r => r.data),

  getEventDetail: (pk) =>
    api.get(`/admin/events/${pk}/`).then(r => r.data),

  cancelEvent: (pk) =>
    api.post(`/admin/events/${pk}/cancel/`).then(r => r.data),

  deleteEvent: (pk) =>
    api.delete(`/admin/events/${pk}/delete/`).then(r => r.data),

  getEventAttendance: (pk) =>
    api.get(`/admin/events/${pk}/attendance/`).then(r => r.data),

  // ── ANNOUNCEMENTS ─────────────────────────────────────────────────────────
  getAnnouncements: (params = {}) =>
    api.get('/admin/announcements/', { params }).then(r => r.data),

  getAnnouncementDetail: (pk) =>
    api.get(`/admin/announcements/${pk}/`).then(r => r.data),

  publishAnnouncement: (pk) =>
    api.post(`/admin/announcements/${pk}/publish/`).then(r => r.data),

  unpublishAnnouncement: (pk) =>
    api.post(`/admin/announcements/${pk}/unpublish/`).then(r => r.data),

  deleteAnnouncement: (pk) =>
    api.delete(`/admin/announcements/${pk}/delete/`).then(r => r.data),

  // ── REPORTS ───────────────────────────────────────────────────────────────
  getReports: (params = {}) =>
    api.get('/admin/reports/', { params }).then(r => r.data),

  getReportDetail: (pk) =>
    api.get(`/admin/reports/${pk}/`).then(r => r.data),

  acknowledgeReport: (pk) =>
    api.post(`/admin/reports/${pk}/acknowledge/`).then(r => r.data),

  reviewReport: (pk) =>
    api.post(`/admin/reports/${pk}/review/`).then(r => r.data),

  // ── AUDIT LOG ─────────────────────────────────────────────────────────────
  getAuditLog: (params = {}) =>
    api.get('/admin/audit-log/', { params }).then(r => r.data),

  // ── SETTINGS ──────────────────────────────────────────────────────────────
  getSettings: () =>
    api.get('/admin/settings/').then(r => r.data),

  updateSettings: (data) =>
    api.patch('/admin/settings/', data).then(r => r.data),

  testSMS: (phoneNumber) =>
    api.post('/admin/settings/test-sms/', { phone_number: phoneNumber }).then(r => r.data),

  getLeaderboardWeights: () =>
    api.get('/admin/settings/leaderboard-weights/').then(r => r.data),

  updateLeaderboardWeights: (weights) =>
    api.patch('/admin/settings/leaderboard-weights/', weights).then(r => r.data),
};
