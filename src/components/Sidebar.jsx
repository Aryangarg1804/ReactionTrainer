// src/components/Sidebar.jsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Trophy, User, Settings, LogOut,
  Menu, X, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEsp32Status } from '../hooks/useUserStats';
import toast from 'react-hot-toast';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leaderboard', icon: Trophy,          label: 'Leaderboard' },
  { to: '/profile',    icon: User,             label: 'Profile' },
  { to: '/settings',   icon: Settings,         label: 'Settings' },
];

export default function Sidebar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { effectiveOnline, recentlyActive, lastSeenLabel } = useEsp32Status();

  async function handleLogout() {
    try {
      await logout();
      toast.success('Session terminated');
      navigate('/login');
    } catch {
      toast.error('Logout failed');
    }
  }

  const initials = (currentUser?.displayName ?? currentUser?.email ?? 'OP')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-cyan-500/10">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 overflow-hidden">
          <img src="/aryan.png" alt="REACTION TRAINER logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="font-display font-700 text-sm tracking-widest text-cyan-400" style={{fontFamily:'Rajdhani',fontWeight:700,letterSpacing:'0.05em'}}>REACTION TRAINER</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-xs text-slate-600 px-3 pb-2 uppercase tracking-widest" style={{fontFamily:'Share Tech Mono',fontSize:'0.6rem'}}>Navigation</p>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* ESP32 Status Widget */}
      <div className="mx-3 mb-3 glass-card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500 uppercase tracking-wider" style={{fontFamily:'Share Tech Mono',fontSize:'0.6rem'}}>ESP32 Device</span>
          <Activity size={12} className="text-slate-600" />
        </div>
        <div className="flex items-center gap-2">
          {effectiveOnline ? (
            <><span className="online-dot" /><span className="text-xs text-green-400" style={{fontFamily:'Share Tech Mono'}}>ONLINE</span></>
          ) : recentlyActive ? (
            <><span style={{ width:7, height:7, borderRadius:'50%', background:'#ff6b00', boxShadow:'0 0 6px #ff6b00', display:'inline-block', flexShrink:0 }} /><span className="text-xs" style={{fontFamily:'Share Tech Mono',color:'#ff6b00'}}>IDLE</span></>
          ) : (
            <><span className="offline-dot" /><span className="text-xs text-red-400" style={{fontFamily:'Share Tech Mono'}}>OFFLINE</span></>
          )}
        </div>
        <p className="text-xs text-slate-600 mt-1">
          {effectiveOnline
            ? 'Game in progress'
            : recentlyActive
            ? `Last active ${lastSeenLabel}`
            : lastSeenLabel
            ? `Last seen ${lastSeenLabel}`
            : 'Connect hardware to sync'}
        </p>
      </div>

      {/* User + Logout */}
      <div className="border-t border-cyan-500/10 p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-xs font-bold text-dark-900 shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate" style={{fontFamily:'Rajdhani',fontWeight:600}}>
              {currentUser?.displayName ?? 'Operator'}
            </p>
            <p className="text-xs text-slate-600 truncate">{currentUser?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn-cyber btn-outline-cyber w-full mt-2 py-2 text-sm flex items-center justify-center gap-2 rounded-lg"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-dark-800 border-r border-cyan-500/10 h-screen sticky top-0 overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-dark-800/95 border-b border-cyan-500/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded overflow-hidden">
            <img src="/aryan.png" alt="REACTION TRAINER" className="w-full h-full object-cover" />
          </div>
          <span className="font-display font-700 text-cyan-400 text-sm tracking-widest" style={{fontFamily:'Rajdhani',fontWeight:700}}>REACTION TRAINER</span>
        </div>
        <button onClick={() => setMobileOpen(v => !v)} className="text-slate-400 hover:text-cyan-400 transition-colors">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-dark-800 border-r border-cyan-500/10 overflow-y-auto">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
