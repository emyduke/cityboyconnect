import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './layouts/ProtectedRoute';
import { AuthGuard } from './layouts/ProtectedRoute';
import RequireRole from './components/RequireRole';
import Skeleton from './components/Skeleton';

const Homepage = lazy(() => import('./pages/Homepage'));
const Login = lazy(() => import('./pages/Login'));
const Join = lazy(() => import('./pages/Join'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Members = lazy(() => import('./pages/Members'));
const MemberDetail = lazy(() => import('./pages/MemberDetail'));
const Events = lazy(() => import('./pages/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const Announcements = lazy(() => import('./pages/Announcements'));
const AnnouncementDetail = lazy(() => import('./pages/AnnouncementDetail'));
const Reports = lazy(() => import('./pages/Reports'));
const NewReport = lazy(() => import('./pages/NewReport'));
const EditReport = lazy(() => import('./pages/EditReport'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const MyQRCode = lazy(() => import('./pages/MyQRCode'));
const MyNetwork = lazy(() => import('./pages/MyNetwork'));
const SetPassword = lazy(() => import('./pages/SetPassword'));
const SuspendedAccount = lazy(() => import('./pages/SuspendedAccount'));
const Bubbles = lazy(() => import('./pages/Bubbles'));
const BubbleDetail = lazy(() => import('./pages/BubbleDetail'));
const CreateBubble = lazy(() => import('./pages/CreateBubble'));
const MyBubbles = lazy(() => import('./pages/MyBubbles'));

// Opportunities & Jobs
const Opportunities = lazy(() => import('./pages/Opportunities'));
const TalentDetail = lazy(() => import('./pages/TalentDetail'));
const ProfessionalDetail = lazy(() => import('./pages/ProfessionalDetail'));
const BusinessDetail = lazy(() => import('./pages/BusinessDetail'));
const MyOpportunities = lazy(() => import('./pages/MyOpportunities'));
const Jobs = lazy(() => import('./pages/Jobs'));
const JobDetail = lazy(() => import('./pages/JobDetail'));
const CreateJob = lazy(() => import('./pages/CreateJob'));
const MyJobListings = lazy(() => import('./pages/MyJobListings'));
const JobApplications = lazy(() => import('./pages/JobApplications'));
const MyApplications = lazy(() => import('./pages/MyApplications'));
const SavedJobs = lazy(() => import('./pages/SavedJobs'));
const AddMember = lazy(() => import('./pages/AddMember'));
const CreateAnnouncement = lazy(() => import('./pages/CreateAnnouncement'));
const EditEvent = lazy(() => import('./pages/EditEvent'));

// Admin panel
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminOverview = lazy(() => import('./pages/admin/Overview'));
const AdminMembersManagement = lazy(() => import('./pages/admin/MembersManagement'));
const AdminStructureOrgChart = lazy(() => import('./pages/admin/StructureOrgChart'));
const AdminVerificationsQueue = lazy(() => import('./pages/admin/VerificationsQueue'));
const AdminPlatformSettings = lazy(() => import('./pages/admin/PlatformSettings'));
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents'));
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminAuditLog = lazy(() => import('./pages/admin/AdminAuditLog'));
const AdminBubbles = lazy(() => import('./pages/admin/AdminBubbles'));

function PageLoader() {
  return (
    <div style={{ padding: '2rem' }}>
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="card" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/join" element={<Join />} />
        <Route path="/suspended" element={<SuspendedAccount />} />

        {/* Authenticated */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/:id" element={<MemberDetail />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/create" element={<RequireRole minRole="WARD_COORDINATOR"><CreateEvent /></RequireRole>} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/announcements/:id" element={<AnnouncementDetail />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/new" element={<RequireRole minRole="WARD_COORDINATOR"><NewReport /></RequireRole>} />
          <Route path="/reports/:id/edit" element={<RequireRole minRole="WARD_COORDINATOR"><EditReport /></RequireRole>} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/bubbles" element={<Bubbles />} />
          <Route path="/bubbles/create" element={<RequireRole minRole="WARD_COORDINATOR"><CreateBubble /></RequireRole>} />
          <Route path="/bubbles/:id" element={<BubbleDetail />} />
          <Route path="/my-bubbles" element={<MyBubbles />} />
          <Route path="/my-qr" element={<MyQRCode />} />
          <Route path="/my-network" element={<MyNetwork />} />
          <Route path="/security" element={<SetPassword />} />

          {/* Opportunities & Jobs */}
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/opportunities/talent/:userId" element={<TalentDetail />} />
          <Route path="/opportunities/professional/:userId" element={<ProfessionalDetail />} />
          <Route path="/opportunities/business/:id" element={<BusinessDetail />} />
          <Route path="/opportunities/me" element={<MyOpportunities />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/jobs/create" element={<CreateJob />} />
          <Route path="/jobs/edit/:id" element={<CreateJob />} />
          <Route path="/jobs/my-listings" element={<MyJobListings />} />
          <Route path="/jobs/my-listings/:jobId/applications" element={<JobApplications />} />
          <Route path="/jobs/my-applications" element={<MyApplications />} />
          <Route path="/jobs/saved" element={<SavedJobs />} />
          <Route path="/members/add" element={<RequireRole minRole="WARD_COORDINATOR"><AddMember /></RequireRole>} />
          <Route path="/announcements/create" element={<RequireRole minRole="WARD_COORDINATOR"><CreateAnnouncement /></RequireRole>} />
          <Route path="/events/:id/edit" element={<RequireRole minRole="WARD_COORDINATOR"><EditEvent /></RequireRole>} />
        </Route>

        {/* Admin Panel — requires STATE_DIRECTOR or above */}
        <Route element={<AuthGuard />}>
          <Route path="/admin" element={<RequireRole minRole="STATE_DIRECTOR"><AdminLayout /></RequireRole>}>
            <Route index element={<AdminOverview />} />
            <Route path="members" element={<AdminMembersManagement />} />
            <Route path="verifications" element={<AdminVerificationsQueue />} />
            <Route path="structure" element={<AdminStructureOrgChart />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="bubbles" element={<AdminBubbles />} />
            <Route path="bubbles/:id" element={<AdminBubbles />} />
            <Route path="audit-log" element={<RequireRole minRole="NATIONAL_OFFICER"><AdminAuditLog /></RequireRole>} />
            <Route path="settings" element={<RequireRole minRole="SUPER_ADMIN"><AdminPlatformSettings /></RequireRole>} />
          </Route>
        </Route>

        {/* Legacy redirects */}
        <Route path="/super-admin" element={<Navigate to="/admin" replace />} />
        <Route path="/super-admin/*" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/analytics" element={<Navigate to="/admin" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
