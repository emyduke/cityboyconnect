import api from './client';

export const getZones = () => api.get('/structure/zones/');
export const getStates = (zone?: string) =>
  api.get('/structure/states/', { params: zone ? { zone } : {} });
export const getLGAs = (stateId: number) =>
  api.get(`/structure/states/${stateId}/lgas/`);
export const getWards = (lgaId: number) =>
  api.get(`/structure/lgas/${lgaId}/wards/`);
export const getUnits = (wardId: number) =>
  api.get(`/structure/wards/${wardId}/units/`);
