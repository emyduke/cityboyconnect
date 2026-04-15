import api from './client';

// === Skill / Category Lists ===
export const getSkills = () => api.get('/opportunities/skills/');
export const getTalentCategories = () => api.get('/opportunities/talent-categories/');
export const getBusinessCategories = () => api.get('/opportunities/business-categories/');

// === Professional Profile ===
export const getMyProfessionalProfile = () => api.get('/opportunities/professional/me/');
export const createProfessionalProfile = (data: Record<string, any>) =>
  api.post('/opportunities/professional/me/', data);
export const updateProfessionalProfile = (data: Record<string, any>) =>
  api.patch('/opportunities/professional/me/', data);
export const deleteProfessionalProfile = () =>
  api.delete('/opportunities/professional/me/');
export const uploadProfessionalCV = (formData: FormData) =>
  api.patch('/opportunities/professional/me/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// === Talent Profile ===
export const getMyTalentProfile = () => api.get('/opportunities/talent/me/');
export const createTalentProfile = (data: Record<string, any>) =>
  api.post('/opportunities/talent/me/', data);
export const updateTalentProfile = (data: Record<string, any>) =>
  api.patch('/opportunities/talent/me/', data);
export const deleteTalentProfile = () =>
  api.delete('/opportunities/talent/me/');

// === Talent Portfolio ===
export const addPortfolioItem = (formData: FormData) =>
  api.post('/opportunities/talent/me/portfolio/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deletePortfolioItem = (id: number) =>
  api.delete(`/opportunities/talent/me/portfolio/${id}/`);

// === Business Listings ===
export const getMyBusinessListings = () => api.get('/opportunities/businesses/my/');
export const createBusinessListing = (formData: FormData) =>
  api.post('/opportunities/businesses/my/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const updateBusinessListing = (id: number, formData: FormData) =>
  api.patch(`/opportunities/businesses/my/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteBusinessListing = (id: number) =>
  api.delete(`/opportunities/businesses/my/${id}/`);
export const addBusinessImage = (id: number, formData: FormData) =>
  api.post(`/opportunities/businesses/my/${id}/images/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteBusinessImage = (businessId: number, imageId: number) =>
  api.delete(`/opportunities/businesses/my/${businessId}/images/${imageId}/`);

// === Directory ===
export const getOpportunityProfile = (type: string, userId: number) =>
  api.get(`/opportunities/${type}/${userId}/`);
export const searchTalents = (params?: Record<string, any>) =>
  api.get('/opportunities/talents/', { params });
export const searchProfessionals = (params?: Record<string, any>) =>
  api.get('/opportunities/professionals/', { params });
export const getBusinessDetail = (id: number) =>
  api.get(`/opportunities/businesses/${id}/`);
export const searchBusinesses = (params?: Record<string, any>) =>
  api.get('/opportunities/businesses/', { params });

// === Jobs ===
export const getJobs = (params?: Record<string, any>) =>
  api.get('/opportunities/jobs/', { params });
export const getJobDetail = (id: number) =>
  api.get(`/opportunities/jobs/${id}/`);
export const getMyJobListings = () =>
  api.get('/opportunities/jobs/my-listings/');
export const createJobListing = (data: Record<string, any>) =>
  api.post('/opportunities/jobs/my-listings/', data);
export const updateJobListing = (id: number, data: Record<string, any>) =>
  api.patch(`/opportunities/jobs/my-listings/${id}/`, data);
export const deleteJobListing = (id: number) =>
  api.delete(`/opportunities/jobs/my-listings/${id}/`);
export const changeJobStatus = (id: number, data: { status: string }) =>
  api.post(`/opportunities/jobs/${id}/status/`, data);

// === Job Applications ===
export const applyToJob = (id: number, formData: FormData) =>
  api.post(`/opportunities/jobs/${id}/apply/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const getMyApplications = (params?: Record<string, any>) =>
  api.get('/opportunities/jobs/my-applications/', { params });
export const getMyApplicationDetail = (id: number) =>
  api.get(`/opportunities/jobs/my-applications/${id}/`);
export const withdrawApplication = (id: number) =>
  api.post(`/opportunities/jobs/my-applications/${id}/withdraw/`);

export const getJobApplications = (jobId: number, params?: Record<string, any>) =>
  api.get(`/opportunities/jobs/${jobId}/applications/`, { params });
export const getJobApplicationDetail = (jobId: number, appId: number) =>
  api.get(`/opportunities/jobs/${jobId}/applications/${appId}/`);
export const updateApplicationStatus = (
  jobId: number,
  appId: number,
  data: { status: string; recruiter_notes?: string }
) => api.patch(`/opportunities/jobs/${jobId}/applications/${appId}/`, data);

// === Saved Jobs ===
export const saveJob = (id: number) =>
  api.post(`/opportunities/jobs/${id}/save/`);
export const getSavedJobs = () =>
  api.get('/opportunities/jobs/saved/');

// === Leader Add Member ===
export const leaderAddMember = (data: Record<string, any>) =>
  api.post('/members/leader-add/', data);
export const leaderBulkAddMembers = (data: { members: Record<string, any>[] }) =>
  api.post('/members/leader-add/bulk/', data);

// === Member Profile Update ===
export const updateMemberProfile = (data: Record<string, any>) =>
  api.patch('/members/me/', data);

// === Announcements Create ===
export const createAnnouncement = (data: Record<string, any>) =>
  api.post('/announcements/create/', data);

// === Event Update ===
export const updateEvent = (id: number, data: FormData | Record<string, any>) =>
  api.patch(`/events/${id}/`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
