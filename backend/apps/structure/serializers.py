from rest_framework import serializers
from .models import GeopoliticalZone, State, LocalGovernment, Ward, PollingUnit


class GeopoliticalZoneSerializer(serializers.ModelSerializer):
    states_count = serializers.SerializerMethodField()

    class Meta:
        model = GeopoliticalZone
        fields = ['id', 'name', 'code', 'states_count']

    def get_states_count(self, obj):
        return obj.states.count()


class StateSerializer(serializers.ModelSerializer):
    zone_name = serializers.CharField(source='zone.name', read_only=True)
    lgas_count = serializers.SerializerMethodField()

    class Meta:
        model = State
        fields = ['id', 'name', 'code', 'zone', 'zone_name', 'lgas_count']

    def get_lgas_count(self, obj):
        return obj.lgas.count()


class LocalGovernmentSerializer(serializers.ModelSerializer):
    state_name = serializers.CharField(source='state.name', read_only=True)
    wards_count = serializers.SerializerMethodField()

    class Meta:
        model = LocalGovernment
        fields = ['id', 'name', 'state', 'state_name', 'wards_count']

    def get_wards_count(self, obj):
        return obj.wards.count()


class WardSerializer(serializers.ModelSerializer):
    lga_name = serializers.CharField(source='lga.name', read_only=True)

    class Meta:
        model = Ward
        fields = ['id', 'name', 'lga', 'lga_name', 'ward_code']


class PollingUnitSerializer(serializers.ModelSerializer):
    ward_name = serializers.CharField(source='ward.name', read_only=True)

    class Meta:
        model = PollingUnit
        fields = ['id', 'name', 'ward', 'ward_name', 'inec_code']
