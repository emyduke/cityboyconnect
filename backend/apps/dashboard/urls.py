from django.urls import path
from . import views

urlpatterns = [
    path('overview/', views.DashboardOverviewView.as_view(), name='dashboard-overview'),
    path('membership-growth/', views.MembershipGrowthView.as_view(), name='membership-growth'),
    path('structure-health/', views.StructureHealthView.as_view(), name='structure-health'),
    path('leaderboard/', views.LeaderboardView.as_view(), name='leaderboard'),
    path('national/', views.NationalDashboardView.as_view(), name='national-dashboard'),
    # Admin
    path('admin/pending-verifications/', views.AdminPendingVerificationsView.as_view(),
         name='admin-pending'),
    path('admin/verify-member/<int:pk>/', views.AdminVerifyMemberView.as_view(),
         name='admin-verify-member'),
]
