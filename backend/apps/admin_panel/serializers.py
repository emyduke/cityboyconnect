from rest_framework import serializers
from .models import PlatformSettings
from apps.accounts.models import AuditLog


class PlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSettings
        fields = ['key', 'value', 'description', 'updated_at']
        read_only_fields = ['updated_at']


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True, default='')

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_name', 'action', 'target_type',
            'target_id', 'details', 'ip_address', 'created_at',
        ]


class ActivityFeedSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True, default='System')

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'user_name', 'action', 'target_type', 'target_id', 'created_at']


class AdminMemberListSerializer(serializers.Serializer):
    """Flat serializer for admin member table."""
    id = serializers.IntegerField(source='user.id')
    pk = serializers.IntegerField()
    full_name = serializers.CharField(source='user.full_name')
    phone = serializers.SerializerMethodField()
    membership_id = serializers.CharField()
    state_id = serializers.IntegerField(source='state.id', default=None)
    state_name = serializers.CharField(source='state.name', default='')
    lga_id = serializers.IntegerField(source='lga.id', default=None)
    lga_name = serializers.CharField(source='lga.name', default='')
    ward_name = serializers.CharField(source='ward.name', default='')
    voter_verification_status = serializers.CharField()
    role = serializers.CharField(source='user.role')
    is_active = serializers.BooleanField(source='user.is_active')
    joined_at = serializers.DateTimeField()
    profile_photo = serializers.ImageField()
    referred_by_name = serializers.SerializerMethodField()
    voter_card_number = serializers.CharField()
    score = serializers.SerializerMethodField()

    def get_phone(self, obj):
        return obj.user.mask_phone()

    def get_referred_by_name(self, obj):
        if obj.referred_by and obj.referred_by.user:
            return obj.referred_by.user.full_name
        return ''

    def get_score(self, obj):
        try:
            return obj.score.total_score
        except Exception:
            return 0


class AdminMemberDetailSerializer(serializers.Serializer):
    """Full detail serializer for admin member panel."""
    id = serializers.IntegerField(source='user.id')
    pk = serializers.IntegerField()
    full_name = serializers.CharField(source='user.full_name')
    phone = serializers.SerializerMethodField()
    email = serializers.CharField(source='user.email')
    membership_id = serializers.CharField()
    date_of_birth = serializers.DateField()
    gender = serializers.CharField()
    occupation = serializers.CharField()
    residential_address = serializers.CharField()
    profile_photo = serializers.ImageField()
    state_name = serializers.CharField(source='state.name', default='')
    lga_name = serializers.CharField(source='lga.name', default='')
    ward_name = serializers.CharField(source='ward.name', default='')
    voter_card_number = serializers.CharField()
    voter_card_image = serializers.ImageField()
    voter_verification_status = serializers.CharField()
    voter_verified_at = serializers.DateTimeField()
    voter_verified_by_name = serializers.SerializerMethodField()
    apc_membership_number = serializers.CharField()
    membership_category = serializers.CharField()
    referral_code = serializers.CharField()
    role = serializers.CharField(source='user.role')
    is_active = serializers.BooleanField(source='user.is_active')
    joined_at = serializers.DateTimeField()
    referred_by_name = serializers.SerializerMethodField()
    referred_by_id = serializers.IntegerField(source='referred_by.user_id', default=None)
    direct_referrals_count = serializers.SerializerMethodField()
    events_attended = serializers.SerializerMethodField()
    reports_submitted = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()

    def get_phone(self, obj):
        return obj.user.mask_phone()

    def get_voter_verified_by_name(self, obj):
        if obj.voter_verified_by:
            return obj.voter_verified_by.full_name
        return ''

    def get_referred_by_name(self, obj):
        if obj.referred_by and obj.referred_by.user:
            return obj.referred_by.user.full_name
        return ''

    def get_direct_referrals_count(self, obj):
        return obj.direct_referrals.count()

    def get_events_attended(self, obj):
        from apps.events.models import EventAttendance
        return EventAttendance.objects.filter(member_id=obj.user_id).count()

    def get_reports_submitted(self, obj):
        from apps.reports.models import GrassrootsReport
        return GrassrootsReport.objects.filter(reporter_id=obj.user_id).count()

    def get_score(self, obj):
        try:
            s = obj.score
            return {
                'total': s.total_score,
                'onboarding': s.score_onboarding,
                'attendance': s.score_attendance,
                'engagement': s.score_engagement,
                'network_depth': s.score_network_depth,
                'national_rank': s.national_rank,
                'state_rank': s.state_rank,
                'badges': s.badges,
            }
        except Exception:
            return None


