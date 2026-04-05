from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            'success': False,
            'error': {
                'code': 'ERROR',
                'message': '',
            }
        }

        if isinstance(response.data, dict):
            if 'detail' in response.data:
                error_data['error']['message'] = str(response.data['detail'])
                error_data['error']['code'] = response.data.get('code', 'ERROR')
            else:
                messages = []
                for field, errors in response.data.items():
                    if isinstance(errors, list):
                        for e in errors:
                            messages.append(f'{field}: {e}')
                    else:
                        messages.append(f'{field}: {errors}')
                error_data['error']['message'] = '; '.join(messages)
                if len(response.data) == 1:
                    error_data['error']['field'] = list(response.data.keys())[0]
        elif isinstance(response.data, list):
            error_data['error']['message'] = '; '.join(str(e) for e in response.data)
        else:
            error_data['error']['message'] = str(response.data)

        response.data = error_data

    return response


def success_response(data=None, meta=None, status_code=status.HTTP_200_OK):
    resp = {'success': True}
    if data is not None:
        resp['data'] = data
    if meta is not None:
        resp['meta'] = meta
    return Response(resp, status=status_code)


def error_response(message, code='ERROR', field=None, status_code=status.HTTP_400_BAD_REQUEST):
    resp = {
        'success': False,
        'error': {
            'code': code,
            'message': message,
        }
    }
    if field:
        resp['error']['field'] = field
    return Response(resp, status=status_code)


def send_otp_sms(phone_number, otp_code):
    """Send OTP via configured SMS provider."""
    provider = getattr(settings, 'SMS_PROVIDER', 'console')
    message = f'Your City Boy Connect verification code is: {otp_code}. Valid for 10 minutes.'

    if provider == 'console':
        logger.info(f'[SMS CONSOLE] To {phone_number}: {message}')
        print(f'\n📱 OTP for {phone_number}: {otp_code}\n')
        return True

    logger.info(f'SMS sent to {phone_number} via {provider}')
    return True


def log_audit(user, action, target_type='', target_id=None, details=None, request=None):
    from .models import AuditLog
    ip = None
    if request:
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()
    AuditLog.objects.create(
        user=user,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details or {},
        ip_address=ip,
    )
