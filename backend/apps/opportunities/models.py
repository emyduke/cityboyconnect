from django.db import models
from django.conf import settings
from django.utils.text import slugify


class Skill(models.Model):
    """Reusable skill tags for professional profiles and job listings."""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class ProfessionalProfile(models.Model):
    """CV/professional profile for a member."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='professional_profile'
    )
    headline = models.CharField(max_length=200, blank=True)
    bio = models.TextField(blank=True, max_length=1000)

    education = models.JSONField(default=list, blank=True)
    work_experience = models.JSONField(default=list, blank=True)

    skills = models.ManyToManyField('Skill', blank=True, related_name='professionals')

    cv_file = models.FileField(upload_to='opportunities/cvs/', blank=True, null=True)

    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.full_name} - Professional Profile'


class TalentProfile(models.Model):
    """Talent/creative/trade profile for a member."""
    CATEGORY_CHOICES = [
        ('PHOTOGRAPHY', 'Photography'),
        ('VIDEOGRAPHY', 'Videography'),
        ('GRAPHIC_DESIGN', 'Graphic Design'),
        ('WEB_DEVELOPMENT', 'Web Development'),
        ('MUSIC', 'Music'),
        ('DJ', 'DJ'),
        ('MC', 'MC/Host'),
        ('FASHION', 'Fashion/Tailoring'),
        ('BARBING', 'Barbing/Hairstyling'),
        ('MAKEUP', 'Makeup'),
        ('CATERING', 'Catering/Food'),
        ('MECHANIC', 'Mechanic/Auto'),
        ('ELECTRICAL', 'Electrical'),
        ('PLUMBING', 'Plumbing'),
        ('CARPENTRY', 'Carpentry'),
        ('LEGAL', 'Legal Services'),
        ('ACCOUNTING', 'Accounting/Tax'),
        ('HEALTH', 'Health/Medical'),
        ('TEACHING', 'Teaching/Tutoring'),
        ('FITNESS', 'Fitness/Sports'),
        ('WRITING', 'Writing/Content'),
        ('MARKETING', 'Marketing/PR'),
        ('EVENT_PLANNING', 'Event Planning'),
        ('DRIVING', 'Driving/Logistics'),
        ('OTHER', 'Other'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='talent_profile'
    )
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=200)
    bio = models.TextField(max_length=1000)
    years_of_experience = models.PositiveIntegerField(default=0)

    service_state = models.ForeignKey(
        'structure.State', on_delete=models.SET_NULL, null=True, blank=True
    )
    service_lga = models.ForeignKey(
        'structure.LocalGovernment', on_delete=models.SET_NULL, null=True, blank=True
    )
    available_nationwide = models.BooleanField(default=False)

    show_phone = models.BooleanField(default=False)
    show_whatsapp = models.BooleanField(default=True)
    whatsapp_number = models.CharField(max_length=20, blank=True)

    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.full_name} - {self.title}'


class TalentPortfolioItem(models.Model):
    """Sample work/portfolio piece for a talent profile."""
    talent_profile = models.ForeignKey(
        TalentProfile, on_delete=models.CASCADE, related_name='portfolio_items'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, max_length=500)
    image = models.ImageField(upload_to='opportunities/portfolio/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class BusinessListing(models.Model):
    """Business or service listing by a member."""
    BUSINESS_CATEGORY_CHOICES = [
        ('RETAIL', 'Retail/Shop'),
        ('FOOD', 'Food & Restaurant'),
        ('FASHION', 'Fashion & Clothing'),
        ('TECH', 'Technology & IT'),
        ('HEALTH', 'Health & Wellness'),
        ('BEAUTY', 'Beauty & Grooming'),
        ('EDUCATION', 'Education & Training'),
        ('LOGISTICS', 'Logistics & Transport'),
        ('AGRICULTURE', 'Agriculture & Farming'),
        ('MEDIA', 'Media & Entertainment'),
        ('CONSTRUCTION', 'Construction & Real Estate'),
        ('FINANCE', 'Finance & Insurance'),
        ('LEGAL', 'Legal Services'),
        ('AUTO', 'Auto & Mechanic'),
        ('HOME_SERVICES', 'Home Services'),
        ('EVENT_SERVICES', 'Event Services'),
        ('CONSULTING', 'Consulting'),
        ('OTHER', 'Other'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='business_listings'
    )
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=30, choices=BUSINESS_CATEGORY_CHOICES)
    description = models.TextField(max_length=2000)

    address = models.TextField(max_length=500, blank=True)
    state = models.ForeignKey(
        'structure.State', on_delete=models.SET_NULL, null=True, blank=True
    )
    lga = models.ForeignKey(
        'structure.LocalGovernment', on_delete=models.SET_NULL, null=True, blank=True
    )
    operates_nationwide = models.BooleanField(default=False)

    phone = models.CharField(max_length=20, blank=True)
    whatsapp = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)

    logo = models.ImageField(upload_to='opportunities/businesses/logos/', blank=True, null=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class BusinessImage(models.Model):
    """Photos for a business listing."""
    business = models.ForeignKey(
        BusinessListing, on_delete=models.CASCADE, related_name='images'
    )
    image = models.ImageField(upload_to='opportunities/businesses/gallery/')
    caption = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.business.name} - Image'


class JobListing(models.Model):
    """A job posting by a member or organization."""
    JOB_TYPE_CHOICES = [
        ('FULL_TIME', 'Full Time'),
        ('PART_TIME', 'Part Time'),
        ('CONTRACT', 'Contract'),
        ('FREELANCE', 'Freelance'),
        ('INTERNSHIP', 'Internship'),
        ('VOLUNTEER', 'Volunteer'),
    ]

    WORK_MODE_CHOICES = [
        ('ONSITE', 'On-site'),
        ('REMOTE', 'Remote'),
        ('HYBRID', 'Hybrid'),
    ]

    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('OPEN', 'Open'),
        ('PAUSED', 'Paused'),
        ('CLOSED', 'Closed'),
    ]

    EXPERIENCE_LEVEL_CHOICES = [
        ('ENTRY', 'Entry Level'),
        ('MID', 'Mid Level'),
        ('SENIOR', 'Senior Level'),
        ('LEAD', 'Lead/Manager'),
        ('ANY', 'Any Level'),
    ]

    posted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='job_listings'
    )

    title = models.CharField(max_length=200)
    company_name = models.CharField(max_length=200)
    description = models.TextField(max_length=5000)
    requirements = models.TextField(max_length=3000, blank=True)

    job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES)
    work_mode = models.CharField(max_length=10, choices=WORK_MODE_CHOICES, default='ONSITE')
    experience_level = models.CharField(max_length=10, choices=EXPERIENCE_LEVEL_CHOICES, default='ANY')

    salary_min = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    salary_currency = models.CharField(max_length=5, default='NGN')
    salary_period = models.CharField(
        max_length=10, default='monthly',
        choices=[('hourly', 'Hourly'), ('monthly', 'Monthly'), ('yearly', 'Yearly')]
    )
    hide_salary = models.BooleanField(default=False)

    location = models.CharField(max_length=200, blank=True)
    state = models.ForeignKey(
        'structure.State', on_delete=models.SET_NULL, null=True, blank=True
    )
    is_remote = models.BooleanField(default=False)

    skills = models.ManyToManyField('Skill', blank=True, related_name='job_listings')

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='DRAFT')
    application_deadline = models.DateField(null=True, blank=True)
    application_email = models.EmailField(blank=True)
    application_url = models.URLField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} at {self.company_name}'

    @property
    def is_accepting_applications(self):
        from django.utils import timezone
        if self.status != 'OPEN':
            return False
        if self.application_deadline and self.application_deadline < timezone.now().date():
            return False
        return True

    @property
    def application_count(self):
        return self.applications.count()


class JobApplication(models.Model):
    """An application from a member to a job listing."""
    STATUS_CHOICES = [
        ('APPLIED', 'Applied'),
        ('REVIEWED', 'Reviewed'),
        ('SHORTLISTED', 'Shortlisted'),
        ('INTERVIEW', 'Interview'),
        ('OFFERED', 'Offered'),
        ('HIRED', 'Hired'),
        ('REJECTED', 'Rejected'),
        ('WITHDRAWN', 'Withdrawn'),
    ]

    job = models.ForeignKey(
        JobListing, on_delete=models.CASCADE, related_name='applications'
    )
    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='job_applications'
    )

    cover_letter = models.TextField(max_length=3000, blank=True)
    cv_file = models.FileField(upload_to='opportunities/job_applications/', blank=True, null=True)
    use_profile_cv = models.BooleanField(default=False)

    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='APPLIED')
    recruiter_notes = models.TextField(blank=True, max_length=1000)

    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-applied_at']
        unique_together = ['job', 'applicant']

    def __str__(self):
        return f'{self.applicant.full_name} → {self.job.title}'


class SavedJob(models.Model):
    """Bookmarked/saved jobs for a member."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='saved_jobs'
    )
    job = models.ForeignKey(
        JobListing, on_delete=models.CASCADE, related_name='saves'
    )
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'job']
        ordering = ['-saved_at']

    def __str__(self):
        return f'{self.user.full_name} saved {self.job.title}'
