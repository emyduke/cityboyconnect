from rest_framework import serializers
from .models import MemberProfile, Leadership
from apps.accounts.serializers import UserPublicSerializer
from apps.structure.serializers import StateSerializer, LocalGovernmentSerializer, WardSerializer


class MemberProfileSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    state_name = serializers.CharField(source='state.name', read_only=True, default='')
    lga_name = serializers.CharField(source='lga.name', read_only=True, default='')
    ward_name = serializers.CharField(source='ward.name', read_only=True, default='')

    class Meta:
        model = MemberProfile
        fields = [
            'id', 'user', 'state', 'state_name', 'lga', 'lga_name',
            'ward', 'ward_name', 'polling_unit', 'date_of_birth', 'gender',
            'occupation', 'residential_address', 'profile_photo',
            'voter_verification_status', 'apc_membership_number',
            'membership_category', 'referral_code', 'membership_id',
            'is_active', 'onboarding_step', 'joined_at',
        ]
        read_only_fields = [
            'id', 'referral_code', 'membership_id', 'voter_verification_status',
            'is_active', 'joined_at',
        ]


class MemberProfileDetailSerializer(MemberProfileSerializer):
    """Full detail including voter card info (for own profile and admin)."""
    class Meta(MemberProfileSerializer.Meta):
        fields = MemberProfileSerializer.Meta.fields + [
            'voter_card_number', 'voter_card_image', 'voter_verified_at',
        ]


class OnboardingProfileSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=200)
    date_of_birth = serializers.DateField()
    gender = serializers.ChoiceField(choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')])
    occupation = serializers.CharField(max_length=200)
    profile_photo = serializers.ImageField(required=False)


class OnboardingPlacementSerializer(serializers.Serializer):
    state = serializers.IntegerField()
    lga = serializers.IntegerField()
    ward = serializers.IntegerField()
    polling_unit = serializers.IntegerField(required=False)
    residential_address = serializers.CharField()


class OnboardingVoterCardSerializer(serializers.Serializer):
    voter_card_number = serializers.CharField(max_length=50, required=False)
    voter_card_image = serializers.ImageField(required=False)
    apc_membership_number = serializers.CharField(max_length=50, required=False)


class LeadershipSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    state_name = serializers.CharField(source='state.name', read_only=True, default='')
    lga_name = serializers.CharField(source='lga.name', read_only=True, default='')
    ward_name = serializers.CharField(source='ward.name', read_only=True, default='')
    position_display = serializers.CharField(source='get_position_display', read_only=True)

    class Meta:
        model = Leadership
        fields = [
            'id', 'user', 'user_name', 'position', 'position_display',
            'state', 'state_name', 'lga', 'lga_name', 'ward', 'ward_name',
            'appointed_at', 'is_active', 'tenure_ends',
        ]
        read_only_fields = ['id', 'appointed_at']


class AppointLeadershipSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    position = serializers.ChoiceField(choices=Leadership.LEADERSHIP_POSITIONS)
    state = serializers.IntegerField(required=False)
    lga = serializers.IntegerField(required=False)
    ward = serializers.IntegerField(required=False)
    tenure_ends = serializers.DateField(required=False)
