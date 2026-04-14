from django.contrib import admin
from .models import Bubble, BubbleImage


class BubbleImageInline(admin.TabularInline):
    model = BubbleImage
    extra = 0
    readonly_fields = ['uploaded_at', 'uploaded_by']


@admin.register(Bubble)
class BubbleAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'status', 'created_by', 'state', 'lga', 'created_at']
    list_filter = ['status', 'category', 'state', 'created_at']
    search_fields = ['title', 'description', 'created_by__full_name']
    readonly_fields = ['created_at', 'updated_at', 'reviewed_at']
    inlines = [BubbleImageInline]


@admin.register(BubbleImage)
class BubbleImageAdmin(admin.ModelAdmin):
    list_display = ['bubble', 'image_type', 'caption', 'uploaded_by', 'uploaded_at']
    list_filter = ['image_type']
