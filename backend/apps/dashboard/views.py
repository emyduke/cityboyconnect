from datetime import timedelta
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.accounts.utils import success_response
from apps.accounts.models import ROLE_HIERARCHY
from apps.members.models import MemberProfile
from apps.members.permissions import IsNationalOfficerOrAbove, get_scoped_queryset
from apps.events.models import Event
from apps.announcements.models import Announcement
from apps.structure.models import State, LocalGovernment


class DashboardOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profiles = MemberProfile.objects.filter(is_active=True)
        events = Event.objects.all()

        # Scope data to user's level
        try:
            profile = user.profile
        except Exception:
            profile = None

        if user.role not in ('SUPER_ADMIN', 'NATIONAL_OFFICER'):
            if profile and profile.state:
                profiles = profiles.filter(state=profile.state)
                events = events.filter(state=profile.state)

        total_members = profiles.count()
        verified_members = profiles.filter(voter_verification_status='VERIFIED').count()
        active_lgas = profiles.values('lga').distinct().count()

        now = timezone.now()
        events_this_month = events.filter(
            start_datetime__year=now.year, start_datetime__month=now.month
        ).count()

        pending_verifications = profiles.filter(
            voter_verification_status='PENDING',
            voter_card_number__gt='',
        ).count()

        return success_response({
            'total_members': total_members,
            'verified_members': verified_members,
            'active_lgas': active_lgas,
            'events_this_month': events_this_month,
            'pending_verifications': pending_verifications,
        })


class MembershipGrowthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        months = int(request.query_params.get('months', 6))
        start_date = timezone.now() - timedelta(days=months * 30)

        profiles = MemberProfile.objects.filter(joined_at__gte=start_date, is_active=True)

        try:
            profile = request.user.profile
            if request.user.role not in ('SUPER_ADMIN', 'NATIONAL_OFFICER') and profile.state:
                profiles = profiles.filter(state=profile.state)
        except Exception:
            pass

        growth = (
            profiles.annotate(month=TruncMonth('joined_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )

        return success_response({
            'growth': [
                {'month': item['month'].isoformat(), 'count': item['count']}
                for item in growth
            ]
        })


class StructureHealthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        thirty_days_ago = timezone.now() - timedelta(days=30)

        try:
            profile = request.user.profile
        except Exception:
            return success_response({'areas': []})

        if request.user.role in ('SUPER_ADMIN', 'NATIONAL_OFFICER'):
            states = State.objects.all()
            data = []
            for state in states[:20]:
                member_count = MemberProfile.objects.filter(state=state, is_active=True).count()
                recent_events = Event.objects.filter(
                    state=state, start_datetime__gte=thirty_days_ago
                ).count()
                data.append({
                    'id': state.id,
                    'name': state.name,
                    'member_count': member_count,
                    'recent_events': recent_events,
                    'status': 'active' if member_count > 0 else 'inactive',
                })
        elif profile.state:
            lgas = LocalGovernment.objects.filter(state=profile.state)
            data = []
            for lga in lgas:
                member_count = MemberProfile.objects.filter(lga=lga, is_active=True).count()
                recent_events = Event.objects.filter(
                    lga=lga, start_datetime__gte=thirty_days_ago
                ).count()
                data.append({
                    'id': lga.id,
                    'name': lga.name,
                    'member_count': member_count,
                    'recent_events': recent_events,
                    'status': 'active' if member_count > 0 else 'inactive',
                })
        else:
            data = []

        return success_response({'areas': data})


class LeaderboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Top states by member count
        top_states = (
            MemberProfile.objects.filter(is_active=True)
            .values('state__name', 'state__id')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )

        return success_response({
            'top_states': [
                {
                    'state_id': item['state__id'],
                    'state_name': item['state__name'],
                    'member_count': item['count'],
                }
                for item in top_states
            ]
        })


class NationalDashboardView(APIView):
    permission_classes = [IsNationalOfficerOrAbove]

    def get(self, request):
        total = MemberProfile.objects.filter(is_active=True).count()
        verified = MemberProfile.objects.filter(
            is_active=True, voter_verification_status='VERIFIED'
        ).count()
        states_active = (
            MemberProfile.objects.filter(is_active=True)
            .values('state').distinct().count()
        )
        total_events = Event.objects.count()

        by_zone = (
            MemberProfile.objects.filter(is_active=True)
            .values('state__zone__name')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        return success_response({
            'total_members': total,
            'verified_members': verified,
            'states_active': states_active,
            'total_events': total_events,
            'by_zone': [
                {'zone': item['state__zone__name'], 'count': item['count']}
                for item in by_zone
            ],
        })


class AdminPendingVerificationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if ROLE_HIERARCHY.get(request.user.role, 0) < ROLE_HIERARCHY['LGA_COORDINATOR']:
            return success_response({'pending': []})

        pending = MemberProfile.objects.filter(
            voter_verification_status='PENDING',
            voter_card_number__gt='',
        ).select_related('user', 'state', 'lga')

        # Scope
        try:
            profile = request.user.profile
            if request.user.role not in ('SUPER_ADMIN', 'NATIONAL_OFFICER') and profile.state:
                pending = pending.filter(state=profile.state)
        except Exception:
            pending = MemberProfile.objects.none()

        from apps.members.serializers import MemberProfileDetailSerializer
        data = MemberProfileDetailSerializer(pending[:50], many=True).data
        return success_response({'pending': data, 'total': pending.count()})


class AdminVerifyMemberView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if ROLE_HIERARCHY.get(request.user.role, 0) < ROLE_HIERARCHY['LGA_COORDINATOR']:
            return success_response({'error': 'Insufficient permissions.'})

        from apps.accounts.utils import log_audit
        action = request.data.get('action')  # 'approve' or 'reject'

        try:
            profile = MemberProfile.objects.get(pk=pk)
        except MemberProfile.DoesNotExist:
            from apps.accounts.utils import error_response
            return error_response('Member not found.', code='NOT_FOUND')

        if action == 'approve':
            profile.voter_verification_status = 'VERIFIED'
            profile.voter_verified_by = request.user
            profile.voter_verified_at = timezone.now()
            profile.save(update_fields=[
                'voter_verification_status', 'voter_verified_by', 'voter_verified_at'
            ])
        elif action == 'reject':
            profile.voter_verification_status = 'REJECTED'
            profile.save(update_fields=['voter_verification_status'])
        else:
            from apps.accounts.utils import error_response
            return error_response('Action must be "approve" or "reject".', code='INVALID_ACTION')

        log_audit(request.user, f'VERIFY_MEMBER_{action.upper()}', 'MemberProfile', pk,
                  request=request)

        from apps.members.serializers import MemberProfileSerializer
        return success_response(MemberProfileSerializer(profile).data)
