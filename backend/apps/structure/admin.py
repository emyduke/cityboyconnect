from django.contrib import admin
from .models import GeopoliticalZone, State, LocalGovernment, Ward, PollingUnit


@admin.register(GeopoliticalZone)
class ZoneAdmin(admin.ModelAdmin):
    list_display = ['name', 'code']


@admin.register(State)
class StateAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'zone']
    list_filter = ['zone']


@admin.register(LocalGovernment)
class LGAAdmin(admin.ModelAdmin):
    list_display = ['name', 'state']
    list_filter = ['state']
    search_fields = ['name']


@admin.register(Ward)
class WardAdmin(admin.ModelAdmin):
    list_display = ['name', 'lga', 'ward_code']
    list_filter = ['lga__state']
    search_fields = ['name']


@admin.register(PollingUnit)
class PollingUnitAdmin(admin.ModelAdmin):
    list_display = ['name', 'ward', 'inec_code']
    search_fields = ['name', 'inec_code']
