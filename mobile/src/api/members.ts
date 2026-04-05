import api from './client';

export const getMembers = (params?: Record<string, any>) =>
  api.get('/members/', { params });

export const getMember = (id: number) => api.get(`/members/${id}/`);

export const getMyReferrals = () => api.get('/members/my-referrals/');

export const getMemberDirectory = (params?: Record<string, any>) =>
  api.get('/members/directory/', { params });

export const getMyQR = () => api.get('/members/my-qr/');

export const getMyNetwork = () => api.get('/members/my-network/');

export const getMyNetworkTree = (params?: Record<string, any>) =>
  api.get('/members/my-network/tree/', { params });

export const getMyNetworkRecent = () => api.get('/members/my-network/recent/');

export const validateRef = (token: string) =>
  api.get(`/members/validate-ref/${token}/`);
