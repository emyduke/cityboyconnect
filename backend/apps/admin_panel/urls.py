from django.urls import path
from . import views

urlpatterns = [
    # ── OVERVIEW ──────────────────────────────────────────────────
    path('overview/', views.AdminOverviewView.as_view(), name='admin-overview'),
    path('activity-feed/', views.AdminActivityFeedView.as_view(), name='admin-activity-feed'),
    path('analytics/growth/', views.AdminMembershipGrowthView.as_view(), name='admin-growth'),
    path('analytics/map/', views.AdminMapDataView.as_view(), name='admin-map'),
    path('analytics/events/', views.AdminEventAnalyticsView.as_view(), name='admin-event-analytics'),
    path('analytics/engagement/', views.AdminEngagementView.as_view(), name='admin-engagement'),

    # ── MEMBER MANAGEMENT ─────────────────────────────────────────
    path('members/', views.AdminMemberListView.as_view(), name='admin-member-list'),
    path('members/export/', views.AdminMemberExportView.as_view(), name='admin-member-export'),
    path('members/bulk-action/', views.AdminMemberBulkActionView.as_view(), name='admin-member-bulk'),
    path('members/<int:pk>/', views.AdminMemberDetailView.as_view(), name='admin-member-detail'),
    path('members/<int:pk>/verify/', views.AdminVerifyMemberView.as_view(), name='admin-member-verify'),
    path('members/<int:pk>/reject/', views.AdminRejectMemberView.as_view(), name='admin-member-reject'),
    path('members/<int:pk>/suspend/', views.AdminSuspendMemberView.as_view(), name='admin-member-suspend'),
    path('members/<int:pk>/unsuspend/', views.AdminUnsuspendMemberView.as_view(), name='admin-member-unsuspend'),
    path('members/<int:pk>/role/', views.AdminChangeMemberRoleView.as_view(), name='admin-member-role'),
    path('members/<int:pk>/reset-phone/', views.AdminResetPhoneView.as_view(), name='admin-member-reset-phone'),
    path('members/<int:pk>/delete/', views.AdminDeleteMemberView.as_view(), name='admin-member-delete'),
    path('members/<int:pk>/voter-card/', views.AdminVoterCardView.as_view(), name='admin-voter-card'),
    path('members/<int:pk>/activity/', views.AdminMemberActivityView.as_view(), name='admin-member-activity'),
    path('members/<int:pk>/network/', views.AdminMemberNetworkView.as_view(), name='admin-member-network'),

    # ── VERIFICATIONS ─────────────────────────────────────────────
    path('verifications/', views.AdminVerificationQueueView.as_view(), name='admin-verifications'),
    path('verifications/stats/', views.AdminVerificationStatsView.as_view(), name='admin-verification-stats'),

    # ── STRUCTURE & LEADERSHIP ────────────────────────────────────
    path('structure/', views.AdminStructureOverviewView.as_view(), name='admin-structure'),
    path('structure/states/', views.AdminStateListView.as_view(), name='admin-state-list'),
    path('structure/states/<int:pk>/', views.AdminStateDetailView.as_view(), name='admin-state-detail'),
    path('structure/states/<int:pk>/org-chart/', views.AdminStateOrgChartView.as_view(), name='admin-org-chart'),
    path('structure/states/<int:pk>/health/', views.AdminStateHealthView.as_view(), name='admin-state-health'),
    path('leadership/', views.AdminLeadershipListView.as_view(), name='admin-leadership-list'),
    path('leadership/appoint/', views.AdminAppointLeaderView.as_view(), name='admin-appoint-leader'),
    path('leadership/<int:pk>/', views.AdminLeadershipDetailView.as_view(), name='admin-leadership-detail'),
    path('leadership/<int:pk>/remove/', views.AdminRemoveLeaderView.as_view(), name='admin-remove-leader'),

    # ── EVENTS ────────────────────────────────────────────────────
    path('events/', views.AdminEventListView.as_view(), name='admin-event-list'),
    path('events/<int:pk>/', views.AdminEventDetailView.as_view(), name='admin-event-detail'),
    path('events/<int:pk>/cancel/', views.AdminCancelEventView.as_view(), name='admin-cancel-event'),
    path('events/<int:pk>/delete/', views.AdminDeleteEventView.as_view(), name='admin-delete-event'),
    path('events/<int:pk>/attendance/', views.AdminEventAttendanceView.as_view(), name='admin-event-attendance'),

    # ── ANNOUNCEMENTS ─────────────────────────────────────────────
    path('announcements/', views.AdminAnnouncementListView.as_view(), name='admin-announcement-list'),
    path('announcements/create/', views.AdminCreateAnnouncementView.as_view(), name='admin-announcement-create'),
    path('announcements/<int:pk>/', views.AdminAnnouncementDetailView.as_view(), name='admin-announcement-detail'),
    path('announcements/<int:pk>/publish/', views.AdminPublishAnnouncementView.as_view(), name='admin-publish-announcement'),
    path('announcements/<int:pk>/unpublish/', views.AdminUnpublishAnnouncementView.as_view(), name='admin-unpublish-announcement'),
    path('announcements/<int:pk>/delete/', views.AdminDeleteAnnouncementView.as_view(), name='admin-delete-announcement'),

    # ── REPORTS ───────────────────────────────────────────────────
    path('reports/', views.AdminReportListView.as_view(), name='admin-report-list'),
    path('reports/<int:pk>/', views.AdminReportDetailView.as_view(), name='admin-report-detail'),
    path('reports/<int:pk>/acknowledge/', views.AdminAcknowledgeReportView.as_view(), name='admin-acknowledge-report'),
    path('reports/<int:pk>/review/', views.AdminReviewReportView.as_view(), name='admin-review-report'),

    # ── AUDIT LOG ─────────────────────────────────────────────────
    path('audit-log/', views.AdminAuditLogView.as_view(), name='admin-audit-log'),

    # ── SETTINGS ──────────────────────────────────────────────────
    path('settings/', views.AdminSettingsView.as_view(), name='admin-settings'),
    path('settings/test-sms/', views.AdminTestSMSView.as_view(), name='admin-test-sms'),
    path('settings/leaderboard-weights/', views.AdminLeaderboardWeightsView.as_view(), name='admin-leaderboard-weights'),
]
