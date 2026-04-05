from django.urls import path
from . import views

urlpatterns = [
    path('', views.LeaderboardView.as_view(), name='leaderboard'),
    path('my-rank/', views.MyRankView.as_view(), name='my-rank'),
]
