from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import IntegrityError

from apps.accounts.utils import success_response, error_response
from apps.members.permissions import IsCoordinatorOrAbove, get_scoped_queryset
from .models import Event, EventAttendance
from .serializers import EventSerializer, EventCreateSerializer, EventAttendanceSerializer


class EventListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EventSerializer
    search_fields = ['title', 'venue_name']
    filterset_fields = ['state', 'lga', 'event_type', 'status', 'visibility']
    ordering_fields = ['start_datetime', 'created_at']

    def get_queryset(self):
        qs = Event.objects.select_related('organizer', 'state').all()
        return get_scoped_queryset(self.request.user, qs)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class EventCreateView(APIView):
    permission_classes = [IsCoordinatorOrAbove]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = EventCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = serializer.save(organizer=request.user)
        return success_response(
            EventSerializer(event, context={'request': request}).data,
            status_code=status.HTTP_201_CREATED,
        )


class EventDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EventSerializer
    queryset = Event.objects.select_related('organizer', 'state')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class EventUpdateView(APIView):
    permission_classes = [IsCoordinatorOrAbove]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request, pk):
        try:
            event = Event.objects.get(pk=pk)
        except Event.DoesNotExist:
            return error_response('Event not found.', code='NOT_FOUND',
                                  status_code=status.HTTP_404_NOT_FOUND)

        if event.organizer != request.user and request.user.role_level < 6:
            return error_response('You cannot edit this event.', code='FORBIDDEN',
                                  status_code=status.HTTP_403_FORBIDDEN)

        serializer = EventCreateSerializer(event, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(EventSerializer(event, context={'request': request}).data)


class EventDeleteView(APIView):
    permission_classes = [IsCoordinatorOrAbove]

    def delete(self, request, pk):
        try:
            event = Event.objects.get(pk=pk)
        except Event.DoesNotExist:
            return error_response('Event not found.', code='NOT_FOUND',
                                  status_code=status.HTTP_404_NOT_FOUND)

        if event.organizer != request.user and request.user.role_level < 6:
            return error_response('You cannot delete this event.', code='FORBIDDEN',
                                  status_code=status.HTTP_403_FORBIDDEN)

        event.delete()
        return success_response({'message': 'Event deleted.'})


class EventAttendView(APIView):
    """RSVP / self check-in."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            event = Event.objects.get(pk=pk)
        except Event.DoesNotExist:
            return error_response('Event not found.', code='NOT_FOUND',
                                  status_code=status.HTTP_404_NOT_FOUND)

        try:
            attendance = EventAttendance.objects.create(
                event=event, member=request.user, check_in_method='SELF',
            )
            return success_response(
                EventAttendanceSerializer(attendance).data,
                status_code=status.HTTP_201_CREATED,
            )
        except IntegrityError:
            return error_response('You are already checked in.', code='ALREADY_CHECKED_IN')


class EventCheckInView(APIView):
    """Check in a member by coordinator."""
    permission_classes = [IsCoordinatorOrAbove]

    def post(self, request, pk):
        try:
            event = Event.objects.get(pk=pk)
        except Event.DoesNotExist:
            return error_response('Event not found.', code='NOT_FOUND',
                                  status_code=status.HTTP_404_NOT_FOUND)

        member_id = request.data.get('member_id')
        if not member_id:
            return error_response('member_id is required.', code='MEMBER_REQUIRED')

        from apps.accounts.models import User
        try:
            member = User.objects.get(id=member_id)
        except User.DoesNotExist:
            return error_response('Member not found.', code='MEMBER_NOT_FOUND')

        try:
            attendance = EventAttendance.objects.create(
                event=event, member=member,
                check_in_method='MANUAL', checked_in_by=request.user,
            )
            return success_response(EventAttendanceSerializer(attendance).data,
                                    status_code=status.HTTP_201_CREATED)
        except IntegrityError:
            return error_response('Member already checked in.', code='ALREADY_CHECKED_IN')


class EventQRCheckInView(APIView):
    """QR code based check-in."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            event = Event.objects.get(pk=pk)
        except Event.DoesNotExist:
            return error_response('Event not found.', code='NOT_FOUND',
                                  status_code=status.HTTP_404_NOT_FOUND)

        try:
            attendance = EventAttendance.objects.create(
                event=event, member=request.user, check_in_method='QR',
            )
            return success_response(EventAttendanceSerializer(attendance).data,
                                    status_code=status.HTTP_201_CREATED)
        except IntegrityError:
            return error_response('Already checked in.', code='ALREADY_CHECKED_IN')


class EventAttendanceListView(generics.ListAPIView):
    permission_classes = [IsCoordinatorOrAbove]
    serializer_class = EventAttendanceSerializer

    def get_queryset(self):
        return EventAttendance.objects.filter(
            event_id=self.kwargs['pk']
        ).select_related('member')
