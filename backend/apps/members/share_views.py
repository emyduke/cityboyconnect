from django.conf import settings
from django.http import Http404
from django.shortcuts import render
from django.views import View

from apps.members.models import MemberProfile


class ReferralShareView(View):
    """Public landing page that serves OG meta tags for social sharing
    and redirects browsers to the frontend join page."""

    def get(self, request, token):
        try:
            profile = MemberProfile.objects.select_related('user', 'state').get(
                onboarding_qr_token=token
            )
        except MemberProfile.DoesNotExist:
            raise Http404

        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://cityboyconnect.com')
        redirect_url = f'{frontend_url}/join?ref={token}'
        share_url = request.build_absolute_uri()

        # Build OG image URL — use the static og-image from frontend, or profile photo
        og_image_url = f'{frontend_url}/og-image.png'

        return render(request, 'share_referral.html', {
            'referrer_name': profile.user.full_name,
            'referrer_state': profile.state.name if profile.state else '',
            'redirect_url': redirect_url,
            'share_url': share_url,
            'frontend_url': frontend_url,
            'og_image_url': og_image_url,
        })
