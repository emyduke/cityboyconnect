from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404

from .models import (
    Skill, ProfessionalProfile, TalentProfile, TalentPortfolioItem,
    BusinessListing, BusinessImage, JobListing, JobApplication, SavedJob,
)
from .serializers import (
    SkillSerializer, ProfessionalProfileSerializer,
    ProfessionalProfileCreateUpdateSerializer, TalentProfileSerializer,
    TalentProfileCreateUpdateSerializer, TalentPortfolioItemSerializer,
    BusinessListingSerializer, BusinessListingCreateUpdateSerializer,
    BusinessImageSerializer, JobListingSerializer,
    JobListingCreateUpdateSerializer, JobApplicationSerializer,
    JobApplicationRecruiterSerializer, JobApplicationCreateSerializer,
    JobApplicationUpdateSerializer, SavedJobSerializer,
)
from .permissions import IsVerifiedMember


# ─── Skill / Category Helpers ─────────────────────────────────────

class SkillListView(generics.ListAPIView):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    pagination_class = None


class TalentCategoriesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cats = (
            TalentProfile.objects
            .filter(is_visible=True, user__is_active=True)
            .values('category')
            .annotate(count=Count('id'))
            .order_by('category')
        )
        result = []
        cat_dict = dict(TalentProfile.CATEGORY_CHOICES)
        for c in cats:
            result.append({
                'value': c['category'],
                'label': cat_dict.get(c['category'], c['category']),
                'count': c['count'],
            })
        return Response(result)


class BusinessCategoriesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cats = (
            BusinessListing.objects
            .filter(is_active=True, user__is_active=True)
            .values('category')
            .annotate(count=Count('id'))
            .order_by('category')
        )
        result = []
        cat_dict = dict(BusinessListing.BUSINESS_CATEGORY_CHOICES)
        for c in cats:
            result.append({
                'value': c['category'],
                'label': cat_dict.get(c['category'], c['category']),
                'count': c['count'],
            })
        return Response(result)


# ─── Professional Profile ─────────────────────────────────────────

