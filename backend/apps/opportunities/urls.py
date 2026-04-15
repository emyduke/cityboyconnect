from django.urls import path
from . import views

urlpatterns = [
    # Skills & categories
    path('skills/', views.SkillListView.as_view(), name='skill-list'),
    path('categories/', views.TalentCategoriesView.as_view(), name='talent-categories'),
    path('business-categories/', views.BusinessCategoriesView.as_view(), name='business-categories'),

    # Professional profile (my)
    path('professional/me/', views.MyProfessionalProfileView.as_view(), name='my-professional-profile'),

    # Talent profile (my)
    path('talent/me/', views.MyTalentProfileView.as_view(), name='my-talent-profile'),
    path('talent/me/portfolio/', views.TalentPortfolioView.as_view(), name='talent-portfolio-add'),
    path('talent/me/portfolio/<int:pk>/', views.TalentPortfolioView.as_view(), name='talent-portfolio-delete'),

    # Business listings (my)
    path('businesses/me/', views.MyBusinessListingsView.as_view(), name='my-business-listings'),
    path('businesses/me/<int:pk>/', views.MyBusinessListingDetailView.as_view(), name='my-business-listing-detail'),
    path('businesses/<int:pk>/images/', views.BusinessImageView.as_view(), name='business-image-add'),
    path('businesses/<int:pk>/images/<int:img_id>/', views.BusinessImageView.as_view(), name='business-image-delete'),

    # Directory / search
    path('professionals/', views.ProfessionalDirectoryView.as_view(), name='professional-directory'),
    path('talents/', views.TalentDirectoryView.as_view(), name='talent-directory'),
    path('businesses/', views.BusinessDirectoryView.as_view(), name='business-directory'),
    path('businesses/<int:pk>/', views.BusinessDetailView.as_view(), name='business-detail'),
    path('profile/<int:user_id>/', views.ProfileDetailView.as_view(), name='opportunity-profile'),

    # Jobs
    path('jobs/', views.JobListView.as_view(), name='job-list'),
    path('jobs/my-listings/', views.MyJobListingsView.as_view(), name='my-job-listings'),
    path('jobs/my-listings/<int:pk>/', views.MyJobListingDetailView.as_view(), name='my-job-listing-detail'),
    path('jobs/my-applications/', views.MyApplicationsView.as_view(), name='my-applications'),
    path('jobs/my-applications/<int:pk>/', views.MyApplicationDetailView.as_view(), name='my-application-detail'),
    path('jobs/my-applications/<int:pk>/withdraw/', views.WithdrawApplicationView.as_view(), name='withdraw-application'),
    path('jobs/saved/', views.SavedJobsView.as_view(), name='saved-jobs'),
    path('jobs/<int:pk>/', views.JobDetailView.as_view(), name='job-detail'),
    path('jobs/<int:pk>/apply/', views.JobApplyView.as_view(), name='job-apply'),
    path('jobs/<int:pk>/save/', views.SaveJobView.as_view(), name='job-save'),
    path('jobs/<int:pk>/status/', views.JobListingStatusView.as_view(), name='job-status'),
    path('jobs/<int:job_id>/applications/', views.JobApplicationsView.as_view(), name='job-applications'),
    path('jobs/<int:job_id>/applications/<int:pk>/', views.JobApplicationDetailView.as_view(), name='job-application-detail'),
]
