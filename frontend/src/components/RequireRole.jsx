import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import Skeleton from '../components/Skeleton';
import { useEffect } from 'react';

const ROLE_HIERARCHY = {
  MEMBER: 1,
  WARD_COORDINATOR: 2,
  ZONAL_COORDINATOR: 3,
  LGA_COORDINATOR: 4,
  STATE_DIRECTOR: 6,
  NATIONAL_OFFICER: 8,
  SUPER_ADMIN: 10,
};

export default function RequireRole({ minRole, children, redirectTo = '/dashboard' }) {
  const { user, isAuthenticated } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);

  const userLevel = ROLE_HIERARCHY[user?.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] || 0;
  const denied = user && userLevel < requiredLevel;

  useEffect(() => {
    if (denied) {
      addToast({ type: 'info', message: "You don't have access to that page." });
    }
  }, [denied]);

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

  if (denied) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
