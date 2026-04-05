import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AccessDenied from '../pages/AccessDenied';
import Skeleton from '../components/Skeleton';

const ROLE_HIERARCHY = {
  MEMBER: 1,
  WARD_COORDINATOR: 2,
  ZONAL_COORDINATOR: 3,
  LGA_COORDINATOR: 4,
  STATE_DIRECTOR: 6,
  NATIONAL_OFFICER: 8,
  SUPER_ADMIN: 10,
};

export default function RequireRole({ minRole, children }) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return (
      <div style={{ padding: '2rem' }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="card" />
      </div>
    );
  }

  if (!user.is_active) {
    return <Navigate to="/suspended" replace />;
  }

  const userLevel = ROLE_HIERARCHY[user.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

  if (userLevel < requiredLevel) {
    return <AccessDenied requiredRole={minRole} userRole={user.role} />;
  }

  return children;
}
