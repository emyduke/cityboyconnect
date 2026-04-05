import csv
from datetime import timedelta

from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework import status as drf_status
from rest_framework.pagination import PageNumberPagination

from apps.accounts.models import User, AuditLog, ROLE_HIERARCHY
from apps.members.models import MemberProfile, Leadership
from apps.events.models import Event, EventAttendance
from apps.announcements.models import Announcement
from apps.reports.models import GrassrootsReport
from apps.structure.models import State, LocalGovernment, Ward
from .models import PlatformSettings
from .permissions import IsSuperAdmin, IsNationalOfficerOrAbove, IsAdminUser, CanManageScope
from .audit import log_action
from .serializers import (
    PlatformSettingsSerializer, AuditLogSerializer, ActivityFeedSerializer,
    AdminMemberListSerializer, AdminMemberDetailSerializer,
    AdminVerificationSerializer, AdminEventSerializer,
    AdminAnnouncementSerializer, AdminReportSerializer,
    AdminLeadershipSerializer, OrgChartSerializer,
)


def _success(data, status_code=200):
    return Response({'success': True, 'data': data}, status=status_code)


def _error(code, message, status_code=400):
    return Response({'success': False, 'error': {'code': code, 'message': message}}, status=status_code)


class AdminStandardPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 200


# ── OVERVIEW ────────────────────────────────────────────────────────────────

class AdminOverviewView(APIView):
    permission_classes = [IsNationalOfficerOrAbove]

    def get(self, request):
        try:
            now = timezone.now()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

            total_members = MemberProfile.objects.count()
            verified = MemberProfile.objects.filter(voter_verification_status='VERIFIED').count()
            pending = MemberProfile.objects.filter(voter_verification_status='PENDING').count()
            suspended = User.objects.filter(is_active=False).count()

            active_states = MemberProfile.objects.filter(
                voter_verification_status='VERIFIED'
            ).values('state').distinct().count()
            total_states = State.objects.count()

            events_this_month = Event.objects.filter(
                start_datetime__year=now.year, start_datetime__month=now.month
            ).count()
            events_today = Event.objects.filter(start_datetime__date=now.date()).count()

            reports_total = GrassrootsReport.objects.filter(status='SUBMITTED').count()
            reports_unread = GrassrootsReport.objects.filter(
                status='SUBMITTED'
            ).count()

            new_today = MemberProfile.objects.filter(joined_at__gte=today_start).count()
            new_this_week = MemberProfile.objects.filter(
                joined_at__gte=now - timedelta(days=7)
            ).count()

            verification_rate = round((verified / total_members * 100), 1) if total_members > 0 else 0

            return _success({
                'members': {
                    'total': total_members,
                    'verified': verified,
                    'pending_verification': pending,
                    'suspended': suspended,
                    'new_today': new_today,
                    'new_this_week': new_this_week,
                    'verification_rate': verification_rate,
                },
                'structure': {
                    'active_states': active_states,
                    'total_states': total_states,
                    'inactive_states': total_states - active_states,
                },
                'events': {
                    'this_month': events_this_month,
                    'today': events_today,
                },
                'reports': {
                    'total_submitted': reports_total,
                    'awaiting_acknowledgement': reports_unread,
                },
            })
        except Exception as e:
            return _error('OVERVIEW_FAILED', str(e), 500)


class AdminActivityFeedView(APIView):
    permission_classes = [IsNationalOfficerOrAbove]

    def get(self, request):
        try:
            limit = min(int(request.query_params.get('limit', 50)), 200)
            logs = AuditLog.objects.select_related('user').order_by('-created_at')[:limit]
            return _success(ActivityFeedSerializer(logs, many=True).data)
        except Exception as e:
            return _error('FEED_FAILED', str(e), 500)


class AdminMembershipGrowthView(APIView):
    permission_classes = [IsNationalOfficerOrAbove]

    def get(self, request):
        try:
            period = request.query_params.get('period', '6months')
            state_id = request.query_params.get('state_id')

            period_map = {'7days': 7, '30days': 30, '6months': 180, '1year': 365}
            days = period_map.get(period)
            if days is None:
                return _error('INVALID_PERIOD', 'period must be 7days, 30days, 6months, or 1year')

            if period in ('7days', '30days'):
                group_by = 'day'
            elif period == '6months':
                group_by = 'week'
            else:
                group_by = 'month'

            start_date = timezone.now() - timedelta(days=days)
            qs = MemberProfile.objects.filter(joined_at__gte=start_date)
            if state_id:
                qs = qs.filter(state_id=state_id)

            data_points = []
            current = start_date.date()
            end = timezone.now().date()

            while current <= end:
                if group_by == 'day':
                    count = qs.filter(joined_at__date=current).count()
                    verified = qs.filter(joined_at__date=current, voter_verification_status='VERIFIED').count()
                    data_points.append({'date': current.isoformat(), 'registered': count, 'verified': verified})
                    current += timedelta(days=1)
                elif group_by == 'week':
                    week_end = current + timedelta(days=6)
                    count = qs.filter(joined_at__date__gte=current, joined_at__date__lte=week_end).count()
                    verified = qs.filter(joined_at__date__gte=current, joined_at__date__lte=week_end, voter_verification_status='VERIFIED').count()
                    data_points.append({'date': current.isoformat(), 'registered': count, 'verified': verified})
                    current += timedelta(days=7)
                else:
                    import calendar
                    month_end = current.replace(day=calendar.monthrange(current.year, current.month)[1])
                    count = qs.filter(joined_at__date__gte=current, joined_at__date__lte=month_end).count()
                    verified = qs.filter(joined_at__date__gte=current, joined_at__date__lte=month_end, voter_verification_status='VERIFIED').count()
                    data_points.append({'date': current.isoformat(), 'registered': count, 'verified': verified})
                    if current.month == 12:
                        current = current.replace(year=current.year + 1, month=1, day=1)
                    else:
                        current = current.replace(month=current.month + 1, day=1)

            return _success(data_points)
        except Exception as e:
            return _error('GROWTH_DATA_FAILED', str(e), 500)


