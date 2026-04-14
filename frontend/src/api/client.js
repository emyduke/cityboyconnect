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

export default api;
