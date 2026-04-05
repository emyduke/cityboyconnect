import api from './client';

export const getDashboardOverview = () => api.get('/dashboard/overview/');

export const getMembershipGrowth = (months?: number) =>
  api.get('/dashboard/membership-growth/', { params: months ? { months } : {} });

export const getStructureHealth = () => api.get('/dashboard/structure-health/');

export const getLeaderboard = () => api.get('/dashboard/leaderboard/');

export const getLeaderboardScores = (params?: Record<string, any>) =>
  api.get('/leaderboard/', { params });

export const getMyRank = () => api.get('/leaderboard/my-rank/');