class AdminVerificationSerializer(serializers.Serializer):
    pk = serializers.IntegerField()
    id = serializers.IntegerField(source='user.id')
    full_name = serializers.CharField(source='user.full_name')
    phone = serializers.SerializerMethodField()
    membership_id = serializers.CharField()
    state_name = serializers.CharField(source='state.name', default='')
    lga_name = serializers.CharField(source='lga.name', default='')
    ward_name = serializers.CharField(source='ward.name', default='')
    voter_card_number = serializers.CharField()
    voter_card_image = serializers.ImageField()
    voter_verification_status = serializers.CharField()
    profile_photo = serializers.ImageField()
    joined_at = serializers.DateTimeField()

    def get_phone(self, obj):
        return obj.user.mask_phone()


class AdminEventSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    event_type = serializers.CharField()
    start_datetime = serializers.DateTimeField()
    end_datetime = serializers.DateTimeField()
    status = serializers.CharField()
    venue_name = serializers.CharField()
    state_name = serializers.CharField(source='state.name', default='')
    organizer_name = serializers.CharField(source='organizer.full_name', default='')
    attendance_count = serializers.IntegerField()
    visibility = serializers.CharField()


class AdminAnnouncementSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    body = serializers.CharField()
    author_name = serializers.CharField(source='author.full_name', default='')
    target_scope = serializers.CharField()
    priority = serializers.CharField()
    is_published = serializers.BooleanField()
    published_at = serializers.DateTimeField()
    created_at = serializers.DateTimeField()


class AdminReportSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    reporter_name = serializers.CharField(source='reporter.full_name', default='')
    report_period = serializers.CharField()
    report_level = serializers.CharField()
    state_name = serializers.CharField(source='state.name', default='')
    lga_name = serializers.CharField(source='lga.name', default='')
    status = serializers.CharField()
    summary_of_activities = serializers.CharField()
    membership_new = serializers.IntegerField()
    membership_total = serializers.IntegerField()
    events_held = serializers.IntegerField()
    submitted_at = serializers.DateTimeField()
    created_at = serializers.DateTimeField()


class AdminLeadershipSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    user_id = serializers.IntegerField(source='user.id')
    user_name = serializers.CharField(source='user.full_name')
    position = serializers.CharField()
    state_name = serializers.CharField(source='state.name', default='')
    lga_name = serializers.CharField(source='lga.name', default='')
    ward_name = serializers.CharField(source='ward.name', default='')
    is_active = serializers.BooleanField()
    appointed_at = serializers.DateTimeField()
    tenure_ends = serializers.DateField()


class OrgChartSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    user_id = serializers.IntegerField(source='user.id')
    user_name = serializers.CharField(source='user.full_name')
    position = serializers.CharField()
    position_display = serializers.CharField(source='get_position_display')
    lga_name = serializers.CharField(source='lga.name', default='')
    ward_name = serializers.CharField(source='ward.name', default='')
    is_active = serializers.BooleanField()
    appointed_at = serializers.DateTimeField()
    profile_photo = serializers.SerializerMethodField()

    def get_profile_photo(self, obj):
        try:
            return obj.user.profile.profile_photo.url if obj.user.profile.profile_photo else ''
        except Exception:
            return ''
