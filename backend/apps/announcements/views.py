from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.accounts.utils import success_response, error_response
from apps.members.permissions import IsCoordinatorOrAbove
from .models import Announcement, AnnouncementRead
from .serializers import AnnouncementSerializer, AnnouncementCreateSerializer


class AnnouncementListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AnnouncementSerializer
    search_fields = ['title', 'body']
    filterset_fields = ['priority', 'target_scope']

    def get_queryset(self):
        user = self.request.user
        qs = Announcement.objects.filter(is_published=True).select_related('author')

        # Filter by user's scope
        try:
            profile = user.profile
        except Exception:
            return qs.filter(target_scope='ALL')

        q = Q(target_scope='ALL')
        if profile.state:
            q |= Q(target_scope='STATE', target_state=profile.state)
            if profile.state.zone:
                q |= Q(target_scope='ZONE', target_zone=profile.state.zone)
        if profile.lga:
            q |= Q(target_scope='LGA', target_lga=profile.lga)
        if profile.ward:
            q |= Q(target_scope='WARD', target_ward=profile.ward)

        return qs.filter(q)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class AnnouncementCreateView(APIView):
    permission_classes = [IsCoordinatorOrAbove]

    def post(self, request):
        serializer = AnnouncementCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        announcement = serializer.save(author=request.user)
        if announcement.is_published:
            announcement.published_at = timezone.now()
            announcement.save(update_fields=['published_at'])
        return success_response(
            AnnouncementSerializer(announcement, context={'request': request}).data,
            status_code=status.HTTP_201_CREATED,
        )


class AnnouncementDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AnnouncementSerializer
    queryset = Announcement.objects.select_related('author')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class AnnouncementReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            announcement = Announcement.objects.get(pk=pk)
        except Announcement.DoesNotExist:
            return error_response('Announcement not found.', code='NOT_FOUND',
                                  status_code=status.HTTP_404_NOT_FOUND)

        AnnouncementRead.objects.get_or_create(
            announcement=announcement, user=request.user,
        )
        return success_response({'message': 'Marked as read.'})
