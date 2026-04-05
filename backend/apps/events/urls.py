from django.urls import path
from . import views

urlpatterns = [
    path('', views.EventListView.as_view(), name='event-list'),
    path('create/', views.EventCreateView.as_view(), name='event-create'),
    path('<int:pk>/', views.EventDetailView.as_view(), name='event-detail'),
    path('<int:pk>/update/', views.EventUpdateView.as_view(), name='event-update'),
    path('<int:pk>/delete/', views.EventDeleteView.as_view(), name='event-delete'),
    path('<int:pk>/attend/', views.EventAttendView.as_view(), name='event-attend'),
    path('<int:pk>/check-in/', views.EventCheckInView.as_view(), name='event-checkin'),
    path('<int:pk>/check-in-qr/', views.EventQRCheckInView.as_view(), name='event-qr-checkin'),
    path('<int:pk>/attendance/', views.EventAttendanceListView.as_view(), name='event-attendance'),
]
