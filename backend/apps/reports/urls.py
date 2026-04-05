from django.urls import path
from . import views

urlpatterns = [
    path('', views.ReportListView.as_view(), name='report-list'),
    path('create/', views.ReportCreateView.as_view(), name='report-create'),
    path('<int:pk>/', views.ReportDetailView.as_view(), name='report-detail'),
    path('<int:pk>/update/', views.ReportUpdateView.as_view(), name='report-update'),
    path('<int:pk>/submit/', views.ReportSubmitView.as_view(), name='report-submit'),
    path('<int:pk>/acknowledge/', views.ReportAcknowledgeView.as_view(), name='report-acknowledge'),
]