class AdminMapDataView(APIView):
    permission_classes = [IsNationalOfficerOrAbove]

    def get(self, request):
        try:
            states = State.objects.annotate(
                total_members=Count('members'),
                verified_members=Count('members', filter=Q(members__voter_verification_status='VERIFIED')),
                active_lgas=Count('localgovernment', filter=Q(localgovernment__members__voter_verification_status='VERIFIED'), distinct=True),
            ).values('id', 'name', 'code', 'zone__name', 'total_members', 'verified_members', 'active_lgas')
            return _success(list(states))
        except Exception as e:
            return _error('MAP_DATA_FAILED', str(e), 500)


class AdminEventAnalyticsView(APIView):
    permission_classes = [IsNationalOfficerOrAbove]

    def get(self, request):
        try:
            now = timezone.now()
            total = Event.objects.count()
            upcoming = Event.objects.filter(status='UPCOMING').count()
            completed = Event.objects.filter(status='COMPLETED').count()
            cancelled = Event.objects.filter(status='CANCELLED').count()
            this_month = Event.objects.filter(start_datetime__year=now.year, start_datetime__month=now.month).count()
            total_attendance = EventAttendance.objects.count()
            avg_attendance = 0
            if completed > 0:
                avg_attendance = round(total_attendance / completed, 1)

            by_type = list(Event.objects.values('event_type').annotate(count=Count('id')).order_by('-count'))

            return _success({
                'total': total, 'upcoming': upcoming, 'completed': completed,
                'cancelled': cancelled, 'this_month': this_month,
                'total_attendance': total_attendance, 'avg_attendance': avg_attendance,
                'by_type': by_type,
            })
        except Exception as e:
            return _error('EVENT_ANALYTICS_FAILED', str(e), 500)


class AdminEngagementView(APIView):
    permission_classes = [IsNationalOfficerOrAbove]

    def get(self, request):
        try:
            total_members = MemberProfile.objects.count()
            attended_event = EventAttendance.objects.values('member').distinct().count()
            submitted_report = GrassrootsReport.objects.values('reporter').distinct().count()
            total_announcements = Announcement.objects.filter(is_published=True).count()

            return _success({
                'total_members': total_members,
                'members_attended_event': attended_event,
                'members_submitted_report': submitted_report,
                'published_announcements': total_announcements,
                'event_participation_rate': round(attended_event / total_members * 100, 1) if total_members else 0,
                'report_participation_rate': round(submitted_report / total_members * 100, 1) if total_members else 0,
            })
        except Exception as e:
            return _error('ENGAGEMENT_FAILED', str(e), 500)


# ── MEMBER MANAGEMENT ───────────────────────────────────────────────────────

class AdminMemberListView(ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminMemberListSerializer
    pagination_class = AdminStandardPagination

    def get_queryset(self):
        user = self.request.user
        qs = MemberProfile.objects.select_related(
            'user', 'state', 'lga', 'ward', 'referred_by__user'
        ).order_by('-joined_at')

        # Scope restriction
        level = ROLE_HIERARCHY.get(user.role, 0)
        if level < ROLE_HIERARCHY.get('NATIONAL_OFFICER', 8):
            try:
                profile = user.profile
                if user.role == 'STATE_DIRECTOR':
                    qs = qs.filter(state=profile.state)
                elif user.role == 'LGA_COORDINATOR':
                    qs = qs.filter(lga=profile.lga)
                elif user.role == 'WARD_COORDINATOR':
                    qs = qs.filter(ward=profile.ward)
            except MemberProfile.DoesNotExist:
                qs = qs.none()

        params = self.request.query_params
        search = params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(user__full_name__icontains=search) |
                Q(user__phone_number__icontains=search) |
                Q(membership_id__icontains=search)
            )
        state_id = params.get('state_id')
        if state_id:
            qs = qs.filter(state_id=state_id)
        lga_id = params.get('lga_id')
        if lga_id:
            qs = qs.filter(lga_id=lga_id)
        ward_id = params.get('ward_id')
        if ward_id:
            qs = qs.filter(ward_id=ward_id)
        v_status = params.get('verification_status')
        if v_status:
            qs = qs.filter(voter_verification_status=v_status)
        role = params.get('role')
        if role:
            qs = qs.filter(user__role=role)
        is_suspended = params.get('is_suspended')
        if is_suspended is not None:
            qs = qs.filter(user__is_active=(is_suspended.lower() != 'true'))
        date_from = params.get('date_from')
        if date_from:
            qs = qs.filter(joined_at__date__gte=date_from)
        date_to = params.get('date_to')
        if date_to:
            qs = qs.filter(joined_at__date__lte=date_to)

        ordering = params.get('ordering', '-joined_at')
        allowed = ['joined_at', '-joined_at', 'user__full_name', '-user__full_name']
        if ordering in allowed:
            qs = qs.order_by(ordering)

        return qs


class AdminMemberDetailView(RetrieveAPIView):
    permission_classes = [IsAdminUser, CanManageScope]
    serializer_class = AdminMemberDetailSerializer
    queryset = MemberProfile.objects.select_related(
        'user', 'state', 'lga', 'ward',
        'referred_by__user', 'voter_verified_by'
    ).prefetch_related('direct_referrals__user')

    def retrieve(self, request, *args, **kwargs):
        try:
            return super().retrieve(request, *args, **kwargs)
        except MemberProfile.DoesNotExist:
            return _error('MEMBER_NOT_FOUND', 'Member not found.', 404)
        except Exception as e:
            return _error('MEMBER_DETAIL_FAILED', str(e), 500)


