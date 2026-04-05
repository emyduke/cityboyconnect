import api from './client';

export const getReports = (params?: Record<string, any>) =>
  api.get('/reports/', { params });

export const createReport = (data: Record<string, any>) =>
  api.post('/reports/create/', data);

export const submitReport = (id: number) =>
  api.post(`/reports/${id}/submit/`);
