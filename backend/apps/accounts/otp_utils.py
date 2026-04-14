import random
import string
from datetime import timedelta
from django.utils import timezone
from .models import OTPVerification


def generate_otp(length: int = 6) -> str:
    return ''.join(random.SystemRandom().choices(string.digits, k=length))


def create_otp(phone_number: str, channel: str, email: str = '') -> OTPVerification:
    """
    Invalidate any existing unused OTPs for this phone number,
    then create and return a fresh one.
    """
    OTPVerification.objects.filter(
        phone_number=phone_number,
        is_used=False,
    ).update(expires_at=timezone.now())

    otp = OTPVerification.objects.create(
        phone_number=phone_number,
        email=email,
        otp_code=generate_otp(),
        channel=channel,
        expires_at=timezone.now() + timedelta(minutes=10),
    )
    return otp


def verify_otp(phone_number: str, code: str) -> tuple:
    """
    Attempt to verify an OTP code.
    Returns (True, '') on success.
    Returns (False, 'reason') on failure.
    """
    try:
        otp = OTPVerification.objects.filter(
            phone_number=phone_number,
            is_used=False,
            expires_at__gt=timezone.now(),
        ).latest('created_at')
    except OTPVerification.DoesNotExist:
        return False, 'No active OTP found. Please request a new code.'

    otp.attempts += 1
    otp.save(update_fields=['attempts'])

    if otp.attempts > 5:
        otp.is_used = True
        otp.save(update_fields=['is_used'])
        return False, 'Too many failed attempts. Please request a new code.'

    if otp.otp_code != code:
        remaining = max(0, 5 - otp.attempts)
        return False, f'Incorrect code. {remaining} attempt{"s" if remaining != 1 else ""} remaining.'

    otp.is_used = True
    otp.save(update_fields=['is_used'])
    return True, ''
