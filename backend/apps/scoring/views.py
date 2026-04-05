from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from apps.accounts.utils import success_response
from apps.members.models import MemberProfile
from .models import MemberScore
from .serializers import MemberScoreSerializer, LeaderboardEntrySerializer


class LeaderboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        scope = request.query_params.get('scope', 'national')
        page = int(request.query_params.get('page', 1))
        per_page = 50

        qs = MemberScore.objects.select_related(
            'member__user', 'member__state', 'member__lga'
        )

        if scope == 'state':
            state_id = request.query_params.get('state_id')
            if not state_id:
                try:
                    state_id = request.user.profile.state_id
                except Exception:
                    pass
            if state_id:
                qs = qs.filter(member__state_id=state_id).order_by('state_rank')
            else:
                qs = qs.order_by('-total_score')
        elif scope == 'lga':
            lga_id = request.query_params.get('lga_id')
            if not lga_id:
                try:
                    lga_id = request.user.profile.lga_id
                except Exception:
                    pass
            if lga_id:
                qs = qs.filter(member__lga_id=lga_id).order_by('-total_score')
            else:
                qs = qs.order_by('-total_score')
        else:
            qs = qs.order_by('national_rank')

        start = (page - 1) * per_page
        results = qs[start:start + per_page]
        total = qs.count()

        return success_response({
            'results': LeaderboardEntrySerializer(results, many=True).data,
            'total': total,
            'page': page,
            'per_page': per_page,
        })


class MyRankView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.profile
            score = MemberScore.objects.select_related(
                'member__user', 'member__state', 'member__lga'
            ).get(member=profile)
            return success_response(MemberScoreSerializer(score).data)
        except (MemberProfile.DoesNotExist, MemberScore.DoesNotExist):
            return success_response({
                'total_score': 0,
                'national_rank': None,
                'state_rank': None,
                'score_onboarding': 0,
                'score_attendance': 0,
                'score_engagement': 0,
                'score_network_depth': 0,
                'members_onboarded_direct': 0,
                'members_onboarded_network': 0,
                'referral_chain_depth': 0,
                'events_attended': 0,
                'reports_submitted': 0,
                'announcements_read': 0,
                'badges': [],
                'badges_detail': [],
            })
