import re
import logging
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, OTPVerification, normalize_phone
from .serializers import UserSerializer
from .utils import success_response, error_response, send_sms, log_audit
from .otp_utils import create_otp, verify_otp
from .email_otp import send_otp_email
from .auth_settings import (
    sms_otp_enabled, email_otp_enabled,
    password_login_enabled, available_auth_methods,
)

logger = logging.getLogger(__name__)


def _get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


def _user_data(user):
    data = {
        'id': user.pk,
        'phone_number': user.phone_number,
        'email': user.email,
        'full_name': user.full_name,
        'role': user.role,
        'is_active': user.is_active,
        'has_password': user.has_password,
        'is_verified': user.is_verified,
    }
    try:
        profile = user.memberprofile
        data.update({
            'membership_id': profile.membership_id,
            'onboarding_complete': bool(
                profile.voter_card_number or profile.voter_card_image
            ),
            'voter_verification_status': profile.voter_verification_status,
            'state_name': profile.state.name if profile.state else '',
        })
    except Exception:
        data['onboarding_complete'] = False
    return data


def _normalize(phone):
    phone = re.sub(r'[\s\-\(\)]', '', phone)
    if phone.startswith('0') and len(phone) == 11:
        phone = '+234' + phone[1:]
    elif phone.startswith('234') and not phone.startswith('+'):
        phone = '+' + phone
    elif not phone.startswith('+'):
        phone = '+234' + phone.lstrip('0')
    return phone


def _is_valid_nigerian(phone):
    return bool(re.match(r'^\+234[7-9][01]\d{8}$', phone))


def _mask_phone(phone):
    if len(phone) >= 8:
        return phone[:5] + '****' + phone[-3:]
    return '****'


def _mask_email(email):
    parts = email.split('@')
    if len(parts) != 2:
        return email
    local, domain = parts
    if len(local) <= 2:
        return f'**@{domain}'
    return f'{local[0]}{"*" * (len(local) - 2)}{local[-1]}@{domain}'


# ── GET AVAILABLE AUTH METHODS ────────────────────────────────────────────────

class AuthMethodsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        methods = available_auth_methods()
        phone = request.query_params.get('phone', '').strip()

        has_password = False
        has_email = False

        if phone:
            try:
                user = User.objects.get(phone_number=_normalize(phone))
                has_password = user.has_password
                has_email = bool(user.email)
            except User.DoesNotExist:
                pass

        return success_response({
            'available_methods': methods,
            'user_has_password': has_password,
            'user_has_email': has_email,
        })


# ── REQUEST OTP ───────────────────────────────────────────────────────────────

