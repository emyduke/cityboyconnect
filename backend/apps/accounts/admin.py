from django.contrib import admin
from .models import User, OTPVerification, AuditLog


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['phone_number', 'full_name', 'role', 'is_verified', 'date_joined']
    list_filter = ['role', 'is_verified', 'is_active']
    search_fields = ['phone_number', 'full_name', 'email']
    readonly_fields = ['date_joined']


@admin.register(OTPVerification)
class OTPAdmin(admin.ModelAdmin):
    list_display = ['phone_number', 'otp_code', 'created_at', 'is_used']
    list_filter = ['is_used']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'target_type', 'created_at']
    list_filter = ['action']
    readonly_fields = ['user', 'action', 'target_type', 'target_id', 'details', 'ip_address', 'created_at']
