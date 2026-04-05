from rest_framework import serializers
from .models import MemberScore, BADGES


class MemberScoreSerializer(serializers.ModelSerializer):
    member_id = serializers.IntegerField(source='member.user_id', read_only=True)
    full_name = serializers.CharField(source='member.user.full_name', read_only=True)
    profile_photo = serializers.ImageField(source='member.profile_photo', read_only=True)
    state_name = serializers.CharField(source='member.state.name', read_only=True, default='')
    lga_name = serializers.CharField(source='member.lga.name', read_only=True, default='')
    badges_detail = serializers.SerializerMethodField()

    class Meta:
        model = MemberScore
        fields = [
            'member_id', 'full_name', 'profile_photo', 'state_name', 'lga_name',
            'members_onboarded_direct', 'members_onboarded_network',
            'referral_chain_depth', 'events_attended', 'events_organized',
            'announcements_read', 'reports_submitted', 'reports_on_time',
            'score_onboarding', 'score_attendance', 'score_engagement',
            'score_network_depth', 'total_score',
            'national_rank', 'state_rank', 'lga_rank',
            'badges', 'badges_detail', 'last_calculated',
        ]

    def get_badges_detail(self, obj):
        earned = obj.badges or []
        result = []
        for key in earned:
            info = BADGES.get(key, {})
            result.append({
                'key': key,
                'label': info.get('label', key),
                'description': info.get('description', ''),
                'icon': info.get('icon', ''),
                'earned': True,
            })
        # Add next badges (not yet earned)
        for key, info in BADGES.items():
            if key not in earned:
                result.append({
                    'key': key,
                    'label': info.get('label', key),
                    'description': info.get('description', ''),
                    'icon': info.get('icon', ''),
                    'earned': False,
                })
        return result


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    member_id = serializers.IntegerField(source='member.user_id', read_only=True)
    full_name = serializers.CharField(source='member.user.full_name', read_only=True)
    profile_photo = serializers.ImageField(source='member.profile_photo', read_only=True)
    state_name = serializers.CharField(source='member.state.name', read_only=True, default='')

    class Meta:
        model = MemberScore
        fields = [
            'member_id', 'full_name', 'profile_photo', 'state_name',
            'total_score', 'national_rank', 'state_rank',
            'members_onboarded_direct', 'events_attended', 'badges',
        ]
