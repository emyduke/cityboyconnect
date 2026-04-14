from django.conf import settings
from django.db import models


class Bubble(models.Model):
    """A location-based support request created by a leader."""

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Review'
        IN_REVIEW = 'IN_REVIEW', 'In Review'
        APPROVED = 'APPROVED', 'Approved'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        DELIVERED = 'DELIVERED', 'Delivered'
        REJECTED = 'REJECTED', 'Rejected'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class Category(models.TextChoices):
        TOOLS = 'TOOLS', 'Tools & Equipment'
        OPPORTUNITIES = 'OPPORTUNITIES', 'Jobs & Opportunities'
        SERVICES = 'SERVICES', 'Services'
        SUPPORT = 'SUPPORT', 'Local Support'
        OTHER = 'OTHER', 'Other'

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bubbles_created',
    )

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.OTHER)

    contact_phone = models.CharField(max_length=20, help_text='Direct phone line')
    contact_whatsapp = models.CharField(max_length=20, help_text='WhatsApp number')

    state = models.ForeignKey('structure.State', on_delete=models.SET_NULL, null=True, blank=True)
    lga = models.ForeignKey('structure.LocalGovernment', on_delete=models.SET_NULL, null=True, blank=True)
    ward = models.ForeignKey('structure.Ward', on_delete=models.SET_NULL, null=True, blank=True)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    admin_notes = models.TextField(blank=True, default='', help_text='Internal notes from admin team')
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bubbles_reviewed',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    delivery_notes = models.TextField(blank=True, default='')
    delivered_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.get_status_display()})'


class BubbleImage(models.Model):
    """Photos attached to a bubble — either the request or the delivery proof."""

    class ImageType(models.TextChoices):
        REQUEST = 'REQUEST', 'Request Photo'
        DELIVERY = 'DELIVERY', 'Delivery Proof'

    bubble = models.ForeignKey(Bubble, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='bubbles/%Y/%m/')
    image_type = models.CharField(max_length=10, choices=ImageType.choices, default=ImageType.REQUEST)
    caption = models.CharField(max_length=255, blank=True, default='')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['uploaded_at']
