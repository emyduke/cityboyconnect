from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from apps.accounts.utils import success_response, error_response, log_audit
from apps.accounts.models import ROLE_HIERARCHY
from apps.structure.models import State, LocalGovernment, Ward, PollingUnit
from .models import MemberProfile, Leadership
from .serializers import (
    MemberProfileSerializer, MemberProfileDetailSerializer,
    OnboardingProfileSerializer, OnboardingPlacementSerializer,
    OnboardingVoterCardSerializer, LeadershipSerializer,
    AppointLeadershipSerializer,
)
from .permissions import (
    IsCoordinatorOrAbove, IsStateDirectorOrAbove,
    get_scoped_queryset,
)


class OnboardingProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = OnboardingProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Update user name
        request.user.full_name = data['full_name']
        request.user.save(update_fields=['full_name'])

        # Create or update profile
        profile, _ = MemberProfile.objects.get_or_create(user=request.user)
        profile.date_of_birth = data['date_of_birth']
        profile.gender = data['gender']
        profile.occupation = data['occupation']
        if 'profile_photo' in data:
            profile.profile_photo = data['profile_photo']
        profile.onboarding_step = max(profile.onboarding_step, 1)
        profile.save()

        return success_response(
            MemberProfileSerializer(profile).data,
            status_code=status.HTTP_200_OK,
        )


class OnboardingPlacementView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = OnboardingPlacementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Validate structure references
        try:
            state = State.objects.get(id=data['state'])
            lga = LocalGovernment.objects.get(id=data['lga'], state=state)
            ward = Ward.objects.get(id=data['ward'], lga=lga)
        except (State.DoesNotExist, LocalGovernment.DoesNotExist, Ward.DoesNotExist):
            return error_response('Invalid state/LGA/ward selection.', code='INVALID_STRUCTURE')

        polling_unit = None
        if data.get('polling_unit'):
            try:
                polling_unit = PollingUnit.objects.get(id=data['polling_unit'], ward=ward)
            except PollingUnit.DoesNotExist:
                return error_response('Invalid polling unit.', code='INVALID_UNIT')

        profile, _ = MemberProfile.objects.get_or_create(user=request.user)
        profile.state = state
        profile.lga = lga
        profile.ward = ward
        profile.polling_unit = polling_unit
        profile.residential_address = data['residential_address']
        profile.onboarding_step = max(profile.onboarding_step, 2)
        profile.save()

        return success_response(MemberProfileSerializer(profile).data)


class OnboardingVoterCardView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = OnboardingVoterCardSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        profile, _ = MemberProfile.objects.get_or_create(user=request.user)
        if data.get('voter_card_number'):
            profile.voter_card_number = data['voter_card_number']
        if data.get('voter_card_image'):
            profile.voter_card_image = data['voter_card_image']
        if data.get('apc_membership_number'):
            profile.apc_membership_number = data['apc_membership_number']
        if profile.voter_card_number or profile.voter_card_image:
            profile.voter_verification_status = 'PENDING'
        profile.onboarding_step = max(profile.onboarding_step, 3)
        profile.save()

        return success_response(MemberProfileSerializer(profile).data)


class OnboardingStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.profile
            return success_response({
                'onboarding_step': profile.onboarding_step,
                'is_complete': profile.is_onboarding_complete,
                'membership_id': profile.membership_id,
                'referral_code': profile.referral_code,
                'voter_status': profile.voter_verification_status,
            })
        except MemberProfile.DoesNotExist:
            return success_response({
                'onboarding_step': 0,
                'is_complete': False,
                'membership_id': None,
                'referral_code': None,
                'voter_status': None,
            })


class MemberListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MemberProfileSerializer
    search_fields = ['user__full_name', 'membership_id', 'user__phone_number']
    filterset_fields = ['state', 'lga', 'ward', 'voter_verification_status', 'membership_category']
    ordering_fields = ['joined_at', 'user__full_name']

    def get_queryset(self):
        qs = MemberProfile.objects.select_related('user', 'state', 'lga', 'ward').filter(is_active=True)
        return get_scoped_queryset(self.request.user, qs)


class MemberDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MemberProfileDetailSerializer

    def get_queryset(self):
        qs = MemberProfile.objects.select_related('user', 'state', 'lga', 'ward')
        return get_scoped_queryset(self.request.user, qs)


class MemberUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request, pk):
        try:
            profile = MemberProfile.objects.get(pk=pk, user=request.user)
        except MemberProfile.DoesNotExist:
            return error_response('Profile not found.', code='NOT_FOUND',
                                  status_code=status.HTTP_404_NOT_FOUND)

        allowed_fields = ['occupation', 'residential_address', 'profile_photo', 'email']
        for field in allowed_fields:
            if field in request.data:
                if field == 'email':
                    request.user.email = request.data[field]
                    request.user.save(update_fields=['email'])
                else:
                    setattr(profile, field, request.data[field])
        profile.save()

        return success_response(MemberProfileSerializer(profile).data)


class MyReferralsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MemberProfileSerializer

    def get_queryset(self):
        try:
            profile = self.request.user.profile
            return MemberProfile.objects.filter(referred_by=profile).select_related('user', 'state')
        except MemberProfile.DoesNotExist:
            return MemberProfile.objects.none()


class MemberDirectoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MemberProfileSerializer
    search_fields = ['user__full_name', 'membership_id']
    filterset_fields = ['state', 'lga', 'ward', 'membership_category']

    def get_queryset(self):
        qs = MemberProfile.objects.filter(
            is_active=True, voter_verification_status='VERIFIED'
        ).select_related('user', 'state', 'lga', 'ward')
        return get_scoped_queryset(self.request.user, qs)


# Leadership views
class LeadershipListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LeadershipSerializer
    filterset_fields = ['state', 'lga', 'ward', 'position', 'is_active']

    def get_queryset(self):
        return Leadership.objects.filter(is_active=True).select_related(
            'user', 'state', 'lga', 'ward'
        )


class StateLeadershipView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LeadershipSerializer

    def get_queryset(self):
        state_id = self.kwargs['state_id']
        return Leadership.objects.filter(
            state_id=state_id, is_active=True
        ).select_related('user', 'state', 'lga', 'ward')


class AppointLeadershipView(APIView):
    permission_classes = [IsStateDirectorOrAbove]

    def post(self, request):
        serializer = AppointLeadershipSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        from apps.accounts.models import User
        try:
            user = User.objects.get(id=data['user_id'])
        except User.DoesNotExist:
            return error_response('User not found.', code='USER_NOT_FOUND')

        leadership = Leadership.objects.create(
            user=user,
            position=data['position'],
            state_id=data.get('state'),
            lga_id=data.get('lga'),
            ward_id=data.get('ward'),
            appointed_by=request.user,
            tenure_ends=data.get('tenure_ends'),
        )

        # Update user role based on position
        role_mapping = {
            'STATE_DIRECTOR': 'STATE_DIRECTOR',
            'DEPUTY_STATE_DIRECTOR': 'STATE_DIRECTOR',
            'STATE_COORDINATOR': 'STATE_DIRECTOR',
            'STATE_SECRETARY': 'STATE_DIRECTOR',
            'LGA_COORDINATOR': 'LGA_COORDINATOR',
            'WARD_COORDINATOR': 'WARD_COORDINATOR',
        }
        new_role = role_mapping.get(data['position'])
        if new_role and ROLE_HIERARCHY.get(new_role, 0) > ROLE_HIERARCHY.get(user.role, 0):
            user.role = new_role
            user.save(update_fields=['role'])

        log_audit(request.user, 'APPOINT_LEADER', 'Leadership', leadership.id,
                  {'position': data['position'], 'user_id': data['user_id']}, request)

        return success_response(
            LeadershipSerializer(leadership).data,
            status_code=status.HTTP_201_CREATED,
        )


