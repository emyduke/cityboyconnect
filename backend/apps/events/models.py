from django.db import models
from django.conf import settings


EVENT_TYPE_CHOICES = [
    ('RALLY', 'Rally'),
    ('TOWN_HALL', 'Town Hall'),
    ('TRAINING', 'Training'),
    ('MEETING', 'Meeting'),
    ('OUTREACH', 'Community Outreach'),
    ('OTHER', 'Other'),
]

EVENT_STATUS_CHOICES = [
    ('UPCOMING', 'Upcoming'),
    ('ONGOING', 'Ongoing'),
    ('COMPLETED', 'Completed'),
    ('CANCELLED', 'Cancelled'),
]

VISIBILITY_CHOICES = [
    ('ALL', 'All Members'),
    ('STATE', 'State Only'),
    ('LGA', 'LGA Only'),
    ('WARD', 'Ward Only'),
]

CHECKIN_METHOD_CHOICES = [
    ('QR', 'QR Scan'),
    ('MANUAL', 'Manual'),
    ('SELF', 'Self Check-in'),
]


class Event(models.Model):
    title = models.CharField(max_length=300)
    description = models.TextField()
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES)
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='organized_events'
    )

    # Location
    state = models.ForeignKey(
        'structure.State', on_delete=models.SET_NULL, null=True, related_name='events'
    )
    lga = models.ForeignKey(
        'structure.LocalGovernment', on_delete=models.SET_NULL, null=True, blank=True
    )
    ward = models.ForeignKey(
        'structure.Ward', on_delete=models.SET_NULL, null=True, blank=True
    )
    venue_name = models.CharField(max_length=300)
    venue_address = models.TextField(blank=True)

    # Timing
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField(null=True, blank=True)

    # Status
    status = models.CharField(max_length=20, choices=EVENT_STATUS_CHOICES, default='UPCOMING')

    # Media
    banner_image = models.ImageField(upload_to='events/', blank=True)

    # Visibility
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='ALL')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'events'
        ordering = ['-start_datetime']

    def __str__(self):
        return self.title

    @property
    def attendance_count(self):
        return self.attendances.count()


class EventAttendance(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='attendances')
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='event_attendances'
    )
    checked_in_at = models.DateTimeField(auto_now_add=True)
    check_in_method = models.CharField(max_length=10, choices=CHECKIN_METHOD_CHOICES, default='SELF')
    checked_in_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='checkins_done'
    )

    class Meta:
        app_label = 'events'
        unique_together = ['event', 'member']

    def __str__(self):
        return f'{self.member.full_name} at {self.event.title}'