class RequestOTPView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'otp'

    def post(self, request):
        phone = request.data.get('phone_number', '').strip()
        channel = request.data.get('channel', 'sms').lower()
        email = request.data.get('email', '').strip()

        if not phone:
            return error_response(
                'Please enter your phone number.',
                code='PHONE_REQUIRED', field='phone_number',
            )

        phone = _normalize(phone)
        if not _is_valid_nigerian(phone):
            return error_response(
                'Please enter a valid Nigerian phone number (e.g. 08012345678).',
                code='INVALID_PHONE', field='phone_number',
            )

        # Validate channel
        if channel == 'sms' and not sms_otp_enabled():
            return error_response(
                'SMS verification is currently unavailable. Please use email or password.',
                code='SMS_DISABLED',
            )

        if channel == 'email' and not email_otp_enabled():
            return error_response(
                'Email verification is currently unavailable.',
                code='EMAIL_DISABLED',
            )

        if channel == 'email' and not email:
            try:
                user = User.objects.get(phone_number=phone)
                email = user.email
            except User.DoesNotExist:
                pass

            if not email:
                return error_response(
                    'Please provide your email address to receive the code.',
                    code='EMAIL_REQUIRED', field='email',
                )

        # Rate limiting
        recent_count = OTPVerification.objects.filter(
            phone_number=phone,
            created_at__gte=timezone.now() - timezone.timedelta(hours=1),
        ).count()
        if recent_count >= 5:
            return error_response(
                'Too many code requests. Please wait an hour before trying again.',
                code='RATE_LIMITED',
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # Create OTP
        otp = create_otp(
            phone_number=phone,
            channel=channel.upper(),
            email=email if channel == 'email' else '',
        )
        message = f'Your City Boy Connect verification code is: {otp.otp_code}. Valid for 10 minutes. Do not share.'

        # Deliver
        if channel == 'sms':
            result = send_sms(to=phone, message=message)
        else:
            try:
                user = User.objects.get(phone_number=phone)
                full_name = user.full_name
            except User.DoesNotExist:
                full_name = ''
            result = send_otp_email(
                to_email=email,
                otp_code=otp.otp_code,
                full_name=full_name,
            )

        if not result.get('success'):
            logger.error(f'OTP delivery failed [{channel}] to {phone}: {result.get("error")}')

            if channel == 'sms':
                friendly = (
                    'We could not send the SMS code right now. '
                    'Please try email delivery instead, or use your password if you have one set.'
                )
            else:
                friendly = (
                    'We could not send the email code. '
                    'Please check the email address and try again, or try a different method.'
                )

            return error_response(
                friendly,
                code='DELIVERY_FAILED',
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        masked_destination = (
            _mask_phone(phone) if channel == 'sms' else _mask_email(email)
        )

        return success_response({
            'message': f'Code sent to {masked_destination}',
            'channel': channel,
            'destination': masked_destination,
            'expires_in': 600,
            'is_new_user': not User.objects.filter(phone_number=phone).exists(),
        })


# ── VERIFY OTP ────────────────────────────────────────────────────────────────

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone_number', '').strip()
        code = request.data.get('otp_code', '').strip()
        email = request.data.get('email', '').strip()

        if not phone or not code:
            return error_response(
                'Phone number and OTP code are both required.',
                code='FIELDS_REQUIRED',
            )

        phone = _normalize(phone)

        valid, reason = verify_otp(phone_number=phone, code=code)
        if not valid:
            return error_response(reason, code='INVALID_OTP', field='otp_code')

        user, is_new = User.objects.get_or_create(
            phone_number=phone,
            defaults={'full_name': '', 'is_verified': True},
        )

        if not user.is_verified:
            user.is_verified = True
            user.save(update_fields=['is_verified'])

        if email and not user.email:
            user.email = email
            user.save(update_fields=['email'])

        log_audit(user, 'LOGIN' if not is_new else 'REGISTER', request=request)

        tokens = _get_tokens(user)
        return success_response({
            **tokens,
            'is_new_user': is_new,
            'user': _user_data(user),
        })


# ── PASSWORD LOGIN ────────────────────────────────────────────────────────────

class PasswordLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not password_login_enabled():
            return error_response(
                'Password login is not currently available.',
                code='METHOD_DISABLED',
            )

        phone = request.data.get('phone_number', '').strip()
        password = request.data.get('password', '')

        if not phone or not password:
            return error_response(
                'Phone number and password are required.',
                code='FIELDS_REQUIRED',
            )

        phone = _normalize(phone)

        try:
            user = User.objects.get(phone_number=phone)
        except User.DoesNotExist:
            return error_response(
                'Incorrect phone number or password. Please try again.',
                code='INVALID_CREDENTIALS',
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.check_password(password):
            return error_response(
                'Incorrect phone number or password. Please try again.',
                code='INVALID_CREDENTIALS',
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return error_response(
                'Your account has been suspended. Contact the National Secretariat.',
                code='ACCOUNT_SUSPENDED',
                status_code=status.HTTP_403_FORBIDDEN,
            )

        log_audit(user, 'LOGIN', request=request)

        tokens = _get_tokens(user)
        return success_response({
            **tokens,
            'is_new_user': False,
            'user': _user_data(user),
        })


# ── SET / CHANGE PASSWORD ─────────────────────────────────────────────────────

class SetPasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_password = request.data.get('new_password', '')
        confirm_password = request.data.get('confirm_password', '')
        old_password = request.data.get('old_password', '')

        user = request.user

        if user.has_password:
            if not old_password:
                return error_response(
                    'Please enter your current password to set a new one.',
                    code='OLD_PASSWORD_REQUIRED', field='old_password',
                )
            if not user.check_password(old_password):
                return error_response(
                    'Current password is incorrect.',
                    code='WRONG_PASSWORD', field='old_password',
                )

        if not new_password:
            return error_response(
                'Please enter a new password.',
                code='PASSWORD_REQUIRED', field='new_password',
            )

        if len(new_password) < 8:
            return error_response(
                'Password must be at least 8 characters long.',
                code='PASSWORD_TOO_SHORT', field='new_password',
            )

        if new_password != confirm_password:
            return error_response(
                'Passwords do not match.',
                code='PASSWORDS_DO_NOT_MATCH', field='confirm_password',
            )

        user.set_password(new_password)
        user.has_password = True
        user.save(update_fields=['password', 'has_password'])

        return success_response({
            'message': 'Password set successfully. You can now log in with your password.',
        })


# ── TOKEN REFRESH ─────────────────────────────────────────────────────────────

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
            return error_response(
                'Your session has expired. Please log in again.',
                code='TOKEN_EXPIRED',
                status_code=status.HTTP_401_UNAUTHORIZED,
            )


# ── LOGOUT ────────────────────────────────────────────────────────────────────

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


# ── CURRENT USER ──────────────────────────────────────────────────────────────

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(_user_data(request.user))