# ── QR / Network views ──

class MyQRView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .qr_utils import generate_qr_image
        try:
            profile = request.user.profile
        except MemberProfile.DoesNotExist:
            return error_response('Profile not found.', code='NO_PROFILE')

        base_url = request.build_absolute_uri('/join')
        qr_url = f'{base_url}?ref={profile.onboarding_qr_token}'
        qr_image = generate_qr_image(qr_url)

        today_count = MemberProfile.objects.filter(
            referred_by=profile,
            joined_at__date=timezone.now().date(),
        ).count()

        return success_response({
            'qr_token': profile.onboarding_qr_token,
            'qr_url': qr_url,
            'qr_image': qr_image,
            'direct_count': profile.direct_referrals.count(),
            'network_size': profile.total_network_size,
            'today_count': today_count,
        })


class ValidateRefView(APIView):
    """Validate a referral token and return referrer info — public endpoint."""
    permission_classes = []
    authentication_classes = []

    def get(self, request, token):
        try:
            profile = MemberProfile.objects.select_related('user', 'state').get(
                onboarding_qr_token=token
            )
        except MemberProfile.DoesNotExist:
            return error_response('Invalid referral link.', code='INVALID_REF',
                                  status_code=status.HTTP_404_NOT_FOUND)

        return success_response({
            'name': profile.user.full_name,
            'state': profile.state.name if profile.state else '',
            'photo': profile.profile_photo.url if profile.profile_photo else None,
        })


class MyNetworkView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.profile
        except MemberProfile.DoesNotExist:
            return success_response({'results': [], 'stats': {}})

        direct = profile.direct_referrals.select_related('user', 'state', 'lga', 'ward')

        stats = {
            'direct': direct.count(),
            'total_network': profile.total_network_size,
            'verified': direct.filter(voter_verification_status='VERIFIED').count(),
            'this_month': direct.filter(
                joined_at__year=timezone.now().year,
                joined_at__month=timezone.now().month,
            ).count(),
        }

        return success_response({
            'results': MemberProfileSerializer(direct, many=True).data,
            'stats': stats,
        })


class MyNetworkTreeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        depth = min(int(request.query_params.get('depth', 3)), 5)
        try:
            profile = request.user.profile
        except MemberProfile.DoesNotExist:
            return success_response({'tree': {}})

        def build_tree(p, current_depth=0):
            node = {
                'id': p.user_id,
                'name': p.user.full_name,
                'photo': p.profile_photo.url if p.profile_photo else None,
                'state': p.state.name if p.state else '',
                'status': p.voter_verification_status,
                'joined': p.joined_at.isoformat(),
                'network_size': p.direct_referrals.count(),
                'children': [],
            }
            if current_depth < depth:
                children = p.direct_referrals.select_related('user', 'state').all()
                node['children'] = [
                    build_tree(c, current_depth + 1) for c in children
                ]
            return node

        return success_response({'tree': build_tree(profile)})


class MyNetworkRecentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from datetime import timedelta
        cutoff = timezone.now() - timedelta(days=30)
        try:
            profile = request.user.profile
        except MemberProfile.DoesNotExist:
            return success_response({'results': []})

        # Get all IDs in the network (first 3 levels) then get recent
        network_ids = set()

        def collect_ids(p, depth=0):
            if depth > 3:
                return
            for child in p.direct_referrals.all():
                network_ids.add(child.pk)
                collect_ids(child, depth + 1)

        collect_ids(profile)

        recent = MemberProfile.objects.filter(
            pk__in=network_ids,
            joined_at__gte=cutoff,
        ).select_related('user', 'state', 'referred_by__user').order_by('-joined_at')[:30]

        results = []
        for m in recent:
            results.append({
                'id': m.user_id,
                'name': m.user.full_name,
                'state': m.state.name if m.state else '',
                'joined': m.joined_at.isoformat(),
                'referred_by': m.referred_by.user.full_name if m.referred_by else '',
            })

        return success_response({'results': results})
