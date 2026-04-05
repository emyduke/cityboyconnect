from django.urls import path
from . import views

urlpatterns = [
    # Onboarding
    path('onboarding/profile/', views.OnboardingProfileView.as_view(), name='onboarding-profile'),
    path('onboarding/placement/', views.OnboardingPlacementView.as_view(), name='onboarding-placement'),
    path('onboarding/voter-card/', views.OnboardingVoterCardView.as_view(), name='onboarding-voter-card'),
    path('onboarding/status/', views.OnboardingStatusView.as_view(), name='onboarding-status'),

    # Members
    path('members/', views.MemberListView.as_view(), name='member-list'),
    path('members/my-referrals/', views.MyReferralsView.as_view(), name='my-referrals'),
    path('members/directory/', views.MemberDirectoryView.as_view(), name='member-directory'),
    path('members/my-qr/', views.MyQRView.as_view(), name='my-qr'),
    path('members/my-network/', views.MyNetworkView.as_view(), name='my-network'),
    path('members/my-network/tree/', views.MyNetworkTreeView.as_view(), name='my-network-tree'),
    path('members/my-network/recent/', views.MyNetworkRecentView.as_view(), name='my-network-recent'),
    path('members/validate-ref/<str:token>/', views.ValidateRefView.as_view(), name='validate-ref'),
    path('members/<int:pk>/', views.MemberDetailView.as_view(), name='member-detail'),
    path('members/<int:pk>/update/', views.MemberUpdateView.as_view(), name='member-update'),

    # Leadership
    path('leadership/', views.LeadershipListView.as_view(), name='leadership-list'),
    path('leadership/appoint/', views.AppointLeadershipView.as_view(), name='appoint-leadership'),
    path('leadership/state/<int:state_id>/', views.StateLeadershipView.as_view(), name='state-leadership'),
]
