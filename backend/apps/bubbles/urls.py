from django.urls import path
from . import views

urlpatterns = [
    # Member-facing
    path('', views.BubbleListView.as_view(), name='bubble-list'),
    path('create/', views.CreateBubbleView.as_view(), name='bubble-create'),
    path('my/', views.MyBubblesView.as_view(), name='bubble-my'),
    path('<int:pk>/', views.BubbleDetailView.as_view(), name='bubble-detail'),
    path('<int:pk>/images/', views.BubbleAddImageView.as_view(), name='bubble-add-image'),

    # Admin
    path('admin/', views.AdminBubbleListView.as_view(), name='admin-bubble-list'),
    path('admin/<int:pk>/', views.AdminBubbleDetailView.as_view(), name='admin-bubble-detail'),
    path('admin/<int:pk>/status/', views.AdminBubbleStatusView.as_view(), name='admin-bubble-status'),
    path('admin/<int:pk>/deliver/', views.AdminBubbleDeliveryView.as_view(), name='admin-bubble-deliver'),
]
