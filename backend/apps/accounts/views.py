from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings

from .models import User, OTPVerification, normalize_phone
from .serializers import RequestOTPSerializer, VerifyOTPSerializer, UserSerializer
from .utils import success_response, error_response, send_otp_sms, log_audit


class RequestOTPView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'otp'

    def post(self, request):
        serializer = RequestOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone_number']

        # Rate limit: max 3 OTP requests per hour per phone
        one_hour_ago = timezone.now() - timezone.timedelta(hours=1)
        recent_count = OTPVerification.objects.filter(
            phone_number=phone,
            created_at__gte=one_hour_ago,
        ).count()

        if recent_count >= settings.OTP_MAX_ATTEMPTS:
            return error_response(
                'Too many OTP requests. Please try again in an hour.',
                code='OTP_RATE_LIMIT',
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        otp = OTPVerification.generate(phone)
        send_otp_sms(phone, otp.otp_code)

        return success_response(
            {'message': 'OTP sent successfully.', 'phone_number': phone},
            status_code=status.HTTP_200_OK,
        )


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone_number']
        otp_code = serializer.validated_data['otp_code']

        otp = OTPVerification.objects.filter(
            phone_number=phone,
            is_used=False,
        ).order_by('-created_at').first()

        if not otp:
            return error_response('No OTP found. Please request a new one.', code='OTP_NOT_FOUND')

        if otp.is_expired:
            return error_response('OTP has expired. Please request a new one.', code='OTP_EXPIRED')

        otp.attempts += 1
        otp.save(update_fields=['attempts'])

        if otp.attempts > 3:
            return error_response('Too many attempts. Please request a new OTP.', code='OTP_MAX_ATTEMPTS')

        if otp.otp_code != otp_code:
            return error_response('Invalid OTP code.', code='OTP_INVALID')

        # Mark OTP as used
        otp.is_used = True
        otp.save(update_fields=['is_used'])

        # Get or create user
        user, is_new = User.objects.get_or_create(
            phone_number=phone,
            defaults={'full_name': '', 'is_verified': True},
        )
        if not user.is_verified:
            user.is_verified = True
            user.save(update_fields=['is_verified'])

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        log_audit(user, 'LOGIN' if not is_new else 'REGISTER', request=request)

        return success_response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'is_new_user': is_new,
            'user': UserSerializer(user).data,
        })


class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return error_response('Refresh token is required.', code='TOKEN_REQUIRED')
        try:
            token = RefreshToken(refresh_token)
            return success_response({
                'access': str(token.access_token),
                'refresh': str(token),
            })
        except Exception:
            return error_response('Invalid or expired refresh token.', code='TOKEN_INVALID',
                                  status_code=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass
        return success_response({'message': 'Logged out successfully.'})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(UserSerializer(request.user).data)
