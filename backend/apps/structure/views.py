from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import GeopoliticalZone, State, LocalGovernment, Ward, PollingUnit
from .serializers import (
    GeopoliticalZoneSerializer, StateSerializer,
    LocalGovernmentSerializer, WardSerializer, PollingUnitSerializer,
)


class ZoneListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    queryset = GeopoliticalZone.objects.all()
    serializer_class = GeopoliticalZoneSerializer
    pagination_class = None


class StateListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = StateSerializer
    pagination_class = None

    def get_queryset(self):
        qs = State.objects.select_related('zone').all()
        zone_id = self.request.query_params.get('zone')
        if zone_id:
            qs = qs.filter(zone_id=zone_id)
        return qs


class LGAListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = LocalGovernmentSerializer
    pagination_class = None

    def get_queryset(self):
        state_id = self.kwargs['state_id']
        return LocalGovernment.objects.filter(state_id=state_id).select_related('state')


class WardListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = WardSerializer
    pagination_class = None

    def get_queryset(self):
        lga_id = self.kwargs['lga_id']
        return Ward.objects.filter(lga_id=lga_id).select_related('lga')


class UnitListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = PollingUnitSerializer
    pagination_class = None

    def get_queryset(self):
        ward_id = self.kwargs['ward_id']
        return PollingUnit.objects.filter(ward_id=ward_id).select_related('ward')
