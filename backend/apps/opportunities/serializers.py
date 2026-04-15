from rest_framework import serializers
from django.utils.text import slugify
from .models import (
    Skill, ProfessionalProfile, TalentProfile, TalentPortfolioItem,
    BusinessListing, BusinessImage, JobListing, JobApplication, SavedJob,
)


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'slug']
        read_only_fields = ['id', 'slug']


# ─── Professional Profile ─────────────────────────────────────────

class ProfessionalProfileSerializer(serializers.ModelSerializer):
    skills = SkillSerializer(many=True, read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    profile_photo = serializers.ImageField(source='user.profile.profile_photo', read_only=True)
    state_name = serializers.CharField(source='user.profile.state.name', read_only=True, default='')
    lga_name = serializers.CharField(source='user.profile.lga.name', read_only=True, default='')
    membership_id = serializers.CharField(source='user.profile.membership_id', read_only=True, default='')
    cv_url = serializers.SerializerMethodField()

    class Meta:
        model = ProfessionalProfile
        fields = [
            'id', 'user_id', 'full_name', 'profile_photo', 'state_name',
            'lga_name', 'membership_id', 'headline', 'bio', 'education',
            'work_experience', 'skills', 'cv_file', 'cv_url', 'is_visible',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user_id', 'created_at', 'updated_at']

    def get_cv_url(self, obj):
        if obj.cv_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cv_file.url)
            return obj.cv_file.url
        return None


class ProfessionalProfileCreateUpdateSerializer(serializers.ModelSerializer):
    skills = serializers.ListField(child=serializers.CharField(), required=False, default=list)

    class Meta:
        model = ProfessionalProfile
        fields = [
            'headline', 'bio', 'education', 'work_experience',
            'skills', 'cv_file', 'is_visible',
        ]

    def validate_education(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Education must be a list.")
        for entry in value:
            if not isinstance(entry, dict):
                raise serializers.ValidationError("Each education entry must be an object.")
            if not entry.get('institution'):
                raise serializers.ValidationError("Institution is required for each education entry.")
        return value

    def validate_work_experience(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Work experience must be a list.")
        for entry in value:
            if not isinstance(entry, dict):
                raise serializers.ValidationError("Each work experience entry must be an object.")
            if not entry.get('company') or not entry.get('role'):
                raise serializers.ValidationError("Company and role are required.")
        return value

    def _save_skills(self, instance, skill_names):
        skills = []
        for name in skill_names:
            name = name.strip()
            if not name:
                continue
            skill, _ = Skill.objects.get_or_create(
                name__iexact=name,
                defaults={'name': name, 'slug': slugify(name)}
            )
            skills.append(skill)
        instance.skills.set(skills)

    def create(self, validated_data):
        skill_names = validated_data.pop('skills', [])
        instance = super().create(validated_data)
        self._save_skills(instance, skill_names)
        return instance

    def update(self, instance, validated_data):
        skill_names = validated_data.pop('skills', None)
        instance = super().update(instance, validated_data)
        if skill_names is not None:
            self._save_skills(instance, skill_names)
        return instance


# ─── Talent Profile ────────────────────────────────────────────────

class TalentPortfolioItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TalentPortfolioItem
        fields = ['id', 'title', 'description', 'image', 'created_at']
        read_only_fields = ['id', 'created_at']


class TalentProfileSerializer(serializers.ModelSerializer):
    portfolio_items = TalentPortfolioItemSerializer(many=True, read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    profile_photo = serializers.ImageField(source='user.profile.profile_photo', read_only=True)
    state_name = serializers.CharField(source='user.profile.state.name', read_only=True, default='')
    lga_name = serializers.CharField(source='user.profile.lga.name', read_only=True, default='')
    membership_id = serializers.CharField(source='user.profile.membership_id', read_only=True, default='')
    service_state_name = serializers.CharField(source='service_state.name', read_only=True, default='')
    service_lga_name = serializers.CharField(source='service_lga.name', read_only=True, default='')
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = TalentProfile
        fields = [
            'id', 'user_id', 'full_name', 'profile_photo', 'state_name',
            'lga_name', 'membership_id', 'category', 'category_display',
            'title', 'bio', 'years_of_experience', 'service_state',
            'service_state_name', 'service_lga', 'service_lga_name',
            'available_nationwide', 'show_phone', 'show_whatsapp',
            'whatsapp_number', 'portfolio_items', 'is_visible',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user_id', 'created_at', 'updated_at']


class TalentProfileCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TalentProfile
        fields = [
            'category', 'title', 'bio', 'years_of_experience',
            'service_state', 'service_lga', 'available_nationwide',
            'show_phone', 'show_whatsapp', 'whatsapp_number', 'is_visible',
        ]

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Title is required.")
        return value

    def validate_bio(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Bio is required.")
        return value


# ─── Business Listing ──────────────────────────────────────────────

class BusinessImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessImage
        fields = ['id', 'image', 'caption', 'created_at']
        read_only_fields = ['id', 'created_at']


class BusinessListingSerializer(serializers.ModelSerializer):
    images = BusinessImageSerializer(many=True, read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    profile_photo = serializers.ImageField(source='user.profile.profile_photo', read_only=True)
    state_name = serializers.CharField(source='state.name', read_only=True, default='')
    lga_name = serializers.CharField(source='lga.name', read_only=True, default='')
    membership_id = serializers.CharField(source='user.profile.membership_id', read_only=True, default='')
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = BusinessListing
        fields = [
            'id', 'user_id', 'full_name', 'profile_photo', 'membership_id',
            'name', 'category', 'category_display', 'description', 'address',
            'state', 'state_name', 'lga', 'lga_name', 'operates_nationwide',
            'phone', 'whatsapp', 'email', 'website', 'logo', 'images',
            'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user_id', 'created_at', 'updated_at']


class BusinessListingCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessListing
        fields = [
            'name', 'category', 'description', 'address', 'state', 'lga',
            'operates_nationwide', 'phone', 'whatsapp', 'email', 'website',
            'logo', 'is_active',
        ]

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Business name is required.")
        return value

    def validate_description(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Description is required.")
        return value


# ─── Job Listing ───────────────────────────────────────────────────

class JobListingSerializer(serializers.ModelSerializer):
    skills = SkillSerializer(many=True, read_only=True)
    posted_by_name = serializers.CharField(source='posted_by.full_name', read_only=True)
    posted_by_photo = serializers.SerializerMethodField()
    posted_by_membership_id = serializers.SerializerMethodField()
    state_name = serializers.CharField(source='state.name', read_only=True, default='')
    application_count = serializers.IntegerField(read_only=True)
    is_accepting_applications = serializers.BooleanField(read_only=True)
    has_applied = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    salary_display = serializers.SerializerMethodField()
    job_type_display = serializers.CharField(source='get_job_type_display', read_only=True)
    work_mode_display = serializers.CharField(source='get_work_mode_display', read_only=True)
    experience_level_display = serializers.CharField(source='get_experience_level_display', read_only=True)

    class Meta:
        model = JobListing
        fields = [
            'id', 'posted_by', 'posted_by_name', 'posted_by_photo',
            'posted_by_membership_id', 'title', 'company_name', 'description',
            'requirements', 'job_type', 'job_type_display', 'work_mode',
            'work_mode_display', 'experience_level', 'experience_level_display',
            'salary_min', 'salary_max', 'salary_currency', 'salary_period',
            'hide_salary', 'salary_display', 'location', 'state', 'state_name',
            'is_remote', 'skills', 'status', 'application_deadline',
            'application_email', 'application_url', 'application_count',
            'is_accepting_applications', 'has_applied', 'is_saved',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'posted_by', 'created_at', 'updated_at']

    def get_posted_by_photo(self, obj):
        profile = getattr(obj.posted_by, 'profile', None)
        if profile and profile.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(profile.profile_photo.url)
            return profile.profile_photo.url
        return None

    def get_posted_by_membership_id(self, obj):
        profile = getattr(obj.posted_by, 'profile', None)
        return profile.membership_id if profile else ''

    def get_has_applied(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return JobApplication.objects.filter(
                job=obj, applicant=request.user
            ).exists()
        return False

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return SavedJob.objects.filter(
                job=obj, user=request.user
            ).exists()
        return False

    def get_salary_display(self, obj):
        if obj.hide_salary:
            return 'Competitive'
        if obj.salary_min and obj.salary_max:
            return f'{obj.salary_currency} {obj.salary_min:,.0f} - {obj.salary_max:,.0f}/{obj.salary_period}'
        if obj.salary_min:
            return f'{obj.salary_currency} {obj.salary_min:,.0f}+/{obj.salary_period}'
        if obj.salary_max:
            return f'Up to {obj.salary_currency} {obj.salary_max:,.0f}/{obj.salary_period}'
        return 'Not specified'


class JobListingCreateUpdateSerializer(serializers.ModelSerializer):
    skills = serializers.ListField(child=serializers.CharField(), required=False, default=list)

    class Meta:
        model = JobListing
        fields = [
            'title', 'company_name', 'description', 'requirements',
            'job_type', 'work_mode', 'experience_level', 'salary_min',
            'salary_max', 'salary_currency', 'salary_period', 'hide_salary',
            'location', 'state', 'is_remote', 'skills', 'status',
            'application_deadline', 'application_email', 'application_url',
        ]

    def validate(self, data):
        salary_min = data.get('salary_min') or self.instance and self.instance.salary_min
        salary_max = data.get('salary_max') or self.instance and self.instance.salary_max
        if salary_min and salary_max and salary_min > salary_max:
            raise serializers.ValidationError({'salary_max': 'Maximum salary must be >= minimum salary.'})

        # Status transition validation
        if self.instance and 'status' in data:
            old_status = self.instance.status
            new_status = data['status']
            allowed_transitions = {
                'DRAFT': ['OPEN'],
                'OPEN': ['PAUSED', 'CLOSED'],
                'PAUSED': ['OPEN', 'CLOSED'],
                'CLOSED': [],
            }
            if new_status != old_status and new_status not in allowed_transitions.get(old_status, []):
                raise serializers.ValidationError({
                    'status': f'Cannot change status from {old_status} to {new_status}.'
                })
        return data

    def _save_skills(self, instance, skill_names):
        skills = []
        for name in skill_names:
            name = name.strip()
            if not name:
                continue
            skill, _ = Skill.objects.get_or_create(
                name__iexact=name,
                defaults={'name': name, 'slug': slugify(name)}
            )
            skills.append(skill)
        instance.skills.set(skills)

    def create(self, validated_data):
        skill_names = validated_data.pop('skills', [])
        instance = super().create(validated_data)
        self._save_skills(instance, skill_names)
        return instance

    def update(self, instance, validated_data):
        skill_names = validated_data.pop('skills', None)
        instance = super().update(instance, validated_data)
        if skill_names is not None:
            self._save_skills(instance, skill_names)
        return instance


# ─── Job Application ───────────────────────────────────────────────

class JobApplicationSerializer(serializers.ModelSerializer):
    applicant_name = serializers.CharField(source='applicant.full_name', read_only=True)
    applicant_photo = serializers.SerializerMethodField()
    applicant_headline = serializers.SerializerMethodField()
    applicant_membership_id = serializers.SerializerMethodField()
    cv_url = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = JobApplication
        fields = [
            'id', 'job', 'applicant', 'applicant_name', 'applicant_photo',
            'applicant_headline', 'applicant_membership_id', 'cover_letter',
            'cv_file', 'cv_url', 'use_profile_cv', 'status', 'status_display',
            'applied_at', 'updated_at',
        ]
        read_only_fields = ['id', 'job', 'applicant', 'applied_at', 'updated_at']

    def get_applicant_photo(self, obj):
        profile = getattr(obj.applicant, 'profile', None)
        if profile and profile.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(profile.profile_photo.url)
            return profile.profile_photo.url
        return None

    def get_applicant_headline(self, obj):
        prof = getattr(obj.applicant, 'professional_profile', None)
        return prof.headline if prof else ''

    def get_applicant_membership_id(self, obj):
        profile = getattr(obj.applicant, 'profile', None)
        return profile.membership_id if profile else ''

    def get_cv_url(self, obj):
        request = self.context.get('request')
        if obj.use_profile_cv:
            prof = getattr(obj.applicant, 'professional_profile', None)
            if prof and prof.cv_file:
                if request:
                    return request.build_absolute_uri(prof.cv_file.url)
                return prof.cv_file.url
        if obj.cv_file:
            if request:
                return request.build_absolute_uri(obj.cv_file.url)
            return obj.cv_file.url
        return None


class JobApplicationRecruiterSerializer(JobApplicationSerializer):
    """Extended serializer for recruiters - includes recruiter_notes."""
    class Meta(JobApplicationSerializer.Meta):
        fields = JobApplicationSerializer.Meta.fields + ['recruiter_notes']


class JobApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = ['cover_letter', 'cv_file', 'use_profile_cv']

    def validate(self, data):
        job = self.context.get('job')
        user = self.context.get('request').user
        if not job.is_accepting_applications:
            raise serializers.ValidationError("This job is no longer accepting applications.")
        if JobApplication.objects.filter(job=job, applicant=user).exists():
            raise serializers.ValidationError("You have already applied to this job.")
        return data


class JobApplicationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = ['status', 'recruiter_notes']

    def validate_status(self, value):
        if self.instance:
            old_status = self.instance.status
            allowed_transitions = {
                'APPLIED': ['REVIEWED', 'SHORTLISTED', 'REJECTED'],
                'REVIEWED': ['SHORTLISTED', 'REJECTED'],
                'SHORTLISTED': ['INTERVIEW', 'REJECTED'],
                'INTERVIEW': ['OFFERED', 'REJECTED'],
                'OFFERED': ['HIRED', 'REJECTED'],
                'HIRED': [],
                'REJECTED': [],
                'WITHDRAWN': [],
            }
            if value != old_status and value not in allowed_transitions.get(old_status, []):
                raise serializers.ValidationError(
                    f'Cannot change status from {old_status} to {value}.'
                )
        return value


# ─── Saved Job ─────────────────────────────────────────────────────

class SavedJobSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company_name', read_only=True)
    job_location = serializers.CharField(source='job.location', read_only=True)
    job_type = serializers.CharField(source='job.job_type', read_only=True)
    job_status = serializers.CharField(source='job.status', read_only=True)

    class Meta:
        model = SavedJob
        fields = [
            'id', 'job', 'job_title', 'company_name', 'job_location',
            'job_type', 'job_status', 'saved_at',
        ]
        read_only_fields = ['id', 'saved_at']
