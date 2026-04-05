from django.contrib import admin
from .models import Announcement, AnnouncementRead


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'target_scope', 'priority', 'is_published', 'created_at']
    list_filter = ['target_scope', 'priority', 'is_published']
    search_fields = ['title']


@admin.register(AnnouncementRead)
class AnnouncementReadAdmin(admin.ModelAdmin):
    list_display = ['announcement', 'user', 'read_at']
