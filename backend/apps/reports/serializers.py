from rest_framework import serializers
from .models import GrassrootsReport


class GrassrootsReportSerializer(serializers.ModelSerializer):
    reporter_name = serializers.CharField(source='reporter.full_name', read_only=True)
    state_name = serializers.CharField(source='state.name', read_only=True, default='')
    level_display = serializers.CharField(source='get_report_level_display', read_only=True)

    class Meta:
        model = GrassrootsReport
        fields = [
            'id', 'reporter', 'reporter_name', 'report_period',
            'report_level', 'level_display', 'state', 'state_name', 'lga', 'ward',
            'summary_of_activities', 'membership_new', 'membership_total',
            'events_held', 'challenges', 'plans_next_period', 'support_needed',
            'media_highlights', 'status', 'submitted_at', 'created_at',
        ]
        read_only_fields = ['id', 'reporter', 'submitted_at', 'created_at']


class GrassrootsReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrassrootsReport
        fields = [
            'report_period', 'report_level', 'state', 'lga', 'ward',
            'summary_of_activities', 'membership_new', 'membership_total',
            'events_held', 'challenges', 'plans_next_period', 'support_needed',
            'media_highlights',
        ]
