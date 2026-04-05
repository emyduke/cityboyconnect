import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import User
from apps.members.models import MemberProfile, Leadership
from apps.structure.models import State, LocalGovernment, Ward
from apps.events.models import Event
from apps.announcements.models import Announcement


SAMPLE_NAMES = [
    'Adebayo Ogunlesi', 'Chidinma Okafor', 'Emeka Eze', 'Fatima Bello',
    'Ibrahim Musa', 'Jumoke Adeyemi', 'Kelechi Nwosu', 'Lateef Abiodun',
    'Maryam Suleiman', 'Ngozi Onyema', 'Oluwaseun Bakare', 'Patience Obi',
    'Rasheed Lawal', 'Shade Akintola', 'Tunde Fashola', 'Uche Ikenna',
    'Victoria Adekunle', 'Wasiu Ayinde', 'Xander Okonkwo', 'Yemi Osinbajo',
    'Zainab Mohammed', 'Aisha Buhari', 'Babajide Sanwo-Olu', 'Chukwuma Nzeogwu',
    'Damilola Ogunbiyi', 'Emmanuel Uduaghan', 'Funke Akindele', 'Grace Oladipo',
    'Hassan Audu', 'Ifeoma Nnewi', 'Jide Kosoko', 'Kehinde Bamigbetan',
    'Lanre Ogunlana', 'Mercy Johnson', 'Nasir El-Rufai', 'Obinna Igwe',
    'Priscilla Ojo', 'Quadri Aruna', 'Rita Dominic', 'Segun Adeniyi',
    'Taiwo Akerele', 'Uchenna Nwodo', 'Veronica Adeoti', 'Wale Oluwo',
    'Yusuf Garba', 'Zuberu Dada', 'Adaeze Igwe', 'Bola Tinubu',
    'Celestina Omehia', 'David Umahi',
]


class Command(BaseCommand):
    help = 'Seed demo data: users, members, events, announcements'

    def handle(self, *args, **options):
        self.stdout.write('Seeding demo data...')

        # Get some states
        states = list(State.objects.all()[:5])
        if not states:
            self.stdout.write(self.style.ERROR('Run seed_structure first!'))
            return

        # Create demo members
        members_created = 0
        for i, name in enumerate(SAMPLE_NAMES):
            phone = f'+2348{random.randint(10, 99):02d}{random.randint(1000000, 9999999):07d}'
            state = states[i % len(states)]
            lgas = list(state.lgas.all()[:5])
            if not lgas:
                continue
            lga = lgas[i % len(lgas)]
            wards = list(lga.wards.all()[:5])
            if not wards:
                continue
            ward = wards[i % len(wards)]

            user, created = User.objects.get_or_create(
                phone_number=phone,
                defaults={
                    'full_name': name,
                    'is_verified': True,
                    'role': 'MEMBER',
                },
            )
            if created:
                user.set_unusable_password()
                user.save()

                profile = MemberProfile.objects.create(
                    user=user,
                    state=state,
                    lga=lga,
                    ward=ward,
                    date_of_birth=timezone.now().date() - timedelta(days=random.randint(7000, 15000)),
                    gender=random.choice(['M', 'F']),
                    occupation=random.choice([
                        'Trader', 'Teacher', 'Engineer', 'Student', 'Farmer',
                        'Doctor', 'Lawyer', 'Entrepreneur', 'Civil Servant', 'Artisan',
                    ]),
                    residential_address=f'{random.randint(1, 100)} {ward.name} Street, {lga.name}',
                    voter_verification_status=random.choice(['PENDING', 'VERIFIED', 'VERIFIED']),
                    membership_category=random.choice(['ORDINARY', 'VOLUNTEER', 'ORDINARY']),
                    onboarding_step=3,
                )
                members_created += 1

        # Create State Director for Lagos
        lagos = State.objects.filter(code='LA').first()
        if lagos:
            director_user, created = User.objects.get_or_create(
                phone_number='+2349077776773',
                defaults={
                    'full_name': 'State Director (Innovation)',
                    'is_verified': True,
                    'role': 'STATE_DIRECTOR',
                },
            )
            if created:
                director_user.set_unusable_password()
                director_user.save()
                lga = lagos.lgas.first()
                ward = lga.wards.first() if lga else None
                MemberProfile.objects.get_or_create(
                    user=director_user,
                    defaults={
                        'state': lagos,
                        'lga': lga,
                        'ward': ward,
                        'gender': 'M',
                        'occupation': 'Director of Innovation & Creativity',
                        'voter_verification_status': 'VERIFIED',
                        'onboarding_step': 3,
                    },
                )
                Leadership.objects.get_or_create(
                    user=director_user,
                    position='STATE_DIRECTOR',
                    defaults={
                        'state': lagos,
                        'appointed_by': director_user,
                    },
                )

        # Create demo events
        events_created = 0
        event_titles = [
            ('City Boy Movement Lagos Rally', 'RALLY'),
            ('Ward Coordinators Training', 'TRAINING'),
            ('Community Outreach - Alimosho', 'OUTREACH'),
            ('State Leadership Meeting', 'MEETING'),
            ('Town Hall: Youth Empowerment', 'TOWN_HALL'),
        ]
        for title, etype in event_titles:
            state = states[events_created % len(states)]
            organizer = User.objects.filter(role__in=['STATE_DIRECTOR', 'SUPER_ADMIN']).first()
            if not organizer:
                organizer = User.objects.first()
            if organizer:
                event, created = Event.objects.get_or_create(
                    title=title,
                    defaults={
                        'description': f'Join us for {title}. This is a key event for the City Boy Movement.',
                        'event_type': etype,
                        'organizer': organizer,
                        'state': state,
                        'venue_name': f'{state.name} Event Center',
                        'venue_address': f'{state.name} State',
                        'start_datetime': timezone.now() + timedelta(days=random.randint(5, 30)),
                        'status': 'UPCOMING',
                        'visibility': 'ALL',
                    },
                )
                if created:
                    events_created += 1

        # Create demo announcements
        announcements = [
            ('Welcome to City Boy Connect', 'The digital platform for the City Boy Movement is now live. Register and verify your membership today!', 'URGENT'),
            ('Upcoming State Rally - Lagos', 'All Lagos members are invited to the upcoming state rally. Details will be shared soon.', 'IMPORTANT'),
            ('Membership Verification Drive', 'We are conducting a membership verification drive. Please upload your voter card.', 'NORMAL'),
        ]
        ann_created = 0
        for title, body, priority in announcements:
            author = User.objects.filter(role__in=['STATE_DIRECTOR', 'NATIONAL_OFFICER', 'SUPER_ADMIN']).first()
            if not author:
                author = User.objects.first()
            if author:
                ann, created = Announcement.objects.get_or_create(
                    title=title,
                    defaults={
                        'body': body,
                        'author': author,
                        'target_scope': 'ALL',
                        'priority': priority,
                        'is_published': True,
                        'published_at': timezone.now(),
                    },
                )
                if created:
                    ann_created += 1

        self.stdout.write(self.style.SUCCESS(
            f'Done! Created: {members_created} members, {events_created} events, {ann_created} announcements'
        ))
