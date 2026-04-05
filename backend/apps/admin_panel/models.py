from django.db import models
from django.conf import settings


class PlatformSettings(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.JSONField()
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    updated_at = models.DateTimeField(auto_now=True)
    description = models.TextField(blank=True)

    class Meta:
        app_label = 'admin_panel'
        verbose_name_plural = 'Platform Settings'

    def __str__(self):
        return self.key
