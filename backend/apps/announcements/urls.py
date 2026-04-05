from django.urls import path
from . import views

urlpatterns = [
    path('', views.AnnouncementListView.as_view(), name='announcement-list'),
    path('create/', views.AnnouncementCreateView.as_view(), name='announcement-create'),
    path('<int:pk>/', views.AnnouncementDetailView.as_view(), name='announcement-detail'),
    path('<int:pk>/read/', views.AnnouncementReadView.as_view(), name='announcement-read'),
]
