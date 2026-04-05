import re
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, OTPVerification, normalize_phone


class RequestOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=15)

    def validate_phone_number(self, value):
        phone = normalize_phone(value)
        # Validate Nigerian phone format
        if not re.match(r'^\+234[789][01]\d{8}$', phone):
            raise serializers.ValidationError('Enter a valid Nigerian phone number.')
        return phone


class VerifyOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=15)
    otp_code = serializers.CharField(max_length=6, min_length=6)

    def validate_phone_number(self, value):
        return normalize_phone(value)

    def validate_otp_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError('OTP must be 6 digits.')
        return value


class UserSerializer(serializers.ModelSerializer):
    masked_phone = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'phone_number', 'masked_phone', 'email', 'full_name',
                  'is_verified', 'is_active', 'role', 'date_joined']
        read_only_fields = ['id', 'phone_number', 'is_verified', 'is_active', 'role', 'date_joined']

    def get_masked_phone(self, obj):
        return obj.mask_phone()


class UserPublicSerializer(serializers.ModelSerializer):
    """Serializer for public-facing user data (phone masked)."""
    phone = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'phone', 'full_name', 'role', 'date_joined']

    def get_phone(self, obj):
        return obj.mask_phone()
