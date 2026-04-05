from django.urls import path
from . import views

urlpatterns = [
    path('request-otp/', views.RequestOTPView.as_view(), name='request-otp'),
    path('verify-otp/', views.VerifyOTPView.as_view(), name='verify-otp'),
    path('refresh/', views.RefreshTokenView.as_view(), name='token-refresh'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('me/', views.MeView.as_view(), name='me'),
]
