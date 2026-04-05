from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.accounts.utils import success_response, error_response
from apps.members.permissions import IsCoordinatorOrAbove, get_scoped_queryset
from .models import GrassrootsReport
from .serializers import GrassrootsReportSerializer, GrassrootsReportCreateSerializer


class ReportListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = GrassrootsReportSerializer
    filterset_fields = ['state', 'lga', 'report_level', 'status']
    ordering_fields = ['created_at', 'report_period']

    def get_queryset(self):
        qs = GrassrootsReport.objects.select_related('reporter', 'state').all()
        return get_scoped_queryset(self.request.user, qs)


class ReportCreateView(APIView):
    permission_classes = [IsCoordinatorOrAbove]

    def post(self, request):
        serializer = GrassrootsReportCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = serializer.save(reporter=request.user)
        return success_response(
            GrassrootsReportSerializer(report).data,
            status_code=status.HTTP_201_CREATED,
        )


class ReportDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = GrassrootsReportSerializer
    queryset = GrassrootsReport.objects.select_related('reporter', 'state')


class ReportUpdateView(APIView):
    permission_classes = [IsCoordinatorOrAbove]

    def patch(self, request, pk):
        try:
            report = GrassrootsReport.objects.get(pk=pk, reporter=request.user, status='DRAFT')
        except GrassrootsReport.DoesNotExist:
            return error_response(
                'Report not found or cannot be edited.',
                code='NOT_FOUND',
                status_code=status.HTTP_404_NOT_FOUND,
            )

        serializer = GrassrootsReportCreateSerializer(report, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(GrassrootsReportSerializer(report).data)


class ReportSubmitView(APIView):
    permission_classes = [IsCoordinatorOrAbove]

    def post(self, request, pk):
        try:
            report = GrassrootsReport.objects.get(pk=pk, reporter=request.user)
        except GrassrootsReport.DoesNotExist:
            return error_response('Report not found.', code='NOT_FOUND',
                                  status_code=status.HTTP_404_NOT_FOUND)

        if report.status != 'DRAFT':
            return error_response('Report already submitted.', code='ALREADY_SUBMITTED')

        report.status = 'SUBMITTED'
        report.submitted_at = timezone.now()
        report.save(update_fields=['status', 'submitted_at'])
        return success_response(GrassrootsReportSerializer(report).data)


class ReportAcknowledgeView(APIView):
    permission_classes = [IsCoordinatorOrAbove]

    def post(self, request, pk):
        try:
            report = GrassrootsReport.objects.get(pk=pk)
        except GrassrootsReport.DoesNotExist:
            return error_response('Report not found.', code='NOT_FOUND',
                                  status_code=status.HTTP_404_NOT_FOUND)

        if report.status not in ('SUBMITTED',):
            return error_response('Report cannot be acknowledged.', code='INVALID_STATUS')

        report.status = 'ACKNOWLEDGED'
        report.save(update_fields=['status'])
        return success_response(GrassrootsReportSerializer(report).data)
