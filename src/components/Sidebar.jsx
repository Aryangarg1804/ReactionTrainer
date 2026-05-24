// src/components/Sidebar.jsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Trophy, User, Settings, LogOut,
  Menu, X, Activity, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useEsp32Status } from '../hooks/useUserStats';
import toast from 'react-hot-toast';

const links = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leaderboard', icon: Trophy,           label: 'Leaderboard' },
  { to: '/profile',     icon: User,             label: 'Profile' },
  { to: '/settings',    icon: Settings,         label: 'Settings' },
];

// Sidebar is always dark bg for visual separation in both themes
const SIDEBAR_BG   = '#1e293b';
const SIDEBAR_TEXT = 'rgba(226,232,240,0.55)';

export default function Sidebar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { effectiveOnline, recentlyActive, lastSeenLabel } = useEsp32Status();
  const { isDark, toggleTheme } = useTheme();

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: SIDEBAR_BG }}>
      {/* ── Logo + Theme Toggle ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
            <img src="/aryan.png" alt="REACTION TRAINER logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <p style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', color: '#00f5ff' }}>
            REACTION TRAINER
          </p>
        </div>

        {/* ── Dark / Light toggle ── */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 8px', borderRadius: 20,
            background: isDark ? 'rgba(0,245,255,0.1)' : 'rgba(251,191,36,0.15)',
            border: `1px solid ${isDark ? 'rgba(0,245,255,0.2)' : 'rgba(251,191,36,0.35)'}`,
            cursor: 'pointer', outline: 'none', flexShrink: 0,
            transition: 'all 0.25s ease',
          }}
        >
          {isDark
            ? <Sun  size={13} style={{ color: '#fbbf24' }} />
            : <Moon size={13} style={{ color: '#00f5ff' }} />
          }
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <p style={{ fontFamily: 'Share Tech Mono', fontSize: '0.57rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', marginBottom: 6 }}>
          Navigation
        </p>
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

      {/* ── ESP32 Status Widget ── */}
      <div style={{
        margin: '0 10px 10px', padding: '10px 12px', borderRadius: 10,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>ESP32 Device</span>
          <Activity size={11} style={{ color: 'rgba(255,255,255,0.2)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {effectiveOnline ? (
            <><span className="online-dot" /><span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.62rem', color: '#39ff14' }}>ONLINE</span></>
          ) : recentlyActive ? (
            <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff6b00', boxShadow: '0 0 6px #ff6b00', display: 'inline-block', flexShrink: 0 }} /><span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.62rem', color: '#ff6b00' }}>IDLE</span></>
          ) : (
            <><span className="offline-dot" /><span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.62rem', color: '#ff0040' }}>OFFLINE</span></>
          )}
        </div>
        <p style={{ fontFamily: 'Share Tech Mono', fontSize: '0.55rem', color: 'rgba(255,255,255,0.22)', marginTop: 5 }}>
          {effectiveOnline ? 'Game in progress'
            : recentlyActive ? `Last active ${lastSeenLabel}`
            : lastSeenLabel ? `Last seen ${lastSeenLabel}`
            : 'Connect hardware to sync'}
        </p>
      </div>

      {/* ── User + Theme label + Logout ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '12px' }}>
        {/* Theme indicator pill */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 8, padding: '6px 8px', borderRadius: 8,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>
            {isDark ? '🌙  Dark Mode' : '☀️  Light Mode'}
          </span>
          <button
            onClick={toggleTheme}
            style={{
              fontFamily: 'Share Tech Mono', fontSize: '0.52rem',
              color: isDark ? '#fbbf24' : '#00f5ff',
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: 0, textDecoration: 'underline', textUnderlineOffset: 2,
            }}
          >
            Switch
          </button>
        </div>

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px' }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #00b4c8, #0080ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.7rem', color: '#fff',
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '0.82rem', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser?.displayName ?? 'Operator'}
            </p>
            <p style={{ fontFamily: 'Share Tech Mono', fontSize: '0.52rem', color: 'rgba(255,255,255,0.25)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser?.email}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn-cyber btn-outline-cyber"
          style={{
            width: '100%', marginTop: 8, padding: '7px', fontSize: '0.78rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            borderRadius: 8,
          }}
        >
          <LogOut size={13} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col"
        style={{
          width: 220, flexShrink: 0, height: '100vh',
          position: 'sticky', top: 0, overflowY: 'auto',
          background: SIDEBAR_BG, borderRight: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar — hidden on desktop (lg:hidden must control display, not inline style) */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between"
        style={{
          padding: '10px 16px',
          background: `${SIDEBAR_BG}f2`,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, overflow: 'hidden' }}>
            <img src="/aryan.png" alt="REACTION TRAINER" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.85rem', color: '#00f5ff', letterSpacing: '0.05em' }}>
            REACTION TRAINER
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={toggleTheme} title="Toggle theme" style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#fbbf24' : '#00f5ff', padding: 4 }}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={() => setMobileOpen(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} className="lg:hidden">
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setMobileOpen(false)} />
          <aside style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 220, overflowY: 'auto' }}>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
