import { cn } from '../../lib/cn';
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
    <div className="flex min-h-screen">
      <Toast />
      <aside className={cn(
        'w-60 bg-forest-dark text-white flex flex-col fixed left-0 top-0 bottom-0 z-[100] transition-transform',
        sidebarOpen ? 'translate-x-0' : 'max-md:-translate-x-full'
      )}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <span className="font-display font-extrabold text-base text-gold">Admin Panel</span>
          <button className="hidden max-md:block bg-transparent border-none text-white text-xl cursor-pointer" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {adminNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn(
                'flex items-center gap-2 px-4 py-2 text-white/70 text-sm font-medium transition-all no-underline hover:text-white hover:bg-white/5',
                isActive && 'text-gold bg-white/[0.08] border-r-[3px] border-gold'
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="text-base w-[22px] text-center">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {(isSuperAdmin || isNational) && (
            <>
              <div className="h-px bg-white/10 mx-4 my-3" />
              <span className="block px-4 py-1 text-[0.65rem] uppercase tracking-wider text-white/40 font-bold">Super Admin</span>
              {superAdminNav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => cn(
                    'flex items-center gap-2 px-4 py-2 text-white/70 text-sm font-medium transition-all no-underline hover:text-white hover:bg-white/5',
                    isActive && 'text-gold bg-white/[0.08] border-r-[3px] border-gold'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="text-base w-[22px] text-center">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </>
          )}

          <div className="h-px bg-white/10 mx-4 my-3" />
          <button className="flex items-center gap-2 px-4 py-2 text-white/70 text-sm font-medium transition-all bg-transparent border-none w-full text-left cursor-pointer font-[inherit] hover:text-white hover:bg-white/5" onClick={() => navigate('/dashboard')}>
            <span className="text-base w-[22px] text-center">←</span>
            Member View
          </button>
        </nav>
        <div className="px-4 py-3 border-t border-white/10 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Avatar name={user?.full_name || ''} size="sm" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white">{user?.full_name || 'Admin'}</span>
              <span className="text-[0.65rem] text-white/50">{user?.role?.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-transparent border border-white/20 text-white/70 px-3 py-1 rounded text-xs cursor-pointer transition-all hover:text-white hover:border-white/40">Logout</button>
        </div>
      </aside>
      {sidebarOpen && <div className="hidden max-md:block fixed inset-0 bg-black/40 z-[99]" onClick={() => setSidebarOpen(false)} />}
      <main className="flex-1 ml-60 max-md:ml-0 flex flex-col min-h-screen bg-gray-50">
        <header className="flex items-center px-4 py-3 bg-white border-b border-gray-200 h-14 sticky top-0 z-50">
          <button className="hidden max-md:block bg-transparent border-none text-2xl cursor-pointer" onClick={() => setSidebarOpen(true)} aria-label="Open menu">☰</button>
          <div className="flex-1" />
          <button className="hidden max-md:inline-flex bg-transparent border border-gray-300 text-forest px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all hover:bg-gray-100" onClick={() => navigate('/dashboard')}>← Member View</button>
        </header>
        <div className="flex-1 p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