class AdminVerifyMemberView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            profile = MemberProfile.objects.select_related('user').get(pk=pk)
        except MemberProfile.DoesNotExist:
            return _error('MEMBER_NOT_FOUND', 'Member not found.', 404)

        # Check scope permission
        perm = CanManageScope()
        if not perm.has_object_permission(request, self, profile):
            return _error('SCOPE_DENIED', perm.message, 403)

        if profile.voter_verification_status == 'VERIFIED':
            return _error('ALREADY_VERIFIED', 'This member is already verified.')

        before = {'voter_verification_status': profile.voter_verification_status}
        profile.voter_verification_status = 'VERIFIED'
        profile.voter_verified_by = request.user
        profile.voter_verified_at = timezone.now()
        profile.save(update_fields=['voter_verification_status', 'voter_verified_by', 'voter_verified_at'])

        log_action(performed_by=request.user, action='MEMBER_VERIFIED', target=profile,
                   before_state=before, after_state={'voter_verification_status': 'VERIFIED'}, request=request)

        return _success({'message': f'{profile.user.full_name} has been verified successfully.'})


class AdminRejectMemberView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            profile = MemberProfile.objects.select_related('user').get(pk=pk)
        except MemberProfile.DoesNotExist:
            return _error('MEMBER_NOT_FOUND', 'Member not found.', 404)

        perm = CanManageScope()
        if not perm.has_object_permission(request, self, profile):
            return _error('SCOPE_DENIED', perm.message, 403)

        reason = request.data.get('reason', '').strip()
        if not reason:
            return _error('REASON_REQUIRED', 'A rejection reason is required.')

        VALID_REASONS = ['CARD_UNREADABLE', 'CARD_DOES_NOT_MATCH', 'DUPLICATE_SUBMISSION', 'SUSPECTED_FRAUD', 'INVALID_VIN', 'OTHER']
        if reason not in VALID_REASONS:
            return _error('INVALID_REASON', f'Reason must be one of: {", ".join(VALID_REASONS)}')

        before = {'voter_verification_status': profile.voter_verification_status}
        profile.voter_verification_status = 'REJECTED'
        profile.voter_verified_by = request.user
        profile.voter_verified_at = timezone.now()
        profile.save(update_fields=['voter_verification_status', 'voter_verified_by', 'voter_verified_at'])

        log_action(performed_by=request.user, action='MEMBER_REJECTED', target=profile,
                   before_state=before, after_state={'voter_verification_status': 'REJECTED', 'reason': reason}, request=request)

        return _success({'message': f'Voter card for {profile.user.full_name} has been rejected.'})


class AdminSuspendMemberView(APIView):
    permission_classes = [IsNationalOfficerOrAbove]

    def post(self, request, pk):
        try:
            profile = MemberProfile.objects.select_related('user').get(pk=pk)
        except MemberProfile.DoesNotExist:
            return _error('MEMBER_NOT_FOUND', 'Member not found.', 404)

        if profile.user == request.user:
            return _error('CANNOT_SUSPEND_SELF', 'You cannot suspend your own account.')

        if not profile.user.is_active:
            return _error('ALREADY_SUSPENDED', 'This member is already suspended.')

        reason = request.data.get('reason', '').strip()
        if not reason:
            return _error('REASON_REQUIRED', 'A suspension reason is required.')

        profile.user.is_active = False
        profile.user.save(update_fields=['is_active'])
        profile.is_active = False
        profile.save(update_fields=['is_active'])

        log_action(performed_by=request.user, action='MEMBER_SUSPENDED', target=profile,
                   before_state={'is_active': True}, after_state={'is_active': False, 'reason': reason}, request=request)

        return _success({'message': f'{profile.user.full_name} has been suspended.'})


class AdminUnsuspendMemberView(APIView):
    permission_classes = [IsNationalOfficerOrAbove]

    def post(self, request, pk):
        try:
            profile = MemberProfile.objects.select_related('user').get(pk=pk)
        except MemberProfile.DoesNotExist:
            return _error('MEMBER_NOT_FOUND', 'Member not found.', 404)

        if profile.user.is_active:
            return _error('NOT_SUSPENDED', 'This member is not currently suspended.')

        profile.user.is_active = True
        profile.user.save(update_fields=['is_active'])
        profile.is_active = True
        profile.save(update_fields=['is_active'])

        log_action(performed_by=request.user, action='MEMBER_UNSUSPENDED', target=profile,
                   before_state={'is_active': False}, after_state={'is_active': True}, request=request)

        return _success({'message': f'{profile.user.full_name} has been unsuspended.'})


class AdminChangeMemberRoleView(APIView):
    permission_classes = [IsSuperAdmin]

    VALID_ROLES = ['MEMBER', 'WARD_COORDINATOR', 'LGA_COORDINATOR', 'STATE_DIRECTOR', 'NATIONAL_OFFICER', 'SUPER_ADMIN']

    def patch(self, request, pk):
        try:
            profile = MemberProfile.objects.select_related('user').get(pk=pk)
        except MemberProfile.DoesNotExist:
            return _error('MEMBER_NOT_FOUND', 'Member not found.', 404)

        new_role = request.data.get('role', '').strip()
        if not new_role:
            return _error('ROLE_REQUIRED', 'A role is required.')
        if new_role not in self.VALID_ROLES:
            return _error('INVALID_ROLE', f'Role must be one of: {", ".join(self.VALID_ROLES)}')

        if profile.voter_verification_status != 'VERIFIED' and new_role != 'MEMBER':
            return _error('NOT_VERIFIED', 'Only verified members can be assigned leadership roles.')

        old_role = profile.user.role
        profile.user.role = new_role
        profile.user.save(update_fields=['role'])

        log_action(performed_by=request.user, action='ROLE_CHANGED', target=profile,
                   before_state={'role': old_role}, after_state={'role': new_role}, request=request)

        return _success({'message': f'{profile.user.full_name} role changed to {new_role}.'})


