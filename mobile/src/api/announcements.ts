import api from './client';

export const getAnnouncements = (params?: Record<string, any>) =>
  api.get('/announcements/', { params });

export const getAnnouncement = (id: number) =>
  api.get(`/announcements/${id}/`);

export const markAnnouncementRead = (id: number) =>
  api.post(`/announcements/${id}/read/`);
