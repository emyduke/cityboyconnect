# City Boy Connect

Full-stack civic tech platform for the City Boy Movement — an APC-aligned political youth engagement network across Nigeria. Features phone-based OTP auth, QR-driven onboarding, multi-level political structure, event management, grassroots reporting, a performance leaderboard with badges, and a full super-admin dashboard.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start-local-development)
- [Docker](#docker)
- [Project Structure](#project-structure)
- [Accessing the Platform](#accessing-the-platform)
- [User Roles & Permissions](#user-roles--permissions)
- [API Documentation](#api-documentation)
  - [Authentication](#1-authentication)
  - [Structure](#2-geopolitical-structure)
  - [Onboarding](#3-member-onboarding)
  - [Members](#4-members--profiles)
  - [QR & Network](#5-qr-code--referral-network)
  - [Leadership](#6-leadership)
  - [Events](#7-events)
  - [Announcements](#8-announcements)
  - [Reports](#9-grassroots-reports)
  - [Dashboard](#10-dashboard--analytics)
  - [Leaderboard](#11-leaderboard--scoring)
  - [Admin Panel](#12-admin-panel)
- [Frontend Pages](#frontend-pages)
- [Data Models](#data-models)

---

## Tech Stack

- **Backend**: Django 5 + Django REST Framework + SimpleJWT
- **Frontend**: React 19 (Vite) + Zustand + Recharts + react-icons
- **Mobile**: React Native (Expo SDK 54) + React Navigation + Zustand
- **Database**: PostgreSQL (SQLite for dev)
- **Task Queue**: Celery + Redis (nightly score recalculation)
- **Auth**: Phone-based OTP + JWT tokens
- **QR**: qrcode[pil] library for member onboarding QR codes

---

## Quick Start (Local Development)

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_structure     # Seeds 6 zones, 37 states, 772 LGAs, 7720 wards
python manage.py seed_demo_data     # Seeds 50 demo members, events, announcements
python manage.py runserver
```

API available at `http://localhost:8000/api/v1/`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at `http://localhost:5173/`

### Mobile App (React Native / Expo)

```bash
cd mobile
npm install
cp .env.example .env
```

Edit `.env` and set the API URL to your backend:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```

> **Note:** When running on a physical device or emulator, replace `localhost` with your machine's local IP address (e.g., `http://192.168.1.100:8000/api/v1`). You can find your IP with `ifconfig | grep "inet "` on macOS or `hostname -I` on Linux.

Start the Expo dev server:

```bash
npx expo start
```

From the Expo CLI menu:
- Press **i** to open in iOS Simulator (requires Xcode on macOS)
- Press **a** to open in Android Emulator (requires Android Studio)
- Scan the QR code with the **Expo Go** app on your physical device

#### Running on a Physical Device

1. Install [Expo Go](https://expo.dev/go) from the App Store (iOS) or Play Store (Android)
2. Ensure your phone and computer are on the same Wi-Fi network
3. Run `npx expo start` and scan the QR code shown in the terminal

#### Building for Production

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Configure and build
eas build --platform ios      # iOS (requires Apple Developer account)
eas build --platform android  # Android
```

### Django Admin

Access the built-in Django admin at `http://localhost:8000/admin/`.

To create an admin superuser:

```bash
cd backend
python manage.py createsuperuser
```

> **Note:** The Django admin provides direct database access for debugging. For the platform's custom admin UI, use the Super Admin Dashboard in the frontend (see [Accessing the Platform](#accessing-the-platform)).

---

## Docker

```bash
cp .env.example .env
docker compose up --build
```

Services:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/v1/
- Django Admin: http://localhost:8000/admin/
- PostgreSQL: localhost:5432
- Redis: localhost:6379

---

## Project Structure

```
cityboy-connect/
├── backend/
│   ├── config/            # Django settings, root URLs, WSGI/ASGI
│   ├── apps/
│   │   ├── accounts/      # User model, OTP auth, JWT endpoints
│   │   ├── structure/     # Zones, States, LGAs, Wards, Polling Units
│   │   ├── members/       # Profiles, onboarding, QR codes, referral network
│   │   ├── events/        # Events, attendance, QR check-in
│   │   ├── announcements/ # Scoped announcements with read tracking
│   │   ├── reports/       # Grassroots reports (ward → state)
│   │   ├── dashboard/     # Analytics & legacy admin endpoints
│   │   ├── scoring/       # Performance scores, leaderboard, badges
│   │   └── admin_panel/   # Super Admin API (overview, member mgmt, settings)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/           # Axios client with JWT interceptors & auto-refresh
│   │   ├── components/    # 21+ reusable UI components (CardFlow, Avatar, etc.)
│   │   ├── layouts/       # DashboardLayout, ProtectedRoute
│   │   ├── pages/         # 25+ page components
│   │   │   └── admin/     # Admin panel pages (10 pages)
│   │   └── store/         # Zustand stores (auth, toast)
│   └── package.json
├── mobile/
│   ├── src/
│   │   ├── theme/         # Colors, typography, spacing tokens
│   │   ├── api/           # Axios client with JWT interceptors & refresh
│   │   ├── store/         # Zustand stores (auth, toast, onboarding)
│   │   ├── navigation/    # Stack & tab navigators, type definitions
│   │   ├── components/    # 14 reusable UI + domain components
│   │   └── screens/       # 28 screens (auth, main tabs, admin)
│   ├── app.json
│   └── package.json
├── docker-compose.yml
└── .env.example
```

---

## Accessing the Platform

### Public Pages (No login required)

| URL | Page | Description |
|-----|------|-------------|
| `/` | Homepage | Landing page with movement info, structure, features |
| `/login` | Login | Sign in with phone number + OTP |
| `/join` | Registration | 5-step onboarding (Phone → OTP → Profile → Placement → Voter Card) |
| `/join?ref=<token>` | Referral Join | Same as above, with referrer banner shown at top |

### Member Pages (Login required)

| URL | Page | Description |
|-----|------|-------------|
| `/dashboard` | Dashboard | Overview stats, growth chart, leaderboard preview |
| `/profile` | Profile | View/edit own profile |
| `/members` | Members | Browse members in your scope |
| `/members/:id` | Member Detail | Full member profile |
| `/events` | Events | Browse events in your scope |
| `/events/create` | Create Event | 7-step card flow to create an event (Coordinators+) |
| `/events/:id` | Event Detail | Event info, attendance, check-in |
| `/announcements` | Announcements | Scoped announcement feed |
| `/announcements/:id` | Announcement Detail | Full announcement with read tracking |
| `/reports` | Reports | Grassroots report list |
| `/reports/new` | New Report | 7-step card flow to submit a monthly report |
| `/leaderboard` | Leaderboard | National/State/LGA rankings + personal score breakdown |
| `/my-qr` | My QR Code | Your personal onboarding QR code + share/download |
| `/my-network` | My Network | Direct recruits, network tree, recent joins |

### Admin Panel (Role-gated — `STATE_DIRECTOR` and above)

All admin pages live under `/admin` and are protected by `RequireRole` guards.

| URL | Page | Min Role | Description |
|-----|------|----------|-------------|
| `/admin` | Overview | STATE_DIRECTOR | System-wide stats, growth chart, auto-refreshing activity feed |
| `/admin/members` | Members Management | STATE_DIRECTOR | Search, filter, bulk actions, verify, suspend, change role, export CSV |
| `/admin/verifications` | Verification Queue | STATE_DIRECTOR | Split-pane voter card review with keyboard shortcuts (A/R/S) |
| `/admin/structure` | Structure & Leaders | STATE_DIRECTOR | State org chart, appoint/remove leaders by ward/LGA |
| `/admin/events` | Events | STATE_DIRECTOR | Manage events, view attendance, cancel/delete |
| `/admin/announcements` | Announcements | STATE_DIRECTOR | Publish/unpublish announcements, manage scope |
| `/admin/reports` | Reports | STATE_DIRECTOR | Acknowledge/review grassroots reports, image gallery |
| `/admin/audit-log` | Audit Log | NATIONAL_OFFICER | Searchable log of all admin actions with JSON details |
| `/admin/settings` | Platform Settings | SUPER_ADMIN | Maintenance mode, scoring weights, test SMS |

| `/suspended` | Suspended Account | — | Shown when a suspended user tries to access the platform |

### How to Create an Admin User

**Option 1 — Promote an existing user via Django shell:**

```bash
cd backend
python manage.py shell
```

```python
from apps.accounts.models import User
u = User.objects.get(phone_number="+234XXXXXXXXXX")
u.role = "SUPER_ADMIN"   # or STATE_DIRECTOR, NATIONAL_OFFICER
u.is_staff = True
u.is_superuser = True
u.save()
```

**Option 2 — Create a new superuser** (automatically sets `role='SUPER_ADMIN'`):

```bash
cd backend
python manage.py createsuperuser
```

**Option 3 — Django admin site** at `http://localhost:8000/admin/` — log in with a staff user and change the role field through the UI.

After creating/promoting the user, log in at `/login` and navigate to `/admin`.

---

## User Roles & Permissions

Roles are hierarchical. Higher roles inherit all permissions of lower roles.

| Role | Level | Scope | Can Do |
|------|-------|-------|--------|
| `MEMBER` | 1 | Own data | View content, attend events, read announcements, view leaderboard |
| `WARD_COORDINATOR` | 2 | Ward | All above + create events/reports/announcements at ward level |
| `ZONAL_COORDINATOR` | 3 | Zone | Create events/reports at zone level |
| `LGA_COORDINATOR` | 4 | LGA | Create events/reports at LGA level, manual check-ins |
| `STATE_DIRECTOR` | 6 | State | Appoint leaders, state-level events/announcements/reports |
| `NATIONAL_OFFICER` | 8 | National | National-level analytics, all states |
| `SUPER_ADMIN` | 10 | System | Everything — member mgmt, settings, verifications, exports |

### Permission Classes Used in API

| Permission | Who | Used For |
|------------|-----|----------|
| `AllowAny` | Everyone | OTP request, OTP verify, token refresh, structure lookups, referral validation |
| `IsAuthenticated` | Logged-in users | Profile, member list, events list, announcements, dashboard, leaderboard |
| `IsCoordinatorOrAbove` | Ward Coordinator+ | Create events, reports, announcements, manual check-in |
| `IsLGACoordinatorOrAbove` | LGA Coordinator+ | LGA-level operations |
| `IsStateDirectorOrAbove` | State Director+ | Appoint leaders, state-level data |
| `IsNationalOfficerOrAbove` | National Officer+ | National-level analytics |
| `IsSuperAdmin` | Super Admin only | All `/api/v1/admin/` endpoints |

---

## API Documentation

**Base URL:** `http://localhost:8000/api/v1/`

**Authentication:** All endpoints except those marked `Public` require a JWT token.

```
Authorization: Bearer <access_token>
```

**Response Format:** All responses are wrapped in:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

---

### 1. Authentication

Base: `/api/v1/auth/`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `request-otp/` | Public | Send OTP to phone number |
| POST | `verify-otp/` | Public | Verify OTP → returns JWT tokens (creates user if new) |
| POST | `refresh/` | Public | Exchange refresh token for new access token |
| POST | `logout/` | Bearer | Blacklist refresh token |
| GET | `me/` | Bearer | Get current user info |

**Request OTP:**
```json
POST /api/v1/auth/request-otp/
{ "phone_number": "+2348012345678" }
```

**Verify OTP:**
```json
POST /api/v1/auth/verify-otp/
{ "phone_number": "+2348012345678", "otp_code": "123456" }
→ { "access": "eyJ...", "refresh": "eyJ...", "is_new_user": true, "user": {...} }
```

**JWT Settings:** Access tokens expire in 60 minutes. Refresh tokens last 30 days with rotation enabled.

> **Dev Tip:** OTP codes are printed to the terminal console in development mode. Check the Django server output for `OTP for +234...: 123456`.

---

### 2. Geopolitical Structure

Base: `/api/v1/structure/`  —  All endpoints are **public** (no auth required).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `zones/` | List 6 geopolitical zones |
| GET | `states/` | List 37 states (filter: `?zone=<id>`) |
| GET | `states/<state_id>/lgas/` | List LGAs in a state |
| GET | `lgas/<lga_id>/wards/` | List wards in an LGA |
| GET | `wards/<ward_id>/units/` | List polling units in a ward |

These cascade: Zone → States → LGAs → Wards → Polling Units.

---

### 3. Member Onboarding

Base: `/api/v1/onboarding/`  —  All require **Bearer** token.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `profile/` | Step 1: Submit name, DOB, gender, occupation, photo |
| POST | `placement/` | Step 2: Select state, LGA, ward (+optional referral_token) |
| POST | `voter-card/` | Step 3: Upload voter card number, image, APC membership |
| GET | `status/` | Check onboarding progress and membership ID |

---

### 4. Members & Profiles

Base: `/api/v1/members/`  —  All require **Bearer** token.

| Method | Endpoint | Description | Filters |
|--------|----------|-------------|---------|
| GET | `/` | List members (scoped to your geographic level) | `?search=`, `?state=`, `?lga=`, `?ward=`, `?voter_verification_status=` |
| GET | `<id>/` | Get member details | — |
| PATCH | `<id>/update/` | Update own profile (limited fields) | — |
| GET | `my-referrals/` | Members you referred | — |
| GET | `directory/` | Public directory (verified members only) | Same filters |

---

### 5. QR Code & Referral Network

Base: `/api/v1/members/`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `my-qr/` | Bearer | Get your QR code (base64 PNG), referral link, stats |
| GET | `validate-ref/<token>/` | **Public** | Validate a referral token → returns referrer name, state |
| GET | `my-network/` | Bearer | Your direct referrals + stats (direct, total, verified, this_month) |
| GET | `my-network/tree/` | Bearer | Hierarchical tree of your network (`?depth=3`, max 5) |
| GET | `my-network/recent/` | Bearer | Members who joined through your network in last 30 days |

**QR Response Example:**
```json
GET /api/v1/members/my-qr/
→ {
    "qr_token": "c7d7616df57d4d9f",
    "qr_url": "http://localhost:8000/join?ref=c7d7616df57d4d9f",
    "qr_image": "iVBORw0KGgo...",   // base64 PNG
    "direct_count": 5,
    "network_size": 23,
    "today_count": 1
  }
```

---

### 6. Leadership

Base: `/api/v1/leadership/`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Bearer | List active leaders (filter: `?state=`, `?lga=`, `?ward=`, `?position=`) |
| GET | `state/<state_id>/` | Bearer | Leaders in a specific state |
| POST | `appoint/` | State Director+ | Appoint a leader (`{user_id, position, state?, lga?, ward?}`) |

---

### 7. Events

Base: `/api/v1/events/`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Bearer | List events (filter: `?state=`, `?lga=`, `?event_type=`, `?status=`, `?visibility=`) |
| POST | `create/` | Coordinator+ | Create event (title, event_type, start/end datetime, venue, visibility, banner) |
| GET | `<id>/` | Bearer | Event details |
| PATCH | `<id>/update/` | Coordinator+ | Update event (organizer or level ≥ 6) |
| DELETE | `<id>/delete/` | Coordinator+ | Delete event (organizer or level ≥ 6) |
| POST | `<id>/attend/` | Bearer | Self check-in / RSVP |
| POST | `<id>/check-in/` | Coordinator+ | Manual check-in (`{member_id}`) |
| POST | `<id>/check-in-qr/` | Bearer | QR-based check-in |
| GET | `<id>/attendance/` | Coordinator+ | Attendance list |

**Event Types:** `RALLY`, `TOWN_HALL`, `TRAINING`, `MEETING`, `OUTREACH`, `OTHER`  
**Visibility:** `ALL`, `STATE`, `LGA`, `WARD`  
**Statuses:** `UPCOMING`, `ONGOING`, `COMPLETED`, `CANCELLED`

---

### 8. Announcements

Base: `/api/v1/announcements/`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Bearer | Scoped announcements (filter: `?priority=`, `?target_scope=`) |
| POST | `create/` | Coordinator+ | Create announcement (title, body, target_scope, priority) |
| GET | `<id>/` | Bearer | Full announcement |
| POST | `<id>/read/` | Bearer | Mark as read |

**Scopes:** `ALL`, `ZONE`, `STATE`, `LGA`, `WARD`  
**Priority:** `NORMAL`, `IMPORTANT`, `URGENT`

---

### 9. Grassroots Reports

Base: `/api/v1/reports/`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Bearer | List reports (filter: `?state=`, `?lga=`, `?report_level=`, `?status=`) |
| POST | `create/` | Coordinator+ | Create draft report (period, level, stats, narrative) |
| GET | `<id>/` | Bearer | Report details |
| PATCH | `<id>/update/` | Coordinator+ | Update draft report |
| POST | `<id>/submit/` | Coordinator+ | Submit report (DRAFT → SUBMITTED) |
| POST | `<id>/acknowledge/` | Coordinator+ | Acknowledge report (SUBMITTED → ACKNOWLEDGED) |

**Report Levels:** `WARD`, `LGA`, `STATE`  
**Statuses:** `DRAFT` → `SUBMITTED` → `ACKNOWLEDGED` → `REVIEWED`

---

### 10. Dashboard & Analytics

Base: `/api/v1/dashboard/`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `overview/` | Bearer | Dashboard stats (total/verified members, active LGAs, events this month) |
| GET | `membership-growth/` | Bearer | Growth over time (`?months=6`) |
| GET | `structure-health/` | Bearer | State/LGA health metrics |
| GET | `leaderboard/` | Bearer | Top states by member count |
| GET | `national/` | National Officer+ | National-level overview with zone breakdown |
| GET | `admin/pending-verifications/` | Bearer | Members pending voter card verification |
| POST | `admin/verify-member/<id>/` | Bearer | Verify a member's voter card |

---

### 11. Leaderboard & Scoring

Base: `/api/v1/leaderboard/`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Bearer | Leaderboard rankings (`?scope=national\|state\|lga`, `?state_id=`, `?lga_id=`) |
| GET | `my-rank/` | Bearer | Your full score breakdown, rank, and badges |

**Score Weights:**
| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Members Onboarded | 40% | Direct referrals + network size (logarithmic scale) |
| Event Attendance | 25% | Events attended in last 90 days |
| Platform Engagement | 20% | Reports submitted (60%) + announcements read (40%) |
| Network Depth | 15% | Depth of your referral chain (levels × 20) |

**Badges:** Pioneer (first 1000), Recruiter (5+ referrals), Super Recruiter (25+), Event Regular (10+ events), Report Champion (5+ on-time reports), Influencer (3+ depth), Century Club (100+ network), State Builder (50+ in state), Verified (voter card verified).

---

### 12. Super Admin Panel

Base: `/api/v1/admin/`  —  **All endpoints require SUPER_ADMIN role.**

#### Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `overview/` | Full system dashboard (members, events, reports, verifications) |
| GET | `activity-feed/` | Recent platform activity (`?limit=20`) |

#### Member Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `members/` | All members with search/filters (`?search=`, `?state=`, `?status=`, `?role=`) |
| GET | `members/<id>/full/` | Complete member profile with performance data |
| POST | `members/<id>/verify/` | Approve voter card verification |
| POST | `members/<id>/reject/` | Reject voter card (`{reason?}`) |
| POST | `members/<id>/suspend/` | Suspend member account |
| POST | `members/<id>/unsuspend/` | Reactivate member |
| PATCH | `members/<id>/role/` | Change member role (`{role}`) |
| DELETE | `members/<id>/` | Permanently delete member |

#### Verifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `verifications/` | Queue of pending voter card verifications |

#### Structure & Leadership

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `structure/<state_id>/` | State org chart (leaders + member count) |
| POST | `leadership/appoint/` | Appoint leader (`{user_id, position, state?, lga?, ward?}`) |
| DELETE | `leadership/<id>/` | Remove leader from position |

#### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `analytics/growth/` | Growth trend (`?months=12`) |
| GET | `analytics/map/` | Member distribution by state |

#### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `audit-log/` | Full audit trail (`?action=`, `?user_id=`) |
| GET/PATCH | `settings/` | Platform settings (key-value config) |
| POST | `export/members/` | Export all members as CSV |

---

## Frontend Pages

### Components Library

| Component | Purpose |
|-----------|---------|
| `CardFlow` | Multi-step card flow container (used by CreateEvent, NewReport) |
| `Avatar` | User avatar with initials fallback |
| `Button` | Primary/secondary/danger buttons with loading state |
| `Input` | Form input with label and error |
| `SearchableSelect` | Filterable dropdown select |
| `FileUpload` | Drag & drop file upload |
| `OTPInput` | 6-digit OTP input with auto-focus |
| `PhoneInput` | Nigerian phone input with +234 prefix |
| `StatCard` | Stats display card (icon, label, value) |
| `Card` | Generic content card |
| `Skeleton` | Loading placeholder (text, card, table variants) |
| `EmptyState` | Empty data placeholder |
| `Toast` | Toast notification system |
| `ErrorBoundary` | React error boundary with dev stack traces |
| `ProgressBar` | Step progress indicator |
| `StepIndicator` | Multi-step form progress |
| `DataTable` | Sortable, searchable data table |
| `Badge` | Status badge component |

---

## Data Models

### Core Models

| Model | Key Fields | Description |
|-------|-----------|-------------|
| `User` | phone_number, full_name, role, is_verified | Custom auth user (phone-based) |
| `MemberProfile` | user, state, lga, ward, voter_card_number, referred_by, onboarding_qr_token, membership_id | Full member profile with placement |
| `Leadership` | user, position, state/lga/ward, appointed_by, is_active | Leadership appointments |

### Content Models

| Model | Key Fields | Description |
|-------|-----------|-------------|
| `Event` | title, event_type, organizer, start/end, venue, visibility, status | Events with geographic scoping |
| `EventAttendance` | event, member, check_in_method, checked_in_at | Attendance tracking |
| `Announcement` | title, body, author, target_scope, priority | Scoped announcements |
| `AnnouncementRead` | announcement, member, read_at | Read tracking |
| `GrassrootsReport` | reporter, report_period, report_level, status, stats | Monthly reports |

### Scoring Models

| Model | Key Fields | Description |
|-------|-----------|-------------|
| `MemberScore` | member, total_score, national_rank, state_rank, badges | Performance leaderboard |
| `PlatformSettings` | key, value (JSON) | Singleton platform config |
| `AuditLog` | user, action, details, created_at | System audit trail |

### Structure Models

| Model | Key Fields | Description |
|-------|-----------|-------------|
| `Zone` | name | 6 geopolitical zones |
| `State` | name, zone | 37 states |
| `LGA` | name, state | 774 LGAs |
| `Ward` | name, lga | 8,809 wards |
| `PollingUnit` | name, ward | Polling units |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|------------|
| `DJANGO_SECRET_KEY` | (auto-generated) | Django secret key |
| `DJANGO_DEBUG` | `True` | Debug mode |
| `DATABASE_URL` | SQLite | Database connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis for Celery |
| `SMS_PROVIDER` | `console` | SMS provider (`console` prints OTP to terminal) |
| `VITE_API_URL` | `http://localhost:8000/api/v1` | Frontend API base URL |

---

## Management Commands

```bash
python manage.py seed_structure     # Seed zones, states, LGAs, wards from fixtures
python manage.py seed_demo_data     # Create 50 demo members + events + announcements
python manage.py createsuperuser    # Create Django admin superuser
```
