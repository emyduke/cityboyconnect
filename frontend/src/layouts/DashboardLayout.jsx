import { cn } from '../lib/cn';
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
    <div className="flex min-h-screen">
      <Toast />
      <aside className={cn(
        'w-[260px] bg-forest-dark text-white flex flex-col fixed left-0 top-0 bottom-0 z-[100] transition-transform',
        'max-md:-translate-x-full',
        sidebarOpen && 'max-md:translate-x-0',
      )}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <span className="font-display font-extrabold text-[1.1rem] text-gold">City Boy Connect</span>
          <button className="hidden max-md:block bg-transparent border-none text-white text-xl cursor-pointer" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({isActive}) => cn(
              'flex items-center gap-2.5 px-5 py-2.5 text-white/70 text-[0.9rem] font-medium transition-all no-underline hover:text-white hover:bg-white/5',
              isActive && 'text-gold bg-white/[0.08] border-r-[3px] border-gold',
            )} onClick={() => setSidebarOpen(false)}>
              <span className="text-[1.1rem] w-6 text-center">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          {isAdmin && (
            <>
              <div className="h-px bg-white/10 mx-5 my-3" />
              <span className="block px-5 pb-1 text-[0.65rem] uppercase tracking-[0.1em] text-white/40">Admin</span>
              {adminItems.map(item => (
                <NavLink key={item.to} to={item.to} className={({isActive}) => cn(
                  'flex items-center gap-2.5 px-5 py-2.5 text-white/70 text-[0.9rem] font-medium transition-all no-underline hover:text-white hover:bg-white/5',
                  isActive && 'text-gold bg-white/[0.08] border-r-[3px] border-gold',
                )} onClick={() => setSidebarOpen(false)}>
                  <span className="text-[1.1rem] w-6 text-center">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>
        <div className="px-5 py-3 border-t border-white/10 flex flex-col gap-2.5">
          <NavLink to="/profile" className="flex items-center gap-2.5 no-underline text-white" onClick={() => setSidebarOpen(false)}>
            <Avatar name={user?.full_name || ''} size="sm" />
            <div className="flex flex-col">
              <span className="text-[0.85rem] font-semibold">{user?.full_name || 'Member'}</span>
              <span className="text-[0.7rem] text-white/50 capitalize">{user?.role?.replace('_', ' ') || ''}</span>
            </div>
          </NavLink>
          <button onClick={handleLogout} className="bg-transparent border border-white/20 text-white/70 px-3 py-1.5 rounded text-[0.8rem] cursor-pointer transition-all hover:text-white hover:border-white/40">Logout</button>
        </div>
      </aside>
      {sidebarOpen && <div className="hidden max-md:block fixed inset-0 bg-black/40 z-[99]" onClick={() => setSidebarOpen(false)} />}
      <main className="flex-1 ml-[260px] max-md:ml-0 flex flex-col min-h-screen bg-gray-50">
        <header className="flex items-center px-5 py-3 bg-white border-b border-gray-200 h-[60px] sticky top-0 z-50">
          <button className="hidden max-md:block bg-transparent border-none text-2xl cursor-pointer" onClick={() => setSidebarOpen(true)} aria-label="Open menu">☰</button>
          <div className="flex-1" />
          <span className="text-[0.9rem] text-gray-500">Welcome, {user?.full_name?.split(' ')[0] || 'Member'}</span>
        </header>
        <div className="flex-1 p-5">{children}</div>
      </main>
    </div>
  );
}
