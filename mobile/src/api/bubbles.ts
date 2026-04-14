import api, { unwrap } from './client';

export interface Bubble {
  id: number;
  title: string;
  description: string;
  category: string;
  category_display: string;
  status: string;
  status_display: string;
  state_name: string;
  lga_name: string;
  ward_name: string;
  created_by_name: string;
  created_at: string;
  images_count: number;
  contact_phone?: string;
  contact_whatsapp?: string;
  delivery_notes?: string;
  delivered_at?: string;
  images?: BubbleImage[];
}

export interface BubbleImage {
  id: number;
  image: string;
  image_type: 'REQUEST' | 'DELIVERY';
  caption: string;
  uploaded_at: string;
}

export const getBubbles = (params?: Record<string, any>) =>
  api.get('/bubbles/', { params });

export const getBubble = (id: number) => api.get(`/bubbles/${id}/`);

export const createBubble = (data: FormData) =>
  api.post('/bubbles/create/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getMyBubbles = (params?: Record<string, any>) =>
  api.get('/bubbles/my/', { params });

export const addBubbleImage = (id: number, data: FormData) =>
  api.post(`/bubbles/${id}/images/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getAdminBubbles = (params?: Record<string, any>) =>
  api.get('/bubbles/admin/', { params });

export const getAdminBubble = (id: number) => api.get(`/bubbles/admin/${id}/`);

export const updateBubbleStatus = (id: number, data: Record<string, any>) =>
  api.post(`/bubbles/admin/${id}/status/`, data);

export const deliverBubble = (id: number, data: FormData) =>
  api.post(`/bubbles/admin/${id}/deliver/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
