from rest_framework import serializers
from .models import Bubble, BubbleImage


class BubbleImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = BubbleImage
        fields = ['id', 'image', 'image_type', 'caption', 'uploaded_at']


class BubbleListSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    state_name = serializers.SerializerMethodField()
    lga_name = serializers.SerializerMethodField()
    ward_name = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    images_count = serializers.SerializerMethodField()

    class Meta:
        model = Bubble
        fields = [
            'id', 'title', 'category', 'category_display',
            'status', 'status_display',
            'state_name', 'lga_name', 'ward_name',
            'created_by_name', 'created_at', 'images_count',
        ]

    def get_state_name(self, obj):
        return obj.state.name if obj.state else ''

    def get_lga_name(self, obj):
        return obj.lga.name if obj.lga else ''

    def get_ward_name(self, obj):
        return obj.ward.name if obj.ward else ''

    def get_images_count(self, obj):
        return obj.images.count()


class BubbleDetailSerializer(BubbleListSerializer):
    images = BubbleImageSerializer(many=True, read_only=True)

    class Meta(BubbleListSerializer.Meta):
        fields = BubbleListSerializer.Meta.fields + [
            'description', 'contact_phone', 'contact_whatsapp',
            'delivery_notes', 'delivered_at', 'updated_at', 'images',
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user:
            is_creator = instance.created_by_id == request.user.id
            is_admin = getattr(request.user, 'role_level', 0) >= 6
            if not is_creator and not is_admin:
                data.pop('contact_phone', None)
                data.pop('contact_whatsapp', None)
        return data


class CreateBubbleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bubble
        fields = ['title', 'description', 'category', 'contact_phone', 'contact_whatsapp']

    def validate_title(self, value):
        if len(value) < 5:
            raise serializers.ValidationError('Title must be at least 5 characters.')
        return value

    def validate_description(self, value):
        if len(value) < 20:
            raise serializers.ValidationError('Description must be at least 20 characters.')
        return value


VALID_TRANSITIONS = {
    'PENDING': ['IN_REVIEW', 'REJECTED'],
    'IN_REVIEW': ['APPROVED', 'REJECTED'],
    'APPROVED': ['IN_PROGRESS'],
    'IN_PROGRESS': ['DELIVERED'],
}


class AdminBubbleStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Bubble.Status.choices)
    admin_notes = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_status(self, value):
        bubble = self.context.get('bubble')
        if bubble:
            allowed = VALID_TRANSITIONS.get(bubble.status, [])
            if value not in allowed:
                raise serializers.ValidationError(
                    f'Cannot transition from {bubble.get_status_display()} to {dict(Bubble.Status.choices).get(value)}.'
                )
        return value


class AdminBubbleDeliverySerializer(serializers.Serializer):
    delivery_notes = serializers.CharField(required=True)
