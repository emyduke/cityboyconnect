import api from './client';

export const getAuthMethods = (phone?: string) =>
  api.get('/auth/methods/', { params: phone ? { phone } : {} });

export const requestOTP = (data: {
  phone_number: string;
  channel: 'sms' | 'email';
  email?: string;
}) => api.post('/auth/request-otp/', data);

export const verifyOTP = (data: {
  phone_number: string;
  otp_code: string;
  email?: string;
}) => api.post('/auth/verify-otp/', data);

export const loginWithPassword = (data: {
  phone_number: string;
  password: string;
}) => api.post('/auth/login/', data);

export const setPassword = (data: {
  new_password: string;
  confirm_password: string;
  old_password?: string;
}) => api.post('/auth/set-password/', data);

export const getMe = () => api.get('/auth/me/');

export const logout = (refresh: string) =>
  api.post('/auth/logout/', { refresh });
