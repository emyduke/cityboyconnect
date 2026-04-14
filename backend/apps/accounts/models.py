import re
import secrets
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


ROLE_CHOICES = [
    ('MEMBER', 'Member'),
    ('WARD_COORDINATOR', 'Ward Coordinator'),
    ('LGA_COORDINATOR', 'LGA Coordinator'),
    ('ZONAL_COORDINATOR', 'Zonal Coordinator'),
    ('STATE_DIRECTOR', 'State Director'),
    ('NATIONAL_OFFICER', 'National Officer'),
    ('SUPER_ADMIN', 'Super Admin'),
]

ROLE_HIERARCHY = {
    'SUPER_ADMIN': 10,
    'NATIONAL_OFFICER': 8,
    'STATE_DIRECTOR': 6,
    'LGA_COORDINATOR': 4,
    'WARD_COORDINATOR': 2,
    'ZONAL_COORDINATOR': 3,
    'MEMBER': 1,
}


def normalize_phone(phone):
    """Normalize Nigerian phone number to E.164 format (+234XXXXXXXXXX)."""
    phone = re.sub(r'[\s\-\(\)]', '', phone)
    if phone.startswith('0'):
        phone = '+234' + phone[1:]
    elif phone.startswith('234') and not phone.startswith('+'):
        phone = '+' + phone
    elif not phone.startswith('+'):
        phone = '+234' + phone
    return phone


class UserManager(BaseUserManager):
    def create_user(self, phone_number, full_name='', **extra_fields):
        if not phone_number:
            raise ValueError('Phone number is required')
        phone_number = normalize_phone(phone_number)
        user = self.model(phone_number=phone_number, full_name=full_name, **extra_fields)
        user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, full_name='Admin', **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'SUPER_ADMIN')
        extra_fields.setdefault('is_verified', True)
        user = self.create_user(phone_number, full_name, **extra_fields)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    phone_number = models.CharField(max_length=15, unique=True)
    email = models.EmailField(blank=True)
    full_name = models.CharField(max_length=200)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='MEMBER')
    has_password = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        app_label = 'accounts'

    def __str__(self):
        return f'{self.full_name} ({self.phone_number})'

    @property
    def role_level(self):
        return ROLE_HIERARCHY.get(self.role, 0)

    def mask_phone(self):
        """Return masked phone for list views."""
        if len(self.phone_number) >= 8:
            return self.phone_number[:4] + '****' + self.phone_number[-4:]
        return '****'


class OTPVerification(models.Model):
    SMS = 'SMS'
    EMAIL = 'EMAIL'
    CHANNEL_CHOICES = [
        (SMS, 'SMS'),
        (EMAIL, 'Email'),
    ]

    phone_number = models.CharField(max_length=15)
    email = models.EmailField(blank=True, default='')
    otp_code = models.CharField(max_length=6)
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES, default=SMS)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)

    class Meta:
        app_label = 'accounts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['phone_number', 'is_used', 'expires_at']),
        ]

    def __str__(self):
        return f'OTP for {self.phone_number}'

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @classmethod
    def generate(cls, phone_number):
        phone_number = normalize_phone(phone_number)
        otp_code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
        expires_at = timezone.now() + timezone.timedelta(minutes=10)
        otp = cls.objects.create(
            phone_number=phone_number,
            otp_code=otp_code,
            expires_at=expires_at,
        )
        return otp


class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=100)
    target_type = models.CharField(max_length=50, blank=True)
    target_id = models.PositiveIntegerField(null=True)
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'accounts'
        ordering = ['-created_at']
