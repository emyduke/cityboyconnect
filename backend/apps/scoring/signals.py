from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.members.models import MemberProfile
from apps.events.models import EventAttendance
from apps.reports.models import GrassrootsReport


@receiver(post_save, sender=MemberProfile)
def on_member_profile_saved(sender, instance, **kwargs):
    from .tasks import recalculate_member_score
    if instance.voter_verification_status == 'VERIFIED':
        recalculate_member_score.delay(instance.user_id)
        if instance.referred_by:
            recalculate_member_score.delay(instance.referred_by.user_id)


@receiver(post_save, sender=EventAttendance)
def on_event_attendance(sender, instance, created, **kwargs):
    if created:
        from .tasks import recalculate_member_score
        recalculate_member_score.delay(instance.member_id)


@receiver(post_save, sender=GrassrootsReport)
def on_report_submitted(sender, instance, **kwargs):
    if instance.status == 'SUBMITTED':
        from .tasks import recalculate_member_score
        recalculate_member_score.delay(instance.reporter_id)
