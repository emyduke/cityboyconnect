from django.db import models
from django.conf import settings


SCOPE_CHOICES = [
    ('ALL', 'All Nigeria'),
    ('ZONE', 'Specific Zone'),
    ('STATE', 'Specific State'),
    ('LGA', 'Specific LGA'),
    ('WARD', 'Specific Ward'),
]

PRIORITY_CHOICES = [
    ('NORMAL', 'Normal'),
    ('IMPORTANT', 'Important'),
    ('URGENT', 'Urgent'),
]


class Announcement(models.Model):
    title = models.CharField(max_length=300)
    body = models.TextField()
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='announcements'
    )

    # Targeting
    target_scope = models.CharField(max_length=10, choices=SCOPE_CHOICES, default='ALL')
    target_zone = models.ForeignKey(
        'structure.GeopoliticalZone', on_delete=models.SET_NULL, null=True, blank=True
    )
    target_state = models.ForeignKey(
        'structure.State', on_delete=models.SET_NULL, null=True, blank=True
    )
    target_lga = models.ForeignKey(
        'structure.LocalGovernment', on_delete=models.SET_NULL, null=True, blank=True
    )
    target_ward = models.ForeignKey(
        'structure.Ward', on_delete=models.SET_NULL, null=True, blank=True
    )

    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='NORMAL')
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'announcements'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class AnnouncementRead(models.Model):
    announcement = models.ForeignKey(
        Announcement, on_delete=models.CASCADE, related_name='reads'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='announcement_reads'
    )
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'announcements'
        unique_together = ['announcement', 'user']