class AdminResetPhoneView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        try:
            profile = MemberProfile.objects.select_related('user').get(pk=pk)
        except MemberProfile.DoesNotExist:
            return _error('MEMBER_NOT_FOUND', 'Member not found.', 404)

        new_phone = request.data.get('phone_number', '').strip()
        if not new_phone:
            return _error('PHONE_REQUIRED', 'New phone number is required.')

        from apps.accounts.models import normalize_phone
        new_phone = normalize_phone(new_phone)
        if User.objects.filter(phone_number=new_phone).exclude(pk=profile.user_id).exists():
            return _error('PHONE_EXISTS', 'This phone number is already in use.')

        old_phone = profile.user.phone_number
        profile.user.phone_number = new_phone
        profile.user.save(update_fields=['phone_number'])

        log_action(performed_by=request.user, action='PHONE_RESET', target=profile,
                   before_state={'phone': old_phone}, after_state={'phone': new_phone}, request=request)

        return _success({'message': f'Phone number updated for {profile.user.full_name}.'})


class AdminDeleteMemberView(APIView):
    permission_classes = [IsSuperAdmin]

    def delete(self, request, pk):
        try:
            profile = MemberProfile.objects.select_related('user').get(pk=pk)
        except MemberProfile.DoesNotExist:
            return _error('MEMBER_NOT_FOUND', 'Member not found.', 404)

        if profile.user == request.user:
            return _error('CANNOT_DELETE_SELF', 'You cannot delete your own account.')

        confirm = request.data.get('confirm', False)
        if not confirm:
            return _error('CONFIRMATION_REQUIRED', 'Send {"confirm": true} to confirm permanent deletion.')

        member_name = profile.user.full_name
        member_id = profile.membership_id

        log_action(performed_by=request.user, action='MEMBER_DELETED', target=profile,
                   before_state={'membership_id': member_id, 'full_name': member_name, 'phone': profile.user.phone_number},
                   after_state=None, request=request)

        profile.user.delete()

        return _success({'message': f'Member {member_name} ({member_id}) has been permanently deleted.'})


class AdminMemberExportView(APIView):
    permission_classes = [IsNationalOfficerOrAbove]

    def get(self, request):
        try:
            qs = MemberProfile.objects.select_related(
                'user', 'state', 'lga', 'ward', 'referred_by__user'
            ).filter(voter_verification_status='VERIFIED')

            state_id = request.query_params.get('state_id')
            if state_id:
                qs = qs.filter(state_id=state_id)

            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="cityboy_members_{timezone.now().date()}.csv"'

            writer = csv.writer(response)
            writer.writerow([
                'Membership ID', 'Full Name', 'Phone', 'Gender', 'Occupation',
                'State', 'LGA', 'Ward', 'Voter Card Number', 'Verification Status',
                'Role', 'Joined Date', 'Referred By'
            ])

            for p in qs:
                writer.writerow([
                    p.membership_id,
                    p.user.full_name,
                    f"{'*' * 6}{p.user.phone_number[-4:]}",
                    p.get_gender_display(),
                    p.occupation,
                    p.state.name if p.state else '',
                    p.lga.name if p.lga else '',
                    p.ward.name if p.ward else '',
                    p.voter_card_number,
                    p.voter_verification_status,
                    p.user.role,
                    p.joined_at.strftime('%Y-%m-%d'),
                    p.referred_by.user.full_name if p.referred_by else '',
                ])

            log_action(performed_by=request.user, action='MEMBER_EXPORT', target=None,
                       before_state=None, after_state={'exported_count': qs.count()}, request=request)

            return response
        except Exception as e:
            return _error('EXPORT_FAILED', str(e), 500)


class AdminMemberBulkActionView(APIView):
    permission_classes = [IsSuperAdmin]

    VALID_ACTIONS = ['verify', 'suspend', 'unsuspend', 'delete']

    def post(self, request):
        action = request.data.get('action', '').strip()
        member_ids = request.data.get('member_ids', [])

        if not action:
            return _error('ACTION_REQUIRED', 'Action is required.')
        if action not in self.VALID_ACTIONS:
            return _error('INVALID_ACTION', f'Action must be one of: {", ".join(self.VALID_ACTIONS)}')
        if not member_ids or not isinstance(member_ids, list):
            return _error('IDS_REQUIRED', 'member_ids must be a non-empty list.')
        if len(member_ids) > 500:
            return _error('TOO_MANY', 'Cannot bulk action more than 500 members at once.')

        profiles = MemberProfile.objects.filter(pk__in=member_ids).select_related('user')
        updated = 0

        if action == 'verify':
            updated = profiles.filter(voter_verification_status='PENDING').update(
                voter_verification_status='VERIFIED', voter_verified_by=request.user, voter_verified_at=timezone.now()
            )
        elif action == 'suspend':
            user_ids = list(profiles.exclude(user=request.user).values_list('user_id', flat=True))
            updated = User.objects.filter(pk__in=user_ids).update(is_active=False)
        elif action == 'unsuspend':
            user_ids = list(profiles.values_list('user_id', flat=True))
            updated = User.objects.filter(pk__in=user_ids).update(is_active=True)
        elif action == 'delete':
            confirm = request.data.get('confirm', False)
            if not confirm:
                return _error('CONFIRM_REQUIRED', 'Send {"confirm": true} for bulk delete.')
            user_ids = list(profiles.exclude(user=request.user).values_list('user_id', flat=True))
            updated, _ = User.objects.filter(pk__in=user_ids).delete()

        log_action(performed_by=request.user, action=f'BULK_{action.upper()}', target=None,
                   before_state=None, after_state={'member_ids': member_ids, 'affected': updated}, request=request)

        return _success({'message': f'Bulk {action} applied to {updated} members.', 'affected': updated})


class AdminVoterCardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            profile = MemberProfile.objects.get(pk=pk)
        except MemberProfile.DoesNotExist:
            return _error('MEMBER_NOT_FOUND', 'Member not found.', 404)

        if not profile.voter_card_image:
            return _error('NO_VOTER_CARD', 'No voter card image on file.', 404)

        url = request.build_absolute_uri(profile.voter_card_image.url)
        return _success({'url': url, 'expires_in': 900})


