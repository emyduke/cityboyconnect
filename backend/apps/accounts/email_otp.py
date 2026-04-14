import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

ONESIGNAL_API_URL = 'https://api.onesignal.com/notifications?c=email'


def send_otp_email(to_email: str, otp_code: str, full_name: str = '') -> dict:
    """
    Send OTP via email using OneSignal's Email API.
    Returns {'success': True} or {'success': False, 'error': '...'}.
    """
    if not to_email:
        return {'success': False, 'error': 'No email address provided.'}

    name_greeting = f"Hi {full_name.split()[0]}," if full_name else "Hello,"

    subject = f'Your City Boy Connect verification code: {otp_code}'

    plain_message = f"""{name_greeting}

Your City Boy Connect verification code is:

    {otp_code}

This code expires in 10 minutes. Do not share it with anyone.

If you did not request this code, please ignore this message.

— City Boy Connect Team
"""

    html_message = f"""
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f8f7f4; margin: 0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white;
              border-radius: 16px; overflow: hidden;
              box-shadow: 0 4px 24px rgba(26,71,42,0.10);">
    <div style="background: #1a472a; padding: 32px 32px 24px; text-align: center;">
      <p style="color: #d4a017; font-size: 13px; letter-spacing: 3px;
                font-weight: 700; margin: 0 0 8px; text-transform: uppercase;">
        City Boy Connect
      </p>
      <p style="color: rgba(255,255,255,0.75); font-size: 14px; margin: 0;">
        Verification Code
      </p>
    </div>
    <div style="padding: 40px 32px;">
      <p style="color: #111827; font-size: 16px; margin: 0 0 24px;">
        {name_greeting}
      </p>
      <p style="color: #4a4843; font-size: 15px; margin: 0 0 32px;">
        Use the code below to verify your identity on City Boy Connect.
      </p>
      <div style="background: #e8f0eb; border: 2px solid #1a472a;
                  border-radius: 12px; padding: 24px; text-align: center;
                  margin-bottom: 32px;">
        <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;
                  letter-spacing: 1px; text-transform: uppercase;">
          Your code
        </p>
        <p style="margin: 0; font-size: 42px; font-weight: 800;
                  color: #1a472a; letter-spacing: 12px; font-family: monospace;">
          {otp_code}
        </p>
      </div>
      <p style="color: #6b7280; font-size: 13px; text-align: center;
                margin: 0 0 8px;">
        This code expires in <strong>10 minutes</strong>.
      </p>
      <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 0;">
        Never share this code with anyone.
      </p>
    </div>
    <div style="background: #f8f7f4; padding: 20px 32px; text-align: center;
                border-top: 1px solid #e8e4dc;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        City Boy Movement Nigeria &middot; APC Aligned<br>
        No. 11 Niafounke Street, Wuse II, Abuja
      </p>
    </div>
  </div>
</body>
</html>
"""

    try:
        app_id = settings.ONESIGNAL_APP_ID
        api_key = settings.ONESIGNAL_REST_API_KEY

        if not app_id or not api_key:
            logger.error('OneSignal credentials not configured')
            return {'success': False, 'error': 'Email service not configured.'}

        payload = {
            'app_id': app_id,
            'email_subject': subject,
            'email_body': html_message,
            'email_from_name': 'City Boy Connect',
            'email_to': [to_email],
            'include_unsubscribed': True,
        }

        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Key {api_key}',
        }

        resp = requests.post(
            ONESIGNAL_API_URL,
            json=payload,
            headers=headers,
            timeout=15,
        )

        data = resp.json()

        if resp.status_code == 200 and data.get('id'):
            logger.info(f'OTP email sent to {to_email} via OneSignal (id={data["id"]})')
            return {'success': True}
        else:
            error_msg = str(data.get('errors', data))
            logger.error(f'OneSignal email failed for {to_email}: {error_msg}')
            return {'success': False, 'error': error_msg}

    except Exception as e:
        logger.exception(f'OTP email send failed to {to_email}: {e}')
        return {'success': False, 'error': str(e)}