class MyProfessionalProfileView(APIView):
    permission_classes = [IsAuthenticated, IsVerifiedMember]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        try:
            profile = ProfessionalProfile.objects.select_related(
                'user', 'user__profile', 'user__profile__state', 'user__profile__lga'
            ).prefetch_related('skills').get(user=request.user)
        except ProfessionalProfile.DoesNotExist:
            return Response({'detail': 'No professional profile found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProfessionalProfileSerializer(profile, context={'request': request}).data)

    def post(self, request):
        if ProfessionalProfile.objects.filter(user=request.user).exists():
            return Response({'detail': 'Professional profile already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = ProfessionalProfileCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(user=request.user)
        return Response(
            ProfessionalProfileSerializer(instance, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    def patch(self, request):
        profile = get_object_or_404(ProfessionalProfile, user=request.user)
        serializer = ProfessionalProfileCreateUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(ProfessionalProfileSerializer(instance, context={'request': request}).data)

    def put(self, request):
        return self.patch(request)

    def delete(self, request):
        profile = get_object_or_404(ProfessionalProfile, user=request.user)
        profile.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyTalentProfileView(APIView):
    permission_classes = [IsAuthenticated, IsVerifiedMember]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        try:
            profile = TalentProfile.objects.select_related(
                'user', 'user__profile', 'user__profile__state', 'user__profile__lga',
                'service_state', 'service_lga'
            ).prefetch_related('portfolio_items').get(user=request.user)
        except TalentProfile.DoesNotExist:
            return Response({'detail': 'No talent profile found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(TalentProfileSerializer(profile, context={'request': request}).data)

    def post(self, request):
        if TalentProfile.objects.filter(user=request.user).exists():
            return Response({'detail': 'Talent profile already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = TalentProfileCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(user=request.user)
        return Response(
            TalentProfileSerializer(instance, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    def patch(self, request):
        profile = get_object_or_404(TalentProfile, user=request.user)
        serializer = TalentProfileCreateUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(TalentProfileSerializer(instance, context={'request': request}).data)

    def put(self, request):
        return self.patch(request)

    def delete(self, request):
        profile = get_object_or_404(TalentProfile, user=request.user)
        profile.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TalentPortfolioView(APIView):
    permission_classes = [IsAuthenticated, IsVerifiedMember]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        profile = get_object_or_404(TalentProfile, user=request.user)
        if profile.portfolio_items.count() >= 6:
            return Response(
                {'detail': 'Maximum of 6 portfolio items allowed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = TalentPortfolioItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(talent_profile=profile)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, pk=None):
        profile = get_object_or_404(TalentProfile, user=request.user)
        item = get_object_or_404(TalentPortfolioItem, pk=pk, talent_profile=profile)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Business Listing ──────────────────────────────────────────────

class MyBusinessListingsView(APIView):
    permission_classes = [IsAuthenticated, IsVerifiedMember]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        listings = BusinessListing.objects.filter(user=request.user).select_related(
            'state', 'lga', 'user__profile'
        ).prefetch_related('images')
        return Response(BusinessListingSerializer(listings, many=True, context={'request': request}).data)

    def post(self, request):
        serializer = BusinessListingCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(user=request.user)
        return Response(
            BusinessListingSerializer(instance, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class MyBusinessListingDetailView(APIView):
    permission_classes = [IsAuthenticated, IsVerifiedMember]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_listing(self, request, pk):
        return get_object_or_404(
            BusinessListing.objects.select_related('state', 'lga', 'user__profile')
            .prefetch_related('images'),
            pk=pk, user=request.user,
        )

    def get(self, request, pk):
        return Response(BusinessListingSerializer(
            self._get_listing(request, pk), context={'request': request}
        ).data)

    def patch(self, request, pk):
        listing = self._get_listing(request, pk)
        serializer = BusinessListingCreateUpdateSerializer(listing, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(BusinessListingSerializer(instance, context={'request': request}).data)

    def put(self, request, pk):
        return self.patch(request, pk)

    def delete(self, request, pk):
        listing = self._get_listing(request, pk)
        listing.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class BusinessImageView(APIView):
    permission_classes = [IsAuthenticated, IsVerifiedMember]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        listing = get_object_or_404(BusinessListing, pk=pk, user=request.user)
        if listing.images.count() >= 8:
            return Response(
                {'detail': 'Maximum of 8 images allowed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = BusinessImageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(business=listing)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, pk, img_id=None):
        listing = get_object_or_404(BusinessListing, pk=pk, user=request.user)
        image = get_object_or_404(BusinessImage, pk=img_id, business=listing)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Directory / Search Views ─────────────────────────────────────

class ProfessionalDirectoryView(generics.ListAPIView):
    serializer_class = ProfessionalProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = ProfessionalProfile.objects.filter(
            is_visible=True, user__is_active=True,
            user__profile__voter_verification_status='VERIFIED',
        ).select_related(
            'user', 'user__profile', 'user__profile__state', 'user__profile__lga'
        ).prefetch_related('skills')

        search = self.request.query_params.get('search', '')
        if search:
            qs = qs.filter(
                Q(user__full_name__icontains=search) |
                Q(headline__icontains=search) |
                Q(skills__name__icontains=search)
            ).distinct()

        skill = self.request.query_params.get('skill', '')
        if skill:
            qs = qs.filter(skills__name__iexact=skill)

        state = self.request.query_params.get('state', '')
        if state:
            qs = qs.filter(user__profile__state_id=state)

        lga = self.request.query_params.get('lga', '')
        if lga:
            qs = qs.filter(user__profile__lga_id=lga)

        return qs


class TalentDirectoryView(generics.ListAPIView):
    serializer_class = TalentProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = TalentProfile.objects.filter(
            is_visible=True, user__is_active=True,
            user__profile__voter_verification_status='VERIFIED',
        ).select_related(
            'user', 'user__profile', 'user__profile__state', 'user__profile__lga',
            'service_state', 'service_lga'
        ).prefetch_related('portfolio_items')

        search = self.request.query_params.get('search', '')
        if search:
            qs = qs.filter(
                Q(user__full_name__icontains=search) |
                Q(title__icontains=search) |
                Q(bio__icontains=search)
            )

        category = self.request.query_params.get('category', '')
        if category:
            qs = qs.filter(category=category)

        state = self.request.query_params.get('state', '')
        if state:
            qs = qs.filter(
                Q(service_state_id=state) | Q(available_nationwide=True)
            )

        lga = self.request.query_params.get('lga', '')
        if lga:
            qs = qs.filter(
                Q(service_lga_id=lga) | Q(available_nationwide=True)
            )

        nationwide = self.request.query_params.get('available_nationwide', '')
        if nationwide and nationwide.lower() in ('true', '1'):
            qs = qs.filter(available_nationwide=True)

        return qs


class BusinessDirectoryView(generics.ListAPIView):
    serializer_class = BusinessListingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = BusinessListing.objects.filter(
            is_active=True, user__is_active=True,
            user__profile__voter_verification_status='VERIFIED',
        ).select_related(
            'state', 'lga', 'user', 'user__profile'
        ).prefetch_related('images')

        search = self.request.query_params.get('search', '')
        if search:
            qs = qs.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        category = self.request.query_params.get('category', '')
        if category:
            qs = qs.filter(category=category)

        state = self.request.query_params.get('state', '')
        if state:
            qs = qs.filter(Q(state_id=state) | Q(operates_nationwide=True))

        lga = self.request.query_params.get('lga', '')
        if lga:
            qs = qs.filter(Q(lga_id=lga) | Q(operates_nationwide=True))

        nationwide = self.request.query_params.get('operates_nationwide', '')
        if nationwide and nationwide.lower() in ('true', '1'):
            qs = qs.filter(operates_nationwide=True)

        return qs


class BusinessDetailView(generics.RetrieveAPIView):
    serializer_class = BusinessListingSerializer
    permission_classes = [IsAuthenticated]
    queryset = BusinessListing.objects.select_related(
        'state', 'lga', 'user', 'user__profile'
    ).prefetch_related('images')


class ProfileDetailView(APIView):
    """View any member's professional + talent profiles combined."""
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        data = {}
        try:
            pp = ProfessionalProfile.objects.select_related(
                'user', 'user__profile', 'user__profile__state', 'user__profile__lga'
            ).prefetch_related('skills').get(user_id=user_id, is_visible=True)
            data['professional'] = ProfessionalProfileSerializer(pp, context={'request': request}).data
        except ProfessionalProfile.DoesNotExist:
            data['professional'] = None

        try:
            tp = TalentProfile.objects.select_related(
                'user', 'user__profile', 'user__profile__state', 'user__profile__lga',
                'service_state', 'service_lga'
            ).prefetch_related('portfolio_items').get(user_id=user_id, is_visible=True)
            data['talent'] = TalentProfileSerializer(tp, context={'request': request}).data
        except TalentProfile.DoesNotExist:
            data['talent'] = None

        businesses = BusinessListing.objects.filter(
            user_id=user_id, is_active=True
        ).select_related('state', 'lga', 'user', 'user__profile').prefetch_related('images')
        data['businesses'] = BusinessListingSerializer(businesses, many=True, context={'request': request}).data

        return Response(data)


# ─── Job Listing Views ─────────────────────────────────────────────

class JobListView(generics.ListAPIView):
    serializer_class = JobListingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from django.utils import timezone
        qs = JobListing.objects.filter(status='OPEN').select_related(
            'posted_by', 'posted_by__profile', 'state'
        ).prefetch_related('skills')

        # Exclude expired
        qs = qs.filter(
            Q(application_deadline__isnull=True) |
            Q(application_deadline__gte=timezone.now().date())
        )

        search = self.request.query_params.get('search', '')
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(company_name__icontains=search) |
                Q(description__icontains=search)
            )

        job_type = self.request.query_params.get('job_type', '')
        if job_type:
            qs = qs.filter(job_type=job_type)

        work_mode = self.request.query_params.get('work_mode', '')
        if work_mode:
            qs = qs.filter(work_mode=work_mode)

        experience_level = self.request.query_params.get('experience_level', '')
        if experience_level:
            qs = qs.filter(experience_level=experience_level)

        skill = self.request.query_params.get('skill', '')
        if skill:
            qs = qs.filter(skills__name__iexact=skill)

        state = self.request.query_params.get('state', '')
        if state:
            qs = qs.filter(Q(state_id=state) | Q(is_remote=True))

        is_remote = self.request.query_params.get('is_remote', '')
        if is_remote and is_remote.lower() in ('true', '1'):
            qs = qs.filter(is_remote=True)

        return qs.distinct()


class JobDetailView(generics.RetrieveAPIView):
    serializer_class = JobListingSerializer
    permission_classes = [IsAuthenticated]
    queryset = JobListing.objects.select_related(
        'posted_by', 'posted_by__profile', 'state'
    ).prefetch_related('skills')


class MyJobListingsView(APIView):
    permission_classes = [IsAuthenticated, IsVerifiedMember]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        listings = JobListing.objects.filter(posted_by=request.user).select_related(
            'posted_by', 'posted_by__profile', 'state'
        ).prefetch_related('skills').annotate(
            app_count=Count('applications')
        )
        serializer = JobListingSerializer(listings, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = JobListingCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(posted_by=request.user)
        return Response(
            JobListingSerializer(instance, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class MyJobListingDetailView(APIView):
    permission_classes = [IsAuthenticated, IsVerifiedMember]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_listing(self, request, pk):
        return get_object_or_404(
            JobListing.objects.select_related('posted_by', 'posted_by__profile', 'state')
            .prefetch_related('skills'),
            pk=pk, posted_by=request.user,
        )

    def get(self, request, pk):
        return Response(JobListingSerializer(
            self._get_listing(request, pk), context={'request': request}
        ).data)

    def patch(self, request, pk):
        listing = self._get_listing(request, pk)
        serializer = JobListingCreateUpdateSerializer(listing, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(JobListingSerializer(instance, context={'request': request}).data)

    def put(self, request, pk):
        return self.patch(request, pk)

    def delete(self, request, pk):
        listing = self._get_listing(request, pk)
        if listing.status != 'DRAFT' and listing.applications.exists():
            return Response(
                {'detail': 'Cannot delete a job with existing applications.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        listing.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class JobListingStatusView(APIView):
    permission_classes = [IsAuthenticated, IsVerifiedMember]

    def post(self, request, pk):
        listing = get_object_or_404(JobListing, pk=pk, posted_by=request.user)
        new_status = request.data.get('status')
        allowed_transitions = {
            'DRAFT': ['OPEN'],
            'OPEN': ['PAUSED', 'CLOSED'],
            'PAUSED': ['OPEN', 'CLOSED'],
            'CLOSED': [],
        }
        if new_status not in allowed_transitions.get(listing.status, []):
            return Response(
                {'detail': f'Cannot change status from {listing.status} to {new_status}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        listing.status = new_status
        listing.save(update_fields=['status', 'updated_at'])
        return Response(JobListingSerializer(listing, context={'request': request}).data)


# ─── Job Application Views ────────────────────────────────────────

class JobApplyView(APIView):
    permission_classes = [IsAuthenticated, IsVerifiedMember]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, pk):
        job = get_object_or_404(JobListing, pk=pk)
        serializer = JobApplicationCreateSerializer(
            data=request.data,
            context={'request': request, 'job': job},
        )
        serializer.is_valid(raise_exception=True)
        application = serializer.save(job=job, applicant=request.user)
        return Response(
            JobApplicationSerializer(application, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class MyApplicationsView(generics.ListAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = JobApplication.objects.filter(
            applicant=self.request.user
        ).select_related('job', 'job__posted_by', 'applicant', 'applicant__profile')

        status_filter = self.request.query_params.get('status', '')
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs


class MyApplicationDetailView(generics.RetrieveAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JobApplication.objects.filter(
            applicant=self.request.user
        ).select_related('job', 'applicant', 'applicant__profile')


class WithdrawApplicationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        application = get_object_or_404(
            JobApplication, pk=pk, applicant=request.user
        )
        if application.status in ('WITHDRAWN', 'HIRED', 'REJECTED'):
            return Response(
                {'detail': 'Cannot withdraw this application.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        application.status = 'WITHDRAWN'
        application.save(update_fields=['status', 'updated_at'])
        return Response(JobApplicationSerializer(application, context={'request': request}).data)


class JobApplicationsView(generics.ListAPIView):
    """Recruiter view — list all applications for a specific job."""
    serializer_class = JobApplicationRecruiterSerializer
    permission_classes = [IsAuthenticated, IsVerifiedMember]

    def get_queryset(self):
        job = get_object_or_404(JobListing, pk=self.kwargs['job_id'], posted_by=self.request.user)
        qs = job.applications.select_related(
            'applicant', 'applicant__profile', 'applicant__professional_profile'
        )
        status_filter = self.request.query_params.get('status', '')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class JobApplicationDetailView(APIView):
    """Recruiter view — single application detail."""
    permission_classes = [IsAuthenticated, IsVerifiedMember]

    def get(self, request, job_id, pk):
        job = get_object_or_404(JobListing, pk=job_id, posted_by=request.user)
        application = get_object_or_404(
            JobApplication.objects.select_related(
                'applicant', 'applicant__profile', 'applicant__professional_profile'
            ),
            pk=pk, job=job,
        )
        return Response(JobApplicationRecruiterSerializer(application, context={'request': request}).data)

    def patch(self, request, job_id, pk):
        job = get_object_or_404(JobListing, pk=job_id, posted_by=request.user)
        application = get_object_or_404(JobApplication, pk=pk, job=job)
        serializer = JobApplicationUpdateSerializer(application, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(JobApplicationRecruiterSerializer(application, context={'request': request}).data)


# ─── Saved Jobs ────────────────────────────────────────────────────

class SaveJobView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        job = get_object_or_404(JobListing, pk=pk)
        saved, created = SavedJob.objects.get_or_create(user=request.user, job=job)
        if not created:
            saved.delete()
            return Response({'saved': False})
        return Response({'saved': True}, status=status.HTTP_201_CREATED)


class SavedJobsView(generics.ListAPIView):
    serializer_class = SavedJobSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavedJob.objects.filter(user=self.request.user).select_related(
            'job', 'job__posted_by'
        )