class AdminMemberActivityView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            profile = MemberProfile.objects.select_related('user').get(pk=pk)
        except MemberProfile.DoesNotExist:
            return _error('MEMBER_NOT_FOUND', 'Member not found.', 404)

        events_attended = EventAttendance.objects.filter(member=profile.user).select_related('event').order_by('-checked_in_at')[:20]
        reports = GrassrootsReport.objects.filter(reporter=profile.user).order_by('-created_at')[:20]
        audit = AuditLog.objects.filter(
            Q(target_type='MemberProfile', target_id=profile.pk) | Q(user=profile.user)
        ).order_by('-created_at')[:20]

        return _success({
            'events': [{'id': ea.event_id, 'title': ea.event.title, 'checked_in_at': ea.checked_in_at.isoformat()} for ea in events_attended],
            'reports': [{'id': r.id, 'period': r.report_period, 'status': r.status, 'created_at': r.created_at.isoformat()} for r in reports],
            'audit_trail': AuditLogSerializer(audit, many=True).data,
        })


class AdminMemberNetworkView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            profile = MemberProfile.objects.get(pk=pk)
        except MemberProfile.DoesNotExist:
            return _error('MEMBER_NOT_FOUND', 'Member not found.', 404)

        direct = profile.direct_referrals.select_related('user', 'state').order_by('-joined_at')
        return _success({
            'direct_count': direct.count(),
            'total_network': profile.total_network_size,
            'direct_referrals': [
                {
                    'pk': r.pk, 'name': r.user.full_name, 'state': r.state.name if r.state else '',
                    'verified': r.voter_verification_status == 'VERIFIED', 'joined_at': r.joined_at.isoformat(),
                }
                for r in direct[:50]
            ],
        })


# ── VERIFICATIONS ────────────────────────────────────────────────────────────

