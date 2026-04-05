import api from './client';

export const onboardingProfile = (data: FormData | Record<string, any>) =>
  api.post('/onboarding/profile/', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });

export const onboardingPlacement = (data: Record<string, any>) =>
  api.post('/onboarding/placement/', data);

export const onboardingVoterCard = (data: FormData | Record<string, any>) =>
  api.post('/onboarding/voter-card/', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });

export const getOnboardingStatus = () => api.get('/onboarding/status/');
