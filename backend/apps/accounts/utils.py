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
    """Send OTP via configured SMS provider.

    Provider is controlled by settings.SMS_PROVIDER:
      - 'console'        → prints to terminal (development)
      - 'africastalking'  → sends real SMS via Africa's Talking
    """
    from apps.accounts.models import normalize_phone
    phone_number = normalize_phone(phone_number)
    provider = getattr(settings, 'SMS_PROVIDER', 'console')
    message = f'Your City Boy Connect verification code is: {otp_code}. Valid for 10 minutes.'

    if provider == 'console':
        logger.info(f'[SMS CONSOLE] To {phone_number}: {message}')
        print(f'\n📱 OTP for {phone_number}: {otp_code}\n')
        return True

    if provider == 'africastalking':
        return _send_via_africastalking(phone_number, message)

    logger.warning(f'Unknown SMS provider "{provider}", falling back to console.')
    print(f'\n📱 OTP for {phone_number}: {otp_code}\n')
    return True


def send_sms(to: str, message: str) -> dict:
    """
    Send SMS via configured provider.
    Returns {'success': True} or {'success': False, 'error': '...'}.
    """
    from apps.accounts.models import normalize_phone
    to = normalize_phone(to)
    provider = getattr(settings, 'SMS_PROVIDER', 'console')

    if provider == 'console':
        logger.info(f'[SMS CONSOLE] To {to}: {message}')
        print(f'\n📱 SMS to {to}: {message}\n')
        return {'success': True}

    if provider == 'africastalking':
        try:
            result = _send_via_africastalking(to, message)
            return {'success': True} if result else {'success': False, 'error': 'SMS delivery failed'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    logger.warning(f'Unknown SMS provider "{provider}", falling back to console.')
    print(f'\n📱 SMS to {to}: {message}\n')
    return {'success': True}


def _send_via_africastalking(phone_number, message):
    """Send an SMS using the Africa's Talking SDK."""
    import africastalking

    
    username = getattr(settings, 'AFRICASTALKING_USERNAME', 'cityboy')
    api_key = getattr(settings, 'AFRICASTALKING_API_KEY', '')
    sender_id = getattr(settings, 'SMS_SENDER_ID', None)


    if not api_key:
        logger.error('AFRICASTALKING_API_KEY is not set. Cannot send SMS.')
        return False

    africastalking.initialize(username, api_key)
    sms = africastalking.SMS

    

    try:
        kwargs = {'message': message, 'recipients': [phone_number]}
        if sender_id:
            kwargs['sender_id'] = sender_id

        response = sms.send(**kwargs)
        print(response)  # Debug: Check the raw response from Africa's Talking
        logger.info(f'[SMS AT] Sent to {phone_number}: {response}')

        # Check for failures in the response
        recipients = response.get('SMSMessageData', {}).get('Recipients', [])
        if recipients:
            status_code = recipients[0].get('statusCode', 0)
            if status_code == 101:  # 101 = Sent
                return True
            else:
                status_msg = recipients[0].get('status', 'Unknown')
                logger.warning(f'[SMS AT] Non-success status for {phone_number}: {status_code} — {status_msg}')
                return True  # Still return True — message was accepted by API

        return True
    except Exception as e:
        logger.error(f'[SMS AT] Failed to send to {phone_number}: {e}')
        return False


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
