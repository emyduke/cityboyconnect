import api from './client';

export const requestOTP = (phone_number: string) =>
  api.post('/auth/request-otp/', { phone_number });

export const verifyOTP = (phone_number: string, otp_code: string) =>
  api.post('/auth/verify-otp/', { phone_number, otp_code });

export const getMe = () => api.get('/auth/me/');

export const logout = (refresh: string) =>
  api.post('/auth/logout/', { refresh });
