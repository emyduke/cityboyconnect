from rest_framework import serializers
from .models import Event, EventAttendance
from apps.accounts.serializers import UserPublicSerializer


class EventSerializer(serializers.ModelSerializer):
    organizer_name = serializers.CharField(source='organizer.full_name', read_only=True)
    state_name = serializers.CharField(source='state.name', read_only=True, default='')
    attendance_count = serializers.IntegerField(read_only=True)
    is_attending = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'event_type', 'organizer', 'organizer_name',
            'state', 'state_name', 'lga', 'ward', 'venue_name', 'venue_address',
            'start_datetime', 'end_datetime', 'status', 'banner_image', 'visibility',
            'attendance_count', 'is_attending', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'organizer', 'created_at', 'updated_at']

    def get_is_attending(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.attendances.filter(member=request.user).exists()
        return False


class EventCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            'title', 'description', 'event_type', 'state', 'lga', 'ward',
            'venue_name', 'venue_address', 'start_datetime', 'end_datetime',
            'banner_image', 'visibility',
        ]


class EventAttendanceSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    member_phone = serializers.SerializerMethodField()

    class Meta:
        model = EventAttendance
        fields = ['id', 'event', 'member', 'member_name', 'member_phone',
                  'checked_in_at', 'check_in_method']

    def get_member_phone(self, obj):
        return obj.member.mask_phone()
