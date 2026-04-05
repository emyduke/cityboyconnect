from celery import shared_task
from apps.members.models import MemberProfile
from apps.events.models import EventAttendance
from apps.announcements.models import AnnouncementRead
from apps.reports.models import GrassrootsReport
from apps.structure.models import State
from .models import MemberScore
from .calculator import ScoreCalculator


@shared_task
def recalculate_all_scores():
    """Run nightly — recalculates all member scores."""
    calculator = ScoreCalculator()
    for profile in MemberProfile.objects.filter(is_active=True).select_related('user', 'state'):
        _update_score(profile, calculator)
    assign_ranks.delay()


@shared_task
def recalculate_member_score(member_id):
    """Triggered on key events for a single member."""
    try:
        profile = MemberProfile.objects.select_related('user', 'state').get(user_id=member_id)
    except MemberProfile.DoesNotExist:
        return
    calculator = ScoreCalculator()
    _update_score(profile, calculator)


def _update_score(profile, calculator):
    score_obj, _ = MemberScore.objects.get_or_create(member=profile)
    scores = calculator.get_all_scores(profile)
    score_obj.score_onboarding = scores['score_onboarding']
    score_obj.score_attendance = scores['score_attendance']
    score_obj.score_engagement = scores['score_engagement']
    score_obj.score_network_depth = scores['score_network_depth']
    score_obj.total_score = scores['total_score']
    score_obj.members_onboarded_direct = profile.direct_referrals.count()
    score_obj.members_onboarded_network = calculator._count_network(profile)
    score_obj.referral_chain_depth = calculator._max_depth(profile)
    score_obj.events_attended = EventAttendance.objects.filter(member=profile.user).count()
    score_obj.reports_submitted = GrassrootsReport.objects.filter(
        reporter=profile.user, status__in=['SUBMITTED', 'ACKNOWLEDGED', 'REVIEWED']
    ).count()
    score_obj.announcements_read = AnnouncementRead.objects.filter(user=profile.user).count()
    score_obj.badges = calculator.calculate_badges(score_obj)
    score_obj.save()


@shared_task
def assign_ranks():
    """Assign national, state, LGA ranks after score recalculation."""
    for rank, score in enumerate(MemberScore.objects.order_by('-total_score'), 1):
        MemberScore.objects.filter(pk=score.pk).update(national_rank=rank)

    for state in State.objects.all():
        state_scores = MemberScore.objects.filter(
            member__state=state
        ).order_by('-total_score')
        for rank, score in enumerate(state_scores, 1):
            MemberScore.objects.filter(pk=score.pk).update(state_rank=rank)
