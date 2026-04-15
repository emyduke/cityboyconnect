from django.contrib import admin
from .models import (
    Skill, ProfessionalProfile, TalentProfile, TalentPortfolioItem,
    BusinessListing, BusinessImage, JobListing, JobApplication, SavedJob,
)


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    search_fields = ['name']


@admin.register(ProfessionalProfile)
class ProfessionalProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'headline', 'is_visible', 'created_at']
    list_filter = ['is_visible']
    search_fields = ['user__full_name', 'headline']
    raw_id_fields = ['user']


@admin.register(TalentProfile)
class TalentProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'category', 'title', 'is_visible', 'created_at']
    list_filter = ['category', 'is_visible', 'available_nationwide']
    search_fields = ['user__full_name', 'title']
    raw_id_fields = ['user']


@admin.register(TalentPortfolioItem)
class TalentPortfolioItemAdmin(admin.ModelAdmin):
    list_display = ['title', 'talent_profile', 'created_at']
    raw_id_fields = ['talent_profile']


@admin.register(BusinessListing)
class BusinessListingAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'category', 'is_active', 'created_at']
    list_filter = ['category', 'is_active', 'operates_nationwide']
    search_fields = ['name', 'user__full_name']
    raw_id_fields = ['user']


@admin.register(BusinessImage)
class BusinessImageAdmin(admin.ModelAdmin):
    list_display = ['business', 'caption', 'created_at']
    raw_id_fields = ['business']


@admin.register(JobListing)
class JobListingAdmin(admin.ModelAdmin):
    list_display = ['title', 'company_name', 'status', 'posted_by', 'created_at']
    list_filter = ['status', 'job_type', 'work_mode', 'experience_level']
    search_fields = ['title', 'company_name', 'posted_by__full_name']
    raw_id_fields = ['posted_by']


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ['job', 'applicant', 'status', 'applied_at']
    list_filter = ['status']
    search_fields = ['job__title', 'applicant__full_name']
    raw_id_fields = ['job', 'applicant']


@admin.register(SavedJob)
class SavedJobAdmin(admin.ModelAdmin):
    list_display = ['user', 'job', 'saved_at']
    raw_id_fields = ['user', 'job']
