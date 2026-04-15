import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh/`, { refresh: refreshToken });
          const { access, refresh } = res.data.data;
          useAuthStore.getState().setTokens(access, refresh);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const getAuthMethods = (phone) => api.get('/auth/methods/', { params: phone ? { phone } : {} });
export const requestOTP = (data) => api.post('/auth/request-otp/', data);
export const verifyOTP = (data) => api.post('/auth/verify-otp/', data);
export const loginWithPassword = (data) => api.post('/auth/login/', data);
export const setPassword = (data) => api.post('/auth/set-password/', data);
export const getMe = () => api.get('/auth/me/');
export const logout = (refresh) => api.post('/auth/logout/', { refresh });

// Structure
export const getZones = () => api.get('/structure/zones/');
export const getStates = (zone) => api.get('/structure/states/', { params: zone ? { zone } : {} });
export const getLGAs = (stateId) => api.get(`/structure/states/${stateId}/lgas/`);
export const getWards = (lgaId) => api.get(`/structure/lgas/${lgaId}/wards/`);
export const getUnits = (wardId) => api.get(`/structure/wards/${wardId}/units/`);

// Onboarding
export const onboardingProfile = (data) => api.post('/onboarding/profile/', data, {
  headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
});
export const onboardingPlacement = (data) => api.post('/onboarding/placement/', data);
export const onboardingVoterCard = (data) => api.post('/onboarding/voter-card/', data, {
  headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
});
export const getOnboardingStatus = () => api.get('/onboarding/status/');

// Members
export const getMembers = (params) => api.get('/members/', { params });
export const getMember = (id) => api.get(`/members/${id}/`);
export const getMyReferrals = () => api.get('/members/my-referrals/');
export const getMemberDirectory = (params) => api.get('/members/directory/', { params });

// Leadership
export const getLeadership = (params) => api.get('/leadership/', { params });
export const appointLeader = (data) => api.post('/leadership/appoint/', data);
export const getStateLeadership = (stateId) => api.get(`/leadership/state/${stateId}/`);

// Events
export const getEvents = (params) => api.get('/events/', { params });
export const getEvent = (id) => api.get(`/events/${id}/`);
export const createEvent = (data) => api.post('/events/create/', data, {
  headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
});
export const attendEvent = (id) => api.post(`/events/${id}/attend/`);
export const getEventAttendance = (id) => api.get(`/events/${id}/attendance/`);

// Announcements
export const getAnnouncements = (params) => api.get('/announcements/', { params });
export const getAnnouncement = (id) => api.get(`/announcements/${id}/`);
export const markAnnouncementRead = (id) => api.post(`/announcements/${id}/read/`);

// Reports
export const getReports = (params) => api.get('/reports/', { params });
export const getReport = (id) => api.get(`/reports/${id}/`);
export const createReport = (data) => api.post('/reports/create/', data);
export const updateReport = (id, data) => api.patch(`/reports/${id}/update/`, data);
export const submitReport = (id) => api.post(`/reports/${id}/submit/`);

// Dashboard
export const getDashboardOverview = () => api.get('/dashboard/overview/');
export const getMembershipGrowth = (months) => api.get('/dashboard/membership-growth/', { params: { months } });
export const getStructureHealth = () => api.get('/dashboard/structure-health/');
export const getLeaderboard = () => api.get('/dashboard/leaderboard/');
export const getPendingVerifications = () => api.get('/dashboard/admin/pending-verifications/');
export const verifyMember = (id, action) => api.post(`/dashboard/admin/verify-member/${id}/`, { action });

// Leaderboard (V2)
export const getLeaderboardScores = (params) => api.get('/leaderboard/', { params });
export const getMyRank = () => api.get('/leaderboard/my-rank/');

// QR & Network
export const getMyQR = () => api.get('/members/my-qr/');
export const getMyNetwork = () => api.get('/members/my-network/');
export const getMyNetworkTree = (params) => api.get('/members/my-network/tree/', { params });
export const getMyNetworkRecent = () => api.get('/members/my-network/recent/');
export const validateRef = (token) => api.get(`/members/validate-ref/${token}/`);

// Bubbles
export const getBubbles = (params) => api.get('/bubbles/', { params });
export const getBubble = (id) => api.get(`/bubbles/${id}/`);
export const createBubble = (data) => api.post('/bubbles/create/', data, {
  headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
});
export const getMyBubbles = (params) => api.get('/bubbles/my/', { params });
export const addBubbleImage = (id, data) => api.post(`/bubbles/${id}/images/`, data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

// Admin Bubbles
export const getAdminBubbles = (params) => api.get('/bubbles/admin/', { params });
export const getAdminBubble = (id) => api.get(`/bubbles/admin/${id}/`);
export const updateBubbleStatus = (id, data) => api.post(`/bubbles/admin/${id}/status/`, data);
export const deliverBubble = (id, data) => api.post(`/bubbles/admin/${id}/deliver/`, data, {
  headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
});

// Opportunities - Professional Profile
export const getMyProfessionalProfile = () => api.get('/opportunities/professional/me/');
export const createProfessionalProfile = (data) => api.post('/opportunities/professional/me/', data);
export const updateProfessionalProfile = (data) => api.patch('/opportunities/professional/me/', data);
export const deleteProfessionalProfile = () => api.delete('/opportunities/professional/me/');

// Opportunities - Talent Profile
export const getMyTalentProfile = () => api.get('/opportunities/talent/me/');
export const createTalentProfile = (data) => api.post('/opportunities/talent/me/', data);
export const updateTalentProfile = (data) => api.patch('/opportunities/talent/me/', data);
export const deleteTalentProfile = () => api.delete('/opportunities/talent/me/');
export const addPortfolioItem = (data) => api.post('/opportunities/talent/me/portfolio/', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const removePortfolioItem = (id) => api.delete(`/opportunities/talent/me/portfolio/${id}/`);

// Opportunities - Business Listings
export const getMyBusinessListings = () => api.get('/opportunities/businesses/me/');
export const createBusinessListing = (data) => api.post('/opportunities/businesses/me/', data, {
  headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
});
export const updateBusinessListing = (id, data) => api.patch(`/opportunities/businesses/me/${id}/`, data);
export const deleteBusinessListing = (id) => api.delete(`/opportunities/businesses/me/${id}/`);
export const addBusinessImage = (id, data) => api.post(`/opportunities/businesses/${id}/images/`, data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const removeBusinessImage = (bizId, imgId) => api.delete(`/opportunities/businesses/${bizId}/images/${imgId}/`);

// Opportunities - Directory / Search
export const searchProfessionals = (params) => api.get('/opportunities/professionals/', { params });
export const searchTalents = (params) => api.get('/opportunities/talents/', { params });
export const searchBusinesses = (params) => api.get('/opportunities/businesses/', { params });
export const getOpportunityProfile = (userId) => api.get(`/opportunities/profile/${userId}/`);
export const getBusinessDetail = (id) => api.get(`/opportunities/businesses/${id}/`);
export const getSkills = () => api.get('/opportunities/skills/');
export const getTalentCategories = () => api.get('/opportunities/categories/');
export const getBusinessCategories = () => api.get('/opportunities/business-categories/');

// Jobs
export const getJobs = (params) => api.get('/opportunities/jobs/', { params });
export const getJobDetail = (id) => api.get(`/opportunities/jobs/${id}/`);
export const getMyJobListings = () => api.get('/opportunities/jobs/my-listings/');
export const createJobListing = (data) => api.post('/opportunities/jobs/my-listings/', data);
export const updateJobListing = (id, data) => api.patch(`/opportunities/jobs/my-listings/${id}/`, data);
export const deleteJobListing = (id) => api.delete(`/opportunities/jobs/my-listings/${id}/`);
export const changeJobStatus = (id, data) => api.post(`/opportunities/jobs/${id}/status/`, data);
export const applyToJob = (id, data) => api.post(`/opportunities/jobs/${id}/apply/`, data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const getMyApplications = (params) => api.get('/opportunities/jobs/my-applications/', { params });
export const getMyApplicationDetail = (id) => api.get(`/opportunities/jobs/my-applications/${id}/`);
export const withdrawApplication = (id) => api.post(`/opportunities/jobs/my-applications/${id}/withdraw/`);
export const getJobApplications = (jobId, params) => api.get(`/opportunities/jobs/${jobId}/applications/`, { params });
export const getJobApplicationDetail = (jobId, appId) => api.get(`/opportunities/jobs/${jobId}/applications/${appId}/`);
export const updateApplicationStatus = (jobId, appId, data) => api.patch(`/opportunities/jobs/${jobId}/applications/${appId}/`, data);
export const saveJob = (id) => api.post(`/opportunities/jobs/${id}/save/`);
export const getSavedJobs = () => api.get('/opportunities/jobs/saved/');

// Leader Add Member
export const leaderAddMember = (data) => api.post('/members/leader-add/', data);
export const leaderBulkAddMembers = (data) => api.post('/members/leader-add/bulk/', data);

// Member Profile Update
export const updateMyProfile = (data) => api.patch('/members/me/', data, {
  headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
});

// Admin Announcements Create
export const adminCreateAnnouncement = (data) => api.post('/admin/announcements/create/', data);

// Events Update
export const updateEvent = (id, data) => api.patch(`/events/${id}/`, data, {
  headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
});

export default api;