class AdminVerificationQueueView(ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminVerificationSerializer
    pagination_class = AdminStandardPagination

    def get_queryset(self):
        status = self.request.query_params.get('status', 'PENDING')
        valid_statuses = ['PENDING', 'VERIFIED', 'REJECTED']
        if status not in valid_statuses:
            status = 'PENDING'

        qs = MemberProfile.objects.filter(
            voter_verification_status=status
        ).select_related('user', 'state', 'lga', 'ward')

        if status == 'PENDING':
            qs = qs.order_by('joined_at')
        else:
            qs = qs.order_by('-voter_verified_at')

        user = self.request.user
        if ROLE_HIERARCHY.get(user.role, 0) < ROLE_HIERARCHY.get('NATIONAL_OFFICER', 8):
            try:
                qs = qs.filter(state=user.profile.state)
            except MemberProfile.DoesNotExist:
                qs = qs.none()

        return qs


class AdminVerificationStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            now = timezone.now()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

            total_pending = MemberProfile.objects.filter(voter_verification_status='PENDING').count()
            approved_today = MemberProfile.objects.filter(
                voter_verification_status='VERIFIED', voter_verified_at__gte=today_start
            ).count()
            rejected_today = MemberProfile.objects.filter(
                voter_verification_status='REJECTED', voter_verified_at__gte=today_start
            ).count()

            return _success({
                'total_pending': total_pending,
                'approved_today': approved_today,
                'rejected_today': rejected_today,
            })
        except Exception as e:
            return _error('STATS_FAILED', str(e), 500)


# ── STRUCTURE & LEADERSHIP ──────────────────────────────────────────────────

class AdminStructureOverviewView(APIView):
    permission_classes = [IsNationalOfficerOrAbove]

    def get(self, request):
        try:
            states = State.objects.annotate(
                member_count=Count('members'),
                leader_count=Count('leadership', filter=Q(leadership__is_active=True)),
            ).values('id', 'name', 'code', 'zone__name', 'member_count', 'leader_count')
            return _success(list(states))
        except Exception as e:
            return _error('STRUCTURE_FAILED', str(e), 500)


class AdminStateListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            states = State.objects.annotate(
                member_count=Count('members'),
                verified_count=Count('members', filter=Q(members__voter_verification_status='VERIFIED')),
                lga_count=Count('lgas', distinct=True),
            ).values('id', 'name', 'code', 'zone__name', 'member_count', 'verified_count', 'lga_count').order_by('name')
            return _success(list(states))
        except Exception as e:
            return _error('STATE_LIST_FAILED', str(e), 500)


class AdminStateDetailView(APIView):
    permission_classes = [IsNationalOfficerOrAbove]

    def get(self, request, pk):
        try:
            state = State.objects.get(pk=pk)
        except State.DoesNotExist:
            return _error('STATE_NOT_FOUND', 'State not found.', 404)

        lgas = LocalGovernment.objects.filter(state=state).annotate(
            member_count=Count('members'),
            ward_count=Count('ward', distinct=True),
        ).values('id', 'name', 'member_count', 'ward_count').order_by('name')

        leaders = Leadership.objects.filter(state=state, is_active=True).select_related('user')

        return _success({
            'state': {'id': state.id, 'name': state.name, 'code': state.code},
            'lgas': list(lgas),
            'leaders': AdminLeadershipSerializer(leaders, many=True).data,
            'total_members': MemberProfile.objects.filter(state=state).count(),
            'verified_members': MemberProfile.objects.filter(state=state, voter_verification_status='VERIFIED').count(),
        })


class AdminStateOrgChartView(APIView):
    permission_classes = [IsNationalOfficerOrAbove]

    def get(self, request, pk):
        try:
            state = State.objects.get(pk=pk)
        except State.DoesNotExist:
            return _error('STATE_NOT_FOUND', 'State not found.', 404)

        leaders = Leadership.objects.filter(
            state=state, is_active=True
        ).select_related('user', 'state', 'lga', 'ward').order_by('position')

        return _success({
            'state': {'id': state.id, 'name': state.name},
            'leaders': OrgChartSerializer(leaders, many=True).data,
            'member_count': MemberProfile.objects.filter(state=state).count(),
        })


class AdminStateHealthView(APIView):
    permission_classes = [IsNationalOfficerOrAbove]

    def get(self, request, pk):
        try:
            state = State.objects.get(pk=pk)
        except State.DoesNotExist:
            return _error('STATE_NOT_FOUND', 'State not found.', 404)

        total_members = MemberProfile.objects.filter(state=state).count()
        verified = MemberProfile.objects.filter(state=state, voter_verification_status='VERIFIED').count()
        total_lgas = LocalGovernment.objects.filter(state=state).count()
        active_lgas = MemberProfile.objects.filter(state=state).values('lga').distinct().count()
        leaders = Leadership.objects.filter(state=state, is_active=True).count()
        events = Event.objects.filter(state=state).count()

        return _success({
            'total_members': total_members, 'verified': verified,
            'total_lgas': total_lgas, 'active_lgas': active_lgas,
            'leaders': leaders, 'events': events,
            'health_score': round(((verified / total_members * 30) if total_members else 0) +
                                  ((active_lgas / total_lgas * 30) if total_lgas else 0) +
                                  (min(leaders / 5, 1) * 20) + (min(events / 3, 1) * 20), 1),
        })


class AdminLeadershipListView(ListAPIView):
    permission_classes = [IsNationalOfficerOrAbove]
    serializer_class = AdminLeadershipSerializer
    pagination_class = AdminStandardPagination

    def get_queryset(self):
        qs = Leadership.objects.select_related('user', 'state', 'lga', 'ward').order_by('-appointed_at')
        params = self.request.query_params
        state_id = params.get('state_id')
        if state_id:
            qs = qs.filter(state_id=state_id)
        position = params.get('position')
        if position:
            qs = qs.filter(position=position)
        active_only = params.get('active_only', 'true')
        if active_only.lower() == 'true':
            qs = qs.filter(is_active=True)
        return qs


class AdminAppointLeaderView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request):
        user_id = request.data.get('user_id')
        position = request.data.get('position')
        state_id = request.data.get('state_id')
        lga_id = request.data.get('lga_id')
        ward_id = request.data.get('ward_id')
        tenure_ends = request.data.get('tenure_ends')

        if not user_id or not position:
            return _error('FIELDS_REQUIRED', 'user_id and position are required.')

        valid_positions = [p[0] for p in Leadership.LEADERSHIP_POSITIONS]
        if position not in valid_positions:
            return _error('INVALID_POSITION', f'Position must be one of: {", ".join(valid_positions)}')

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return _error('USER_NOT_FOUND', 'User not found.', 404)

        leadership = Leadership.objects.create(
            user=user, position=position, state_id=state_id, lga_id=lga_id,
            ward_id=ward_id, appointed_by=request.user, tenure_ends=tenure_ends,
        )

        role_mapping = {
            'STATE_DIRECTOR': 'STATE_DIRECTOR', 'DEPUTY_STATE_DIRECTOR': 'STATE_DIRECTOR',
            'STATE_COORDINATOR': 'STATE_DIRECTOR', 'STATE_SECRETARY': 'STATE_DIRECTOR',
            'LGA_COORDINATOR': 'LGA_COORDINATOR', 'WARD_COORDINATOR': 'WARD_COORDINATOR',
        }
        new_role = role_mapping.get(position)
        if new_role and ROLE_HIERARCHY.get(new_role, 0) > ROLE_HIERARCHY.get(user.role, 0):
            user.role = new_role
            user.save(update_fields=['role'])

        log_action(performed_by=request.user, action='LEADER_APPOINTED', target=leadership,
                   before_state=None, after_state={'position': position, 'user_id': user_id}, request=request)

        return _success(AdminLeadershipSerializer(leadership).data, 201)


class AdminLeadershipDetailView(APIView):
    permission_classes = [IsNationalOfficerOrAbove]

    def get(self, request, pk):
        try:
            leadership = Leadership.objects.select_related('user', 'state', 'lga', 'ward').get(pk=pk)
        except Leadership.DoesNotExist:
            return _error('NOT_FOUND', 'Leadership position not found.', 404)
        return _success(AdminLeadershipSerializer(leadership).data)


class AdminRemoveLeaderView(APIView):
    permission_classes = [IsSuperAdmin]

    def delete(self, request, pk):
        try:
            leadership = Leadership.objects.select_related('user').get(pk=pk)
        except Leadership.DoesNotExist:
            return _error('NOT_FOUND', 'Leadership position not found.', 404)

        leadership.is_active = False
        leadership.save(update_fields=['is_active'])

        log_action(performed_by=request.user, action='LEADER_REMOVED', target=leadership,
                   before_state={'is_active': True}, after_state={'is_active': False}, request=request)

        return _success({'message': f'{leadership.user.full_name} removed from {leadership.get_position_display()}.'})


# ── EVENTS ──────────────────────────────────────────────────────────────────

class AdminEventListView(ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminEventSerializer
    pagination_class = AdminStandardPagination

    def get_queryset(self):
        qs = Event.objects.select_related('organizer', 'state').order_by('-start_datetime')
        params = self.request.query_params
        status = params.get('status')
        if status:
            qs = qs.filter(status=status)
        event_type = params.get('event_type')
        if event_type:
            qs = qs.filter(event_type=event_type)
        state_id = params.get('state_id')
        if state_id:
            qs = qs.filter(state_id=state_id)
        search = params.get('search', '').strip()
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(venue_name__icontains=search))
        return qs


class AdminEventDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            event = Event.objects.select_related('organizer', 'state', 'lga', 'ward').get(pk=pk)
        except Event.DoesNotExist:
            return _error('EVENT_NOT_FOUND', 'Event not found.', 404)

        attendance = EventAttendance.objects.filter(event=event).select_related('member')
        return _success({
            'event': AdminEventSerializer(event).data,
            'attendance_count': attendance.count(),
            'attendees': [
                {'id': a.member_id, 'name': a.member.full_name, 'checked_in_at': a.checked_in_at.isoformat()}
                for a in attendance[:100]
            ],
        })


class AdminCancelEventView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            event = Event.objects.get(pk=pk)
        except Event.DoesNotExist:
            return _error('EVENT_NOT_FOUND', 'Event not found.', 404)

        if event.status == 'CANCELLED':
            return _error('ALREADY_CANCELLED', 'This event is already cancelled.')

        before = {'status': event.status}
        event.status = 'CANCELLED'
        event.save(update_fields=['status'])

        log_action(performed_by=request.user, action='EVENT_CANCELLED', target=event,
                   before_state=before, after_state={'status': 'CANCELLED'}, request=request)

        return _success({'message': f'Event "{event.title}" has been cancelled.'})


class AdminDeleteEventView(APIView):
    permission_classes = [IsSuperAdmin]

    def delete(self, request, pk):
        try:
            event = Event.objects.get(pk=pk)
        except Event.DoesNotExist:
            return _error('EVENT_NOT_FOUND', 'Event not found.', 404)

        title = event.title
        log_action(performed_by=request.user, action='EVENT_DELETED', target=event,
                   before_state={'title': title}, after_state=None, request=request)
        event.delete()

        return _success({'message': f'Event "{title}" has been permanently deleted.'})


class AdminEventAttendanceView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            event = Event.objects.get(pk=pk)
        except Event.DoesNotExist:
            return _error('EVENT_NOT_FOUND', 'Event not found.', 404)

        attendance = EventAttendance.objects.filter(event=event).select_related('member')
        return _success({
            'event_id': event.id, 'event_title': event.title,
            'total': attendance.count(),
            'attendees': [
                {'id': a.member_id, 'name': a.member.full_name, 'method': a.check_in_method, 'at': a.checked_in_at.isoformat()}
                for a in attendance
            ],
        })


# ── ANNOUNCEMENTS ───────────────────────────────────────────────────────────

class AdminAnnouncementListView(ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminAnnouncementSerializer
    pagination_class = AdminStandardPagination

    def get_queryset(self):
        qs = Announcement.objects.select_related('author').order_by('-created_at')
        params = self.request.query_params
        is_published = params.get('is_published')
        if is_published is not None:
            qs = qs.filter(is_published=(is_published.lower() == 'true'))
        priority = params.get('priority')
        if priority:
            qs = qs.filter(priority=priority)
        search = params.get('search', '').strip()
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(body__icontains=search))
        return qs


class AdminAnnouncementDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            ann = Announcement.objects.select_related('author').get(pk=pk)
        except Announcement.DoesNotExist:
            return _error('ANNOUNCEMENT_NOT_FOUND', 'Announcement not found.', 404)
        return _success(AdminAnnouncementSerializer(ann).data)


class AdminPublishAnnouncementView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            ann = Announcement.objects.get(pk=pk)
        except Announcement.DoesNotExist:
            return _error('ANNOUNCEMENT_NOT_FOUND', 'Announcement not found.', 404)

        if ann.is_published:
            return _error('ALREADY_PUBLISHED', 'This announcement is already published.')

        ann.is_published = True
        ann.published_at = timezone.now()
        ann.save(update_fields=['is_published', 'published_at'])

        log_action(performed_by=request.user, action='ANNOUNCEMENT_PUBLISHED', target=ann,
                   before_state={'is_published': False}, after_state={'is_published': True}, request=request)

        return _success({'message': f'Announcement "{ann.title}" published.'})


class AdminUnpublishAnnouncementView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            ann = Announcement.objects.get(pk=pk)
        except Announcement.DoesNotExist:
            return _error('ANNOUNCEMENT_NOT_FOUND', 'Announcement not found.', 404)

        if not ann.is_published:
            return _error('NOT_PUBLISHED', 'This announcement is not published.')

        ann.is_published = False
        ann.save(update_fields=['is_published'])

        log_action(performed_by=request.user, action='ANNOUNCEMENT_UNPUBLISHED', target=ann,
                   before_state={'is_published': True}, after_state={'is_published': False}, request=request)

        return _success({'message': f'Announcement "{ann.title}" unpublished.'})


class AdminDeleteAnnouncementView(APIView):
    permission_classes = [IsSuperAdmin]

    def delete(self, request, pk):
        try:
            ann = Announcement.objects.get(pk=pk)
        except Announcement.DoesNotExist:
            return _error('ANNOUNCEMENT_NOT_FOUND', 'Announcement not found.', 404)

        title = ann.title
        log_action(performed_by=request.user, action='ANNOUNCEMENT_DELETED', target=ann,
                   before_state={'title': title}, after_state=None, request=request)
        ann.delete()

        return _success({'message': f'Announcement "{title}" has been permanently deleted.'})


# ── REPORTS ─────────────────────────────────────────────────────────────────

