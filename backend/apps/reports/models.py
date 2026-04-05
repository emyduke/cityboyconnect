from django.db import models
from django.conf import settings


REPORT_LEVEL_CHOICES = [
    ('WARD', 'Ward'),
    ('LGA', 'LGA'),
    ('STATE', 'State'),
]

REPORT_STATUS_CHOICES = [
    ('DRAFT', 'Draft'),
    ('SUBMITTED', 'Submitted'),
    ('ACKNOWLEDGED', 'Acknowledged'),
    ('REVIEWED', 'Reviewed'),
]


class GrassrootsReport(models.Model):
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reports'
    )
    report_period = models.CharField(max_length=20)  # "2025-Q1" or "2025-04"

    # Scope
    report_level = models.CharField(max_length=10, choices=REPORT_LEVEL_CHOICES)
    state = models.ForeignKey(
        'structure.State', on_delete=models.SET_NULL, null=True, related_name='reports'
    )
    lga = models.ForeignKey(
        'structure.LocalGovernment', on_delete=models.SET_NULL, null=True, blank=True
    )
    ward = models.ForeignKey(
        'structure.Ward', on_delete=models.SET_NULL, null=True, blank=True
    )

    # Content
    summary_of_activities = models.TextField()
    membership_new = models.PositiveIntegerField(default=0)
    membership_total = models.PositiveIntegerField(default=0)
    events_held = models.PositiveIntegerField(default=0)
    challenges = models.TextField(blank=True)
    plans_next_period = models.TextField(blank=True)
    support_needed = models.TextField(blank=True)
    media_highlights = models.TextField(blank=True)

    # Status
    status = models.CharField(max_length=15, choices=REPORT_STATUS_CHOICES, default='DRAFT')
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'reports'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_report_level_display()} Report - {self.report_period}'
