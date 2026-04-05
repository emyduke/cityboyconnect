from rest_framework import serializers
from .models import Announcement, AnnouncementRead


class AnnouncementSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    is_read = serializers.SerializerMethodField()
    read_count = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'body', 'author', 'author_name', 'target_scope',
            'target_zone', 'target_state', 'target_lga', 'target_ward',
            'priority', 'is_published', 'published_at', 'created_at',
            'is_read', 'read_count',
        ]
        read_only_fields = ['id', 'author', 'created_at']

    def get_is_read(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.reads.filter(user=request.user).exists()
        return False

    def get_read_count(self, obj):
        return obj.reads.count()


class AnnouncementCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = [
            'title', 'body', 'target_scope', 'target_zone', 'target_state',
            'target_lga', 'target_ward', 'priority', 'is_published',
        ]
