from apps.admin_panel.models import PlatformSettings


def _get_setting(key: str, default):
    try:
        obj = PlatformSettings.objects.get(key=key)
        return obj.value
    except PlatformSettings.DoesNotExist:
        return default


def sms_otp_enabled() -> bool:
    return bool(_get_setting('auth_sms_otp_enabled', True))


def email_otp_enabled() -> bool:
    return bool(_get_setting('auth_email_otp_enabled', True))


def password_login_enabled() -> bool:
    return bool(_get_setting('auth_password_login_enabled', True))


def available_auth_methods() -> list:
    methods = []
    if sms_otp_enabled():
        methods.append('sms')
    if email_otp_enabled():
        methods.append('email')
    if password_login_enabled():
        methods.append('password')
    return methods
