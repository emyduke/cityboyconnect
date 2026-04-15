export const ROLE_HIERARCHY = {
  MEMBER: 1,
  WARD_COORDINATOR: 2,
  ZONAL_COORDINATOR: 3,
  LGA_COORDINATOR: 4,
  STATE_DIRECTOR: 6,
  NATIONAL_OFFICER: 8,
  SUPER_ADMIN: 10,
};

export const canCreateEvents = (role) =>
  (ROLE_HIERARCHY[role] ?? 0) >= ROLE_HIERARCHY.WARD_COORDINATOR;

export const canSubmitReports = (role) =>
  (ROLE_HIERARCHY[role] ?? 0) >= ROLE_HIERARCHY.WARD_COORDINATOR;

export const isAdminLevel = (role) =>
  (ROLE_HIERARCHY[role] ?? 0) >= ROLE_HIERARCHY.STATE_DIRECTOR;

export const isSuperAdmin = (role) =>
  role === 'SUPER_ADMIN';

export const canCreateAnnouncements = (role) =>
  (ROLE_HIERARCHY[role] ?? 0) >= ROLE_HIERARCHY.WARD_COORDINATOR;

export const canAddMembers = (role) =>
  (ROLE_HIERARCHY[role] ?? 0) >= ROLE_HIERARCHY.WARD_COORDINATOR;
