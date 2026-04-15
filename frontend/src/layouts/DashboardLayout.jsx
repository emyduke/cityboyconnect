import './DashboardLayout.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { logout as apiLogout } from '../api/client';
import { useState } from 'react';
import Avatar from '../components/Avatar';
import Toast from '../components/Toast';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/members', label: 'Members', icon: '👥' },
  { to: '/opportunities', label: 'Opportunities', icon: '💼' },
  { to: '/jobs', label: 'Jobs', icon: '📋' },
  { to: '/events', label: 'Events', icon: '📅' },
  { to: '/bubbles', label: 'Bubbles', icon: '🫧' },
  { to: '/announcements', label: 'Announcements', icon: '📢' },
  { to: '/reports', label: 'Reports', icon: '📋' },
  { to: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { to: '/my-qr', label: 'My QR Code', icon: '📱' },
  { to: '/my-network', label: 'My Network', icon: '🌐' },
];

const adminItems = [
  { to: '/admin', label: 'Admin Panel', icon: '⚙️' },
];

export default function DashboardLayout({ children }) {
  const { user, refreshToken, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = user?.role && ['ADMIN', 'SUPER_ADMIN', 'NATIONAL_OFFICER', 'STATE_DIRECTOR'].includes(user.role);

  const handleLogout = async () => {
    try { await apiLogout(refreshToken); } catch { /* ok */ }
    storeLogout();
    navigate('/login');
  };

  return (
    <div className="dash-layout">
      <Toast />
      <aside className={`dash-sidebar ${sidebarOpen ? 'dash-sidebar--open' : ''}`}>
        <div className="dash-sidebar__header">
          <span className="dash-sidebar__brand">City Boy Connect</span>
          <button className="dash-sidebar__close" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="dash-sidebar__nav">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({isActive}) => `dash-sidebar__link ${isActive ? 'dash-sidebar__link--active' : ''}`} onClick={() => setSidebarOpen(false)}>
              <span className="dash-sidebar__icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          {isAdmin && (
            <>
              <div className="dash-sidebar__divider" />
              <span className="dash-sidebar__section-label">Admin</span>
              {adminItems.map(item => (
                <NavLink key={item.to} to={item.to} className={({isActive}) => `dash-sidebar__link ${isActive ? 'dash-sidebar__link--active' : ''}`} onClick={() => setSidebarOpen(false)}>
                  <span className="dash-sidebar__icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>
        <div className="dash-sidebar__footer">
          <NavLink to="/profile" className="dash-sidebar__profile" onClick={() => setSidebarOpen(false)}>
            <Avatar name={user?.full_name || ''} size="sm" />
            <div className="dash-sidebar__user-info">
              <span className="dash-sidebar__user-name">{user?.full_name || 'Member'}</span>
              <span className="dash-sidebar__user-role">{user?.role?.replace('_', ' ') || ''}</span>
            </div>
          </NavLink>
          <button onClick={handleLogout} className="dash-sidebar__logout">Logout</button>
        </div>
      </aside>
      {sidebarOpen && <div className="dash-overlay" onClick={() => setSidebarOpen(false)} />}
      <main className="dash-main">
        <header className="dash-topbar">
          <button className="dash-topbar__menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu">☰</button>
          <div className="dash-topbar__spacer" />
          <span className="dash-topbar__greeting">Welcome, {user?.full_name?.split(' ')[0] || 'Member'}</span>
        </header>
        <div className="dash-content">{children}</div>
      </main>
    </div>
  );
}
