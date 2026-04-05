from django.contrib import admin
from .models import GrassrootsReport


@admin.register(GrassrootsReport)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['reporter', 'report_period', 'report_level', 'state', 'status', 'created_at']
    list_filter = ['report_level', 'status', 'state']
    search_fields = ['reporter__full_name', 'report_period']
