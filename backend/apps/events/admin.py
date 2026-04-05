from django.contrib import admin
from .models import Event, EventAttendance


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'event_type', 'state', 'start_datetime', 'status']
    list_filter = ['event_type', 'status', 'state']
    search_fields = ['title']


@admin.register(EventAttendance)
class EventAttendanceAdmin(admin.ModelAdmin):
    list_display = ['event', 'member', 'checked_in_at', 'check_in_method']
    list_filter = ['check_in_method']
