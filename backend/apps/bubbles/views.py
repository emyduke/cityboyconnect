from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.db.models import Q

from apps.accounts.utils import success_response, error_response
from apps.accounts.models import ROLE_HIERARCHY
from apps.members.permissions import get_scoped_queryset
from apps.admin_panel.permissions import IsAdminUser
from apps.admin_panel.audit import log_action
from .models import Bubble, BubbleImage
from .serializers import (
    BubbleListSerializer,
    BubbleDetailSerializer,
    BubbleImageSerializer,
    CreateBubbleSerializer,
    AdminBubbleStatusSerializer,
    AdminBubbleDeliverySerializer,
)


class BubblePagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


# ── MEMBER-FACING ───────────────────────────────────────────────────────────

class BubbleListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BubbleListSerializer
    pagination_class = BubblePagination
    filterset_fields = ['category', 'status', 'state', 'lga', 'ward']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'status', 'category']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Bubble.objects.select_related('created_by', 'state', 'lga', 'ward').all()
        return get_scoped_queryset(self.request.user, qs)


class BubbleDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            bubble = Bubble.objects.select_related(
                'created_by', 'state', 'lga', 'ward'
            ).prefetch_related('images').get(pk=pk)
        except Bubble.DoesNotExist:
            return error_response('Bubble not found.', code='NOT_FOUND',
                                  status_code=status.HTTP_404_NOT_FOUND)
        return success_response(
            BubbleDetailSerializer(bubble, context={'request': request}).data
        )


class CreateBubbleView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        if ROLE_HIERARCHY.get(request.user.role, 0) < ROLE_HIERARCHY.get('WARD_COORDINATOR', 2):
            return error_response(
                'Only leaders (Ward Coordinator and above) can create bubbles.',
                code='FORBIDDEN',
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = CreateBubbleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile = getattr(request.user, 'profile', None)
        bubble = serializer.save(
            created_by=request.user,
            state=getattr(profile, 'state', None),
            lga=getattr(profile, 'lga', None),
            ward=getattr(profile, 'ward', None),
        )

        images = request.FILES.getlist('images')
        for img in images[:5]:
            BubbleImage.objects.create(
                bubble=bubble,
                image=img,
                image_type='REQUEST',
                uploaded_by=request.user,
            )

        return success_response(
            BubbleDetailSerializer(bubble, context={'request': request}).data,
            status_code=status.HTTP_201_CREATED,
        )


class MyBubblesView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BubbleListSerializer
    pagination_class = BubblePagination
    filterset_fields = ['category', 'status']
    search_fields = ['title', 'description']
    ordering = ['-created_at']

    def get_queryset(self):
        return Bubble.objects.select_related(
            'created_by', 'state', 'lga', 'ward'
        ).filter(created_by=self.request.user)


class BubbleAddImageView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        try:
            bubble = Bubble.objects.get(pk=pk)
        except Bubble.DoesNotExist:
            return error_response('Bubble not found.', code='NOT_FOUND',
                                  status_code=status.HTTP_404_NOT_FOUND)

        if bubble.created_by_id != request.user.id:
            return error_response('You can only add images to your own bubbles.',
                                  code='FORBIDDEN',
                                  status_code=status.HTTP_403_FORBIDDEN)

        if bubble.status not in ('PENDING', 'IN_REVIEW'):
            return error_response('Cannot add images to a bubble in this status.',
                                  code='INVALID_STATUS',
                                  status_code=status.HTTP_400_BAD_REQUEST)

        image = request.FILES.get('image')
        if not image:
            return error_response('Image file is required.', code='MISSING_IMAGE')

        caption = request.data.get('caption', '')
        obj = BubbleImage.objects.create(
            bubble=bubble,
            image=image,
            image_type='REQUEST',
            caption=caption,
            uploaded_by=request.user,
        )
        return success_response(
            BubbleImageSerializer(obj).data,
            status_code=status.HTTP_201_CREATED,
        )


# ── ADMIN ───────────────────────────────────────────────────────────────────

class AdminBubbleListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = Bubble.objects.select_related('created_by', 'state', 'lga', 'ward').all()

        # Scope by admin role
        user = request.user
        role = user.role
        if role not in ('SUPER_ADMIN', 'NATIONAL_OFFICER'):
            profile = getattr(user, 'profile', None)
            if profile and profile.state:
                qs = qs.filter(state=profile.state)
            else:
                qs = qs.none()

        # Filters
        fstatus = request.query_params.get('status')
        if fstatus:
            qs = qs.filter(status=fstatus)
        category = request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        created_by = request.query_params.get('created_by')
        if created_by:
            qs = qs.filter(created_by_id=created_by)
        created_after = request.query_params.get('created_after')
        if created_after:
            qs = qs.filter(created_at__date__gte=created_after)
        created_before = request.query_params.get('created_before')
        if created_before:
            qs = qs.filter(created_at__date__lte=created_before)
        search = request.query_params.get('search')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))

        qs = qs.order_by('-created_at')

        stats = {
            'pending_count': qs.filter(status='PENDING').count(),
            'in_review_count': qs.filter(status='IN_REVIEW').count(),
            'approved_count': qs.filter(status='APPROVED').count(),
            'in_progress_count': qs.filter(status='IN_PROGRESS').count(),
            'delivered_count': qs.filter(status='DELIVERED').count(),
            'total_count': qs.count(),
        }

        paginator = BubblePagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = BubbleListSerializer(page, many=True)

        return success_response({
            'stats': stats,
            'count': paginator.page.paginator.count,
            'results': serializer.data,
        })


class AdminBubbleDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            bubble = Bubble.objects.select_related(
                'created_by', 'state', 'lga', 'ward', 'reviewed_by'
            ).prefetch_related('images').get(pk=pk)
        except Bubble.DoesNotExist:
            return error_response('Bubble not found.', code='NOT_FOUND',
                                  status_code=status.HTTP_404_NOT_FOUND)

        data = BubbleDetailSerializer(bubble, context={'request': request}).data
        data['admin_notes'] = bubble.admin_notes
        data['reviewed_by_name'] = bubble.reviewed_by.full_name if bubble.reviewed_by else None
        data['reviewed_at'] = bubble.reviewed_at.isoformat() if bubble.reviewed_at else None
        return success_response(data)


class AdminBubbleStatusView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            bubble = Bubble.objects.get(pk=pk)
        except Bubble.DoesNotExist:
            return error_response('Bubble not found.', code='NOT_FOUND',
                                  status_code=status.HTTP_404_NOT_FOUND)

        serializer = AdminBubbleStatusSerializer(
            data=request.data, context={'bubble': bubble}
        )
        serializer.is_valid(raise_exception=True)

        old_status = bubble.status
        bubble.status = serializer.validated_data['status']
        if serializer.validated_data.get('admin_notes'):
            bubble.admin_notes = serializer.validated_data['admin_notes']
        if not bubble.reviewed_by:
            bubble.reviewed_by = request.user
            bubble.reviewed_at = timezone.now()
        bubble.save()

        log_action(
            performed_by=request.user,
            action='BUBBLE_STATUS_CHANGE',
            target=bubble,
            before_state={'status': old_status},
            after_state={'status': bubble.status},
            request=request,
            notes=f'Bubble #{bubble.id} {old_status} → {bubble.status}',
        )

        return success_response({'status': bubble.status, 'status_display': bubble.get_status_display()})


class AdminBubbleDeliveryView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, pk):
        try:
            bubble = Bubble.objects.get(pk=pk)
        except Bubble.DoesNotExist:
            return error_response('Bubble not found.', code='NOT_FOUND',
                                  status_code=status.HTTP_404_NOT_FOUND)

        if bubble.status != 'IN_PROGRESS':
            return error_response(
                'Bubble must be In Progress to mark as delivered.',
                code='INVALID_STATUS',
            )

        serializer = AdminBubbleDeliverySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        bubble.delivery_notes = serializer.validated_data['delivery_notes']
        bubble.delivered_at = timezone.now()
        bubble.status = 'DELIVERED'
        bubble.save()

        delivery_images = request.FILES.getlist('delivery_images')
        for img in delivery_images[:10]:
            BubbleImage.objects.create(
                bubble=bubble,
                image=img,
                image_type='DELIVERY',
                uploaded_by=request.user,
            )

        log_action(
            performed_by=request.user,
            action='BUBBLE_DELIVERED',
            target=bubble,
            after_state={'status': 'DELIVERED'},
            request=request,
            notes=f'Bubble #{bubble.id} delivered',
        )

        return success_response(
            BubbleDetailSerializer(bubble, context={'request': request}).data
        )
