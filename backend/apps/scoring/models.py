from django.db import models
from django.conf import settings


BADGES = {
    'FIRST_RECRUIT': {
        'label': 'First Recruit',
        'description': 'Onboarded your first member',
        'icon': '🌱',
    },
    'RECRUITER_10': {
        'label': 'Squad Builder',
        'description': 'Onboarded 10 verified members',
        'icon': '👥',
    },
    'RECRUITER_50': {
        'label': 'Movement Maker',
        'description': 'Onboarded 50 verified members',
        'icon': '🚀',
    },
    'NETWORK_BUILDER': {
        'label': 'Network Builder',
        'description': 'Your referral tree goes 3 levels deep',
        'icon': '🕸',
    },
    'EVENT_CHAMPION': {
        'label': 'Event Champion',
        'description': 'Attended 10+ events',
        'icon': '🏆',
    },
    'CONSISTENT_REPORTER': {
        'label': 'Consistent Reporter',
        'description': 'Submitted 3 reports on time',
        'icon': '📋',
    },
    'FULLY_ENGAGED': {
        'label': 'Fully Engaged',
        'description': 'Read 20+ announcements',
        'icon': '📢',
    },
    'TOP_10_STATE': {
        'label': 'State Top 10',
        'description': 'Ranked top 10 in your state',
        'icon': '⭐',
    },
    'TOP_100_NATIONAL': {
        'label': 'National Top 100',
        'description': 'Ranked top 100 nationally',
        'icon': '🥇',
    },
}


class MemberScore(models.Model):
    member = models.OneToOneField(
        'members.MemberProfile', on_delete=models.CASCADE, related_name='score'
    )

    # Raw metrics
    members_onboarded_direct = models.PositiveIntegerField(default=0)
    members_onboarded_network = models.PositiveIntegerField(default=0)
    referral_chain_depth = models.PositiveIntegerField(default=0)
    events_attended = models.PositiveIntegerField(default=0)
    events_organized = models.PositiveIntegerField(default=0)
    announcements_read = models.PositiveIntegerField(default=0)
    reports_submitted = models.PositiveIntegerField(default=0)
    reports_on_time = models.PositiveIntegerField(default=0)

    # Computed scores (0-100 per dimension)
    score_onboarding = models.FloatField(default=0)
    score_attendance = models.FloatField(default=0)
    score_engagement = models.FloatField(default=0)
    score_network_depth = models.FloatField(default=0)

    # Final weighted score
    total_score = models.FloatField(default=0)

    # Ranking
    national_rank = models.PositiveIntegerField(null=True, blank=True)
    state_rank = models.PositiveIntegerField(null=True, blank=True)
    lga_rank = models.PositiveIntegerField(null=True, blank=True)

    # Badges earned
    badges = models.JSONField(default=list, blank=True)

    last_calculated = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'scoring'
        indexes = [
            models.Index(fields=['-total_score']),
            models.Index(fields=['national_rank']),
        ]

    def __str__(self):
        return f'Score: {self.member} — {self.total_score:.1f}'
