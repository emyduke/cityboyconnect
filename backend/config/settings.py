import os
from pathlib import Path
from datetime import timedelta

try:
    from decouple import config
except ImportError:
    config = lambda key, default='', cast=str: cast(os.environ.get(key, default))

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-dev-key-change-in-production-xyz123')

DEBUG = config('DEBUG', default='True', cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*' if DEBUG else 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'storages',
    # Local apps
    'apps.accounts',
    'apps.structure',
    'apps.members',
    'apps.events',
    'apps.announcements',
    'apps.reports',
    'apps.dashboard',
    'apps.scoring',
    'apps.admin_panel',
    'apps.bubbles',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database — SQLite for dev, PostgreSQL for production
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

_db_url = config('DATABASE_URL', default='')
if _db_url:
    import re
    m = re.match(
        r'postgresql://(?P<user>[^:]*):(?P<password>[^@]*)@(?P<host>[^:/]*):?(?P<port>\d*)/(?P<name>[^?]*)',
        _db_url,
    )
    if m:
        DATABASES['default'] = {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': m.group('name'),
            'USER': m.group('user'),
            'PASSWORD': m.group('password'),
            'HOST': m.group('host'),
            'PORT': m.group('port') or '5432',
        }

AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Lagos'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 25,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'EXCEPTION_HANDLER': 'apps.accounts.utils.custom_exception_handler',
}

# JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# Frontend URL (used for referral links, QR codes, redirects)
FRONTEND_URL = config('FRONTEND_URL', default='https://cityboyconnect.com')

# Backend/API URL (used for share links that need OG meta tags from Django)
BACKEND_URL = config('BACKEND_URL', default='https://api.cityboyconnect.com')

# CORS
CORS_ALLOWED_ORIGINS = [
	"https://cityboyconnect.com",
    "https://www.cityboyconnect.com",
    "http://localhost:5173",    # keep for local dev

    'http://localhost:5173',
    'http://127.0.0.1:5173',
]



CSRF_TRUSTED_ORIGINS = [
    "https://cityboyconnect.com",
    "https://www.cityboyconnect.com",
]

_extra_cors = config('CORS_EXTRA_ORIGINS', default='')
if _extra_cors:
    CORS_ALLOWED_ORIGINS += [o.strip() for o in _extra_cors.split(',') if o.strip()]

CORS_ALLOW_CREDENTIALS = True

# Celery
CELERY_BROKER_URL = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = CELERY_BROKER_URL

# SMS Config
# SMS_PROVIDER options: 'console' (dev — prints to terminal), 'africastalking' (production — sends real SMS)
SMS_PROVIDER = config('SMS_PROVIDER', default='console')
SMS_SENDER_ID = config('SMS_SENDER_ID', default='')

# Africa's Talking credentials (only needed when SMS_PROVIDER='africastalking')
AFRICASTALKING_USERNAME = config('AFRICASTALKING_USERNAME', default='cityboy')
AFRICASTALKING_API_KEY = config('AFRICASTALKING_API_KEY', default='')

# OneSignal
ONESIGNAL_APP_ID = config('ONESIGNAL_APP_ID', default='')
ONESIGNAL_REST_API_KEY = config('ONESIGNAL_REST_API_KEY', default='')

# OTP Settings
OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = 10
OTP_MAX_ATTEMPTS = 3
OTP_COOLDOWN_MINUTES = 60

# Security (production)
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

# Email backend
if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
    EMAIL_PORT = int(config('EMAIL_PORT', default='587'))
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
    EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')

DEFAULT_FROM_EMAIL = config(
    'DEFAULT_FROM_EMAIL',
    default='City Boy Connect <noreply@cityboyconnect.ng>',
)
