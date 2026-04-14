from django.urls import path
from . import views

urlpatterns = [
    # Discovery — frontend calls this first
    path('methods/',        views.AuthMethodsView.as_view(),    name='auth-methods'),

    # OTP flow (SMS or email)
    path('request-otp/',    views.RequestOTPView.as_view(),     name='request-otp'),
    path('verify-otp/',     views.VerifyOTPView.as_view(),      name='verify-otp'),

    # Password flow
    path('login/',          views.PasswordLoginView.as_view(),  name='password-login'),
    path('set-password/',   views.SetPasswordView.as_view(),    name='set-password'),

    # Session management
    path('refresh/',        views.RefreshTokenView.as_view(),   name='token-refresh'),
    path('logout/',         views.LogoutView.as_view(),         name='logout'),
    path('me/',             views.MeView.as_view(),             name='me'),
]
