from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/structure/', include('apps.structure.urls')),
    path('api/v1/', include('apps.members.urls')),
    path('api/v1/events/', include('apps.events.urls')),
    path('api/v1/announcements/', include('apps.announcements.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    path('api/v1/dashboard/', include('apps.dashboard.urls')),
    path('api/v1/leaderboard/', include('apps.scoring.urls')),
    path('api/v1/admin/', include('apps.admin_panel.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
