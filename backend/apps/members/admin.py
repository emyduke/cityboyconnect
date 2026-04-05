from django.contrib import admin
from .models import MemberProfile, Leadership


@admin.register(MemberProfile)
class MemberProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'membership_id', 'state', 'lga', 'voter_verification_status', 'is_active']
    list_filter = ['voter_verification_status', 'membership_category', 'state', 'is_active']
    search_fields = ['user__full_name', 'user__phone_number', 'membership_id']
    readonly_fields = ['referral_code', 'membership_id', 'joined_at']


@admin.register(Leadership)
class LeadershipAdmin(admin.ModelAdmin):
    list_display = ['user', 'position', 'state', 'lga', 'ward', 'is_active']
    list_filter = ['position', 'is_active', 'state']
    search_fields = ['user__full_name']
