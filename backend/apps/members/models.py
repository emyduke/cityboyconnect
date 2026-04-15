import secrets
import string
from django.db import models
from django.conf import settings


MEMBERSHIP_CATEGORIES = [
    ('ORDINARY', 'Ordinary'),
    ('VOLUNTEER', 'Volunteer'),
    ('COORDINATOR', 'Coordinator'),
    ('PATRON', 'Patron'),
]

GENDER_CHOICES = [
    ('M', 'Male'),
    ('F', 'Female'),
    ('O', 'Other'),
]

VOTER_STATUS_CHOICES = [
    ('PENDING', 'Pending'),
    ('VERIFIED', 'Verified'),
    ('REJECTED', 'Rejected'),
]


def generate_referral_code():
    chars = string.ascii_uppercase + string.digits
    return 'CBM' + ''.join(secrets.choice(chars) for _ in range(6))


def generate_qr_token():
    return secrets.token_urlsafe(32)


class MemberProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile'
    )

    # Political placement
    state = models.ForeignKey(
        'structure.State', on_delete=models.SET_NULL, null=True, blank=True, related_name='members'
    )
    lga = models.ForeignKey(
        'structure.LocalGovernment', on_delete=models.SET_NULL, null=True, blank=True, related_name='members'
    )
    ward = models.ForeignKey(
        'structure.Ward', on_delete=models.SET_NULL, null=True, blank=True, related_name='members'
    )
    polling_unit = models.ForeignKey(
        'structure.PollingUnit', on_delete=models.SET_NULL, null=True, blank=True, related_name='members'
    )

    # Personal info
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    occupation = models.CharField(max_length=200, blank=True)
    residential_address = models.TextField(blank=True)
    profile_photo = models.ImageField(upload_to='profiles/', blank=True)

    # Voter card verification
    voter_card_number = models.CharField(max_length=50, blank=True)
    voter_card_image = models.ImageField(upload_to='voter_cards/', blank=True)
    voter_verification_status = models.CharField(
        max_length=10, choices=VOTER_STATUS_CHOICES, default='PENDING'
    )
    voter_verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='verifications_done'
    )
    voter_verified_at = models.DateTimeField(null=True, blank=True)

    # APC membership
    apc_membership_number = models.CharField(max_length=50, blank=True)
    membership_category = models.CharField(
        max_length=20, choices=MEMBERSHIP_CATEGORIES, default='ORDINARY'
    )

    # Referral / QR system
    referral_code = models.CharField(max_length=20, unique=True, default=generate_referral_code)
    onboarding_qr_token = models.CharField(
        max_length=64, unique=True, default=generate_qr_token
    )
    referred_by = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='direct_referrals'
    )

    # Leader onboarding
    added_by_leader = models.BooleanField(default=False)
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='members_added'
    )

    # Membership
    membership_id = models.CharField(max_length=20, unique=True, blank=True)
    is_active = models.BooleanField(default=True)
    onboarding_step = models.PositiveSmallIntegerField(default=0)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'members'

    def __str__(self):
        return f'{self.user.full_name} - {self.membership_id or "No ID"}'

    def save(self, *args, **kwargs):
        if not self.membership_id and self.state:
            self.membership_id = self._generate_membership_id()
        super().save(*args, **kwargs)

    def _generate_membership_id(self):
        state_code = self.state.code[:3].upper() if self.state else 'XXX'
        count = MemberProfile.objects.filter(state=self.state).count() + 1
        return f'CBM-{state_code}-{count:05d}'

    @property
    def is_placement_complete(self):
        return bool(self.state and self.lga and self.ward)

    @property
    def is_onboarding_complete(self):
        return self.onboarding_step >= 3

    @property
    def referral_url(self):
        return f'/join?ref={self.onboarding_qr_token}'

    @property
    def total_network_size(self):
        count = 0
        for child in self.direct_referrals.all():
            count += 1 + child.total_network_size
        return count


class Leadership(models.Model):
    LEADERSHIP_POSITIONS = [
        ('STATE_DIRECTOR', 'State Director'),
        ('DEPUTY_STATE_DIRECTOR', 'Deputy State Director'),
        ('STATE_COORDINATOR', 'State Coordinator'),
        ('STATE_SECRETARY', 'State Secretary'),
        ('LGA_COORDINATOR', 'LGA Coordinator'),
        ('WARD_COORDINATOR', 'Ward Coordinator'),
        ('UNIT_LEADER', 'Unit Leader'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='leadership_roles'
    )
    position = models.CharField(max_length=30, choices=LEADERSHIP_POSITIONS)
    state = models.ForeignKey(
        'structure.State', on_delete=models.SET_NULL, null=True, blank=True
    )
    lga = models.ForeignKey(
        'structure.LocalGovernment', on_delete=models.SET_NULL, null=True, blank=True
    )
    ward = models.ForeignKey(
        'structure.Ward', on_delete=models.SET_NULL, null=True, blank=True
    )
    appointed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='appointments_made'
    )
    appointed_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    tenure_ends = models.DateField(null=True, blank=True)

    class Meta:
        app_label = 'members'

    def __str__(self):
        scope = self.state or self.lga or self.ward or 'National'
        return f'{self.user.full_name} - {self.get_position_display()} ({scope})'