class AdminReportListView(ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminReportSerializer
    pagination_class = AdminStandardPagination

    def get_queryset(self):
        qs = GrassrootsReport.objects.select_related('reporter', 'state', 'lga').order_by('-created_at')
        params = self.request.query_params
        status = params.get('status')
        if status:
            qs = qs.filter(status=status)
        state_id = params.get('state_id')
        if state_id:
            qs = qs.filter(state_id=state_id)
        search = params.get('search', '').strip()
        if search:
            qs = qs.filter(Q(reporter__full_name__icontains=search) | Q(summary_of_activities__icontains=search))
        return qs


class AdminReportDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            report = GrassrootsReport.objects.select_related('reporter', 'state', 'lga', 'ward').get(pk=pk)
        except GrassrootsReport.DoesNotExist:
            return _error('REPORT_NOT_FOUND', 'Report not found.', 404)
        return _success(AdminReportSerializer(report).data)


class AdminAcknowledgeReportView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            report = GrassrootsReport.objects.get(pk=pk)
        except GrassrootsReport.DoesNotExist:
            return _error('REPORT_NOT_FOUND', 'Report not found.', 404)

        if report.status != 'SUBMITTED':
            return _error('INVALID_STATUS', 'Only submitted reports can be acknowledged.')

        report.status = 'ACKNOWLEDGED'
        report.save(update_fields=['status'])

        log_action(performed_by=request.user, action='REPORT_ACKNOWLEDGED', target=report,
                   before_state={'status': 'SUBMITTED'}, after_state={'status': 'ACKNOWLEDGED'}, request=request)

        return _success({'message': 'Report acknowledged.'})


class AdminReviewReportView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            report = GrassrootsReport.objects.get(pk=pk)
        except GrassrootsReport.DoesNotExist:
            return _error('REPORT_NOT_FOUND', 'Report not found.', 404)

        if report.status not in ('SUBMITTED', 'ACKNOWLEDGED'):
            return _error('INVALID_STATUS', 'Report has already been reviewed.')

        report.status = 'REVIEWED'
        report.save(update_fields=['status'])

        log_action(performed_by=request.user, action='REPORT_REVIEWED', target=report,
                   before_state={'status': report.status}, after_state={'status': 'REVIEWED'}, request=request)

        return _success({'message': 'Report marked as reviewed.'})


# ── AUDIT LOG ────────────────────────────────────────────────────────────────

class AdminAuditLogView(ListAPIView):
    permission_classes = [IsSuperAdmin]
    serializer_class = AuditLogSerializer
    pagination_class = AdminStandardPagination

    def get_queryset(self):
        qs = AuditLog.objects.select_related('user').order_by('-created_at')
        params = self.request.query_params

        search = params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(user__full_name__icontains=search) | Q(action__icontains=search)
            )
        action = params.get('action')
        if action:
            qs = qs.filter(action=action)
        date_from = params.get('date_from')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        date_to = params.get('date_to')
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        admin_id = params.get('admin_id')
        if admin_id:
            qs = qs.filter(user_id=admin_id)
        return qs


# ── SETTINGS ────────────────────────────────────────────────────────────────

class AdminSettingsView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        try:
            settings_qs = PlatformSettings.objects.all()
            data = {s.key: s.value for s in settings_qs}
            return _success(data)
        except Exception as e:
            return _error('SETTINGS_LOAD_FAILED', str(e), 500)

    def patch(self, request):
        try:
            ALLOWED_KEYS = [
                'sms_provider', 'sms_api_key', 'sms_sender_id',
                'otp_expiry_minutes', 'otp_max_attempts', 'otp_cooldown_minutes',
                'voter_card_required', 'min_age', 'auto_approve_voter_cards',
                'leaderboard_weight_onboarding', 'leaderboard_weight_attendance',
                'leaderboard_weight_engagement', 'leaderboard_weight_network_depth',
                'platform_name', 'platform_tagline', 'maintenance_mode',
            ]

            updated = {}
            for key, value in request.data.items():
                if key not in ALLOWED_KEYS:
                    return _error('INVALID_KEY', f'"{key}" is not a valid settings key.')

                if key.startswith('leaderboard_weight_'):
                    try:
                        value = float(value)
                        if not 0 <= value <= 100:
                            raise ValueError()
                    except (TypeError, ValueError):
                        return _error('INVALID_WEIGHT', f'Weight for {key} must be a number between 0 and 100.')

                PlatformSettings.objects.update_or_create(
                    key=key, defaults={'value': value, 'updated_by': request.user}
                )
                updated[key] = value

            log_action(performed_by=request.user, action='SETTINGS_UPDATED', target=None,
                       before_state=None, after_state=updated, request=request)

            return _success({'updated': updated})
        except Exception as e:
            return _error('SETTINGS_UPDATE_FAILED', str(e), 500)


class AdminTestSMSView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request):
        phone = request.data.get('phone_number', '').strip()
        if not phone:
            return _error('PHONE_REQUIRED', 'phone_number is required.')

        try:
            from apps.accounts.utils import send_otp_sms
            # In dev mode this just prints to console
            result = send_otp_sms(phone, '000000')
            return _success({'message': f'Test SMS sent to {phone}.', 'result': result})
        except Exception as e:
            return _error('SMS_SEND_FAILED', str(e), 500)


class AdminLeaderboardWeightsView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        keys = ['leaderboard_weight_onboarding', 'leaderboard_weight_attendance',
                'leaderboard_weight_engagement', 'leaderboard_weight_network_depth']
        settings_qs = PlatformSettings.objects.filter(key__in=keys)
        data = {s.key: s.value for s in settings_qs}
        return _success(data)

    def patch(self, request):
        keys = ['leaderboard_weight_onboarding', 'leaderboard_weight_attendance',
                'leaderboard_weight_engagement', 'leaderboard_weight_network_depth']
        total = 0
        for key in keys:
            val = request.data.get(key)
            if val is not None:
                try:
                    total += float(val)
                except (TypeError, ValueError):
                    return _error('INVALID_WEIGHT', f'{key} must be a number.')

        if total > 0 and abs(total - 100) > 0.1:
            return _error('WEIGHTS_NOT_100', f'Weights must sum to 100. Current sum: {total}')

        updated = {}
        for key in keys:
            val = request.data.get(key)
            if val is not None:
                PlatformSettings.objects.update_or_create(
                    key=key, defaults={'value': float(val), 'updated_by': request.user}
                )
                updated[key] = float(val)

        log_action(performed_by=request.user, action='LEADERBOARD_WEIGHTS_UPDATED', target=None,
                   before_state=None, after_state=updated, request=request)

        return _success({'updated': updated})
