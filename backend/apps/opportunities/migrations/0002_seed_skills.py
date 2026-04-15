from django.db import migrations
from django.utils.text import slugify


SKILLS = [
    'Python', 'JavaScript', 'Photography', 'Video Editing', 'Graphic Design',
    'UI/UX Design', 'Content Writing', 'Social Media Marketing', 'Project Management',
    'Data Analysis', 'Accounting', 'Law', 'Medicine', 'Teaching', 'Nursing',
    'Engineering', 'Mechanical Repair', 'Electrical Work', 'Plumbing', 'Carpentry',
    'Tailoring', 'Catering', 'Event Planning', 'DJ', 'MC/Hosting', 'Barbing',
    'Hairstyling', 'Makeup', 'Fitness Training', 'Driving', 'Public Speaking',
    'Web Development', 'Mobile Development', 'Digital Marketing', 'SEO',
    'Customer Service', 'Sales', 'Human Resources', 'Supply Chain', 'Agriculture',
]


def seed_skills(apps, schema_editor):
    Skill = apps.get_model('opportunities', 'Skill')
    for name in SKILLS:
        slug = slugify(name)
        if not Skill.objects.filter(slug=slug).exists():
            Skill.objects.create(name=name, slug=slug)


def remove_skills(apps, schema_editor):
    Skill = apps.get_model('opportunities', 'Skill')
    slugs = [slugify(name) for name in SKILLS]
    Skill.objects.filter(slug__in=slugs).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('opportunities', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_skills, remove_skills),
    ]
