from datetime import timedelta
from django.utils.timezone import now


class ScoreCalculator:
    WEIGHTS = {
        'onboarding': 0.40,
        'attendance': 0.25,
        'engagement': 0.20,
        'network_depth': 0.15,
    }

    def calculate_onboarding_score(self, profile):
        direct = profile.direct_referrals.filter(
            voter_verification_status='VERIFIED'
        ).count()
        network = self._count_network(profile)
        weighted = (direct * 2) + network
        return min(100, (weighted / 120) * 100)

    def calculate_attendance_score(self, profile):
        from apps.events.models import Event, EventAttendance
        cutoff = now() - timedelta(days=90)
        events_in_scope = Event.objects.filter(
            state=profile.state,
            start_datetime__gte=cutoff,
            status='COMPLETED',
        ).count()
        if events_in_scope == 0:
            return 50
        attended = EventAttendance.objects.filter(
            member=profile.user,
            event__start_datetime__gte=cutoff,
        ).count()
        return min(100, (attended / events_in_scope) * 100)

    def calculate_engagement_score(self, profile):
        from apps.reports.models import GrassrootsReport
        from apps.announcements.models import AnnouncementRead, Announcement
        cutoff = now() - timedelta(days=90)

        reports_submitted = GrassrootsReport.objects.filter(
            reporter=profile.user,
            status__in=['SUBMITTED', 'ACKNOWLEDGED', 'REVIEWED'],
        ).count()
        report_score = min(60, reports_submitted * 15)

        announcements_in_scope = Announcement.objects.filter(
            is_published=True,
            published_at__gte=cutoff,
        ).count()
        read_count = AnnouncementRead.objects.filter(
            user=profile.user,
            announcement__published_at__gte=cutoff,
        ).count()
        if announcements_in_scope > 0:
            announce_score = (read_count / announcements_in_scope) * 40
        else:
            announce_score = 20
        return min(100, report_score + announce_score)

    def calculate_network_depth_score(self, profile):
        depth = self._max_depth(profile)
        return min(100, depth * 20)

    def calculate_total(self, profile):
        w = self.WEIGHTS
        s_on = self.calculate_onboarding_score(profile)
        s_at = self.calculate_attendance_score(profile)
        s_en = self.calculate_engagement_score(profile)
        s_nd = self.calculate_network_depth_score(profile)
        return (
            s_on * w['onboarding']
            + s_at * w['attendance']
            + s_en * w['engagement']
            + s_nd * w['network_depth']
        )

    def get_all_scores(self, profile):
        s_on = self.calculate_onboarding_score(profile)
        s_at = self.calculate_attendance_score(profile)
        s_en = self.calculate_engagement_score(profile)
        s_nd = self.calculate_network_depth_score(profile)
        w = self.WEIGHTS
        total = s_on * w['onboarding'] + s_at * w['attendance'] + s_en * w['engagement'] + s_nd * w['network_depth']
        return {
            'score_onboarding': s_on,
            'score_attendance': s_at,
            'score_engagement': s_en,
            'score_network_depth': s_nd,
            'total_score': total,
        }

    def _count_network(self, profile, depth=0, max_depth=10):
        if depth >= max_depth:
            return 0
        direct = profile.direct_referrals.count()
        indirect = sum(
            self._count_network(r, depth + 1, max_depth)
            for r in profile.direct_referrals.all()
        )
        return direct + indirect

    def _max_depth(self, profile, current=0, max_depth=10):
        if current >= max_depth:
            return current
        children = profile.direct_referrals.all()
        if not children.exists():
            return current
        return max(
            self._max_depth(child, current + 1, max_depth)
            for child in children
        )

    def calculate_badges(self, score_obj):
        from .models import BADGES
        earned = []
        d = score_obj.members_onboarded_direct
        if d >= 1:
            earned.append('FIRST_RECRUIT')
        if d >= 10:
            earned.append('RECRUITER_10')
        if d >= 50:
            earned.append('RECRUITER_50')
        if score_obj.referral_chain_depth >= 3:
            earned.append('NETWORK_BUILDER')
        if score_obj.events_attended >= 10:
            earned.append('EVENT_CHAMPION')
        if score_obj.reports_on_time >= 3:
            earned.append('CONSISTENT_REPORTER')
        if score_obj.announcements_read >= 20:
            earned.append('FULLY_ENGAGED')
        if score_obj.state_rank and score_obj.state_rank <= 10:
            earned.append('TOP_10_STATE')
        if score_obj.national_rank and score_obj.national_rank <= 100:
            earned.append('TOP_100_NATIONAL')
        return earned
