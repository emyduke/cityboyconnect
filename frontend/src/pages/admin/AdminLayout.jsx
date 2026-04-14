import './AdminLayout.css';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { logout as apiLogout } from '../../api/client';
import { useState } from 'react';
import Avatar from '../../components/Avatar';
import Toast from '../../components/Toast';

const ROLE_HIERARCHY = {
  MEMBER: 1, WARD_COORDINATOR: 2, LGA_COORDINATOR: 4,
  STATE_DIRECTOR: 6, NATIONAL_OFFICER: 8, SUPER_ADMIN: 10,
};

const adminNav = [
  { to: '/admin', label: 'Overview', icon: '📊', end: true },
  { to: '/admin/members', label: 'Members', icon: '👥' },
  { to: '/admin/verifications', label: 'Verifications', icon: '✅' },
  { to: '/admin/structure', label: 'Structure', icon: '🏛' },
  { to: '/admin/events', label: 'Events', icon: '📅' },
  { to: '/admin/announcements', label: 'Announcements', icon: '📢' },
  { to: '/admin/reports', label: 'Reports', icon: '📋' },
  { to: '/admin/bubbles', label: 'Bubbles', icon: '🫧' },
];

const superAdminNav = [
  { to: '/admin/audit-log', label: 'Audit Log', icon: '📜' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminLayout() {
  const { user, refreshToken, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isNational = (ROLE_HIERARCHY[user?.role] || 0) >= ROLE_HIERARCHY.NATIONAL_OFFICER;

  const handleLogout = async () => {
    try { await apiLogout(refreshToken); } catch { /* ok */ }
    storeLogout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <Toast />
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar__header">
          <span className="admin-sidebar__brand">Admin Panel</span>
          <button className="admin-sidebar__close" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="admin-sidebar__nav">
          {adminNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="admin-sidebar__icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {(isSuperAdmin || isNational) && (
            <>
              <div className="admin-sidebar__divider" />
              <span className="admin-sidebar__section-label">Super Admin</span>
              {superAdminNav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="admin-sidebar__icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </>
          )}

          <div className="admin-sidebar__divider" />
          <button className="admin-sidebar__link admin-sidebar__back-btn" onClick={() => navigate('/dashboard')}>
            <span className="admin-sidebar__icon">←</span>
            Member View
          </button>
        </nav>
        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__profile">
            <Avatar name={user?.full_name || ''} size="sm" />
            <div className="admin-sidebar__user-info">
              <span className="admin-sidebar__user-name">{user?.full_name || 'Admin'}</span>
              <span className="admin-sidebar__user-role">{user?.role?.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="admin-sidebar__logout">Logout</button>
        </div>
      </aside>
      {sidebarOpen && <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />}
      <main className="admin-main">
        <header className="admin-topbar">
          <button className="admin-topbar__menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu">☰</button>
          <div className="admin-topbar__spacer" />
          <button className="admin-topbar__member-view" onClick={() => navigate('/dashboard')}>← Member View</button>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
