import api from './client';

export const getEvents = (params?: Record<string, any>) =>
  api.get('/events/', { params });

export const getEvent = (id: number) => api.get(`/events/${id}/`);

export const createEvent = (data: FormData | Record<string, any>) =>
  api.post('/events/create/', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });

export const attendEvent = (id: number) => api.post(`/events/${id}/attend/`);

export const getEventAttendance = (id: number) =>
  api.get(`/events/${id}/attendance/`);
