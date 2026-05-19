// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import {
  Trophy, Clock, Target, Gamepad2, Activity,
  Wifi, WifiOff, ChevronRight, TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserStats, useRecentScores, useGameSettings } from '../hooks/useUserStats';
import StatCard from '../components/StatCard';
import LevelSelector from '../components/LevelSelector';
import GameHistory from '../components/GameHistory';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { stats, loading: statsLoading } = useUserStats();
  const { scores, loading: scoresLoading } = useRecentScores(8);
  const { settings } = useGameSettings();
  const [esp32Online, setEsp32Online] = useState(false);

  // Subscribe to live ESP32 status
  useEffect(() => {
    if (!currentUser) return;
    const r = ref(db, `gameSettings/${currentUser.uid}/esp32Online`);
    return onValue(r, snap => setEsp32Online(snap.val() ?? false));
  }, [currentUser]);

  if (statsLoading) return <LoadingSpinner fullScreen message="Loading Dashboard..." />;

  const displayName = currentUser?.displayName
    ?? stats?.name
    ?? currentUser?.email?.split('@')[0]
    ?? 'Operator';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs text-slate-600 uppercase tracking-widest mb-1" style={{fontFamily:'Share Tech Mono',fontSize:'0.65rem'}}>
            {greeting}, operator
          </p>
          <h1 className="text-3xl font-700 text-white tracking-wide" style={{fontFamily:'Rajdhani',fontWeight:700}}>
            Welcome back,{' '}
            <span className="neon-text">{displayName}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {stats?.totalGames ?? 0} games played · Level:{' '}
            <span className="text-cyan-400 capitalize">{stats?.currentLevel ?? 'easy'}</span>
          </p>
        </div>

        {/* ESP32 Status Badge */}
        <div className={`glass-card px-4 py-3 flex items-center gap-3 ${esp32Online ? 'border-green-500/25' : 'border-red-500/15'}`}>
          <div className="flex items-center gap-2">
            {esp32Online
              ? <><span className="online-dot" /><Wifi size={14} className="text-green-400" /></>
              : <><span className="offline-dot" /><WifiOff size={14} className="text-red-400" /></>
            }
          </div>
          <div>
            <p className="text-xs font-600 uppercase tracking-wider" style={{fontFamily:'Rajdhani',fontWeight:600,color: esp32Online ? '#39ff14':'#ff0040'}}>
              ESP32 {esp32Online ? 'Online' : 'Offline'}
            </p>
            <p className="text-xs text-slate-600">
              {esp32Online ? 'Ready to play' : 'Connect hardware'}
            </p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Best Score"
          value={stats?.bestScore ?? 0}
          icon={Trophy}
          accent="#fbbf24"
          sub="All-time high"
        />
        <StatCard
          label="Best Reaction"
          value={stats?.bestReaction ? `${stats.bestReaction}` : '—'}
          unit={stats?.bestReaction ? 'ms' : ''}
          icon={Clock}
          accent="#00f5ff"
          sub="Fastest response"
        />
        <StatCard
          label="Accuracy"
          value={`${stats?.accuracy ?? 0}`}
          unit="%"
          icon={Target}
          accent="#39ff14"
          sub="Hit rate avg"
        />
        <StatCard
          label="Total Games"
          value={stats?.totalGames ?? 0}
          icon={Gamepad2}
          accent="#bf00ff"
          sub="Sessions played"
        />
      </div>

      {/* Level Selector */}
      <LevelSelector currentLevel={stats?.currentLevel ?? settings?.level ?? 'easy'} />

      {/* Bottom grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent games — 2 cols */}
        <div className="lg:col-span-2">
          <GameHistory scores={scores} loading={scoresLoading} />
        </div>

        {/* Quick stats sidebar */}
        <div className="space-y-4">
          {/* Performance trend */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={15} className="text-cyan-400" />
              <h3 className="text-sm font-600 text-slate-300 uppercase tracking-wider" style={{fontFamily:'Rajdhani',fontWeight:600}}>
                Performance
              </h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Best Score',   val: stats?.bestScore ?? 0,   color: '#fbbf24' },
                { label: 'Accuracy',     val: `${stats?.accuracy ?? 0}%`, color: '#39ff14' },
                { label: 'Games Played', val: stats?.totalGames ?? 0,   color: '#bf00ff' },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-cyan-500/5 last:border-0">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-sm font-700" style={{fontFamily:'Rajdhani',fontWeight:700,color}}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ESP32 Commands */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={15} className="text-cyan-400" />
              <h3 className="text-sm font-600 text-slate-300 uppercase tracking-wider" style={{fontFamily:'Rajdhani',fontWeight:600}}>
                Device Info
              </h3>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Firebase Node', val: `users/${currentUser?.uid?.slice(0,8)}...` },
                { label: 'Current Level', val: stats?.currentLevel ?? 'easy' },
                { label: 'Difficulty',    val: `${settings?.difficulty ?? 3000}ms` },
                { label: 'Game State',    val: settings?.gameState ?? 'idle' },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-slate-600">{label}</span>
                  <span className="text-xs text-cyan-400 capitalize" style={{fontFamily:'Share Tech Mono',fontSize:'0.65rem'}}>{val}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-cyan-500/10">
              <p className="text-xs text-slate-600">
                ESP32 reads level from{' '}
                <code className="text-cyan-500/80" style={{fontFamily:'Share Tech Mono',fontSize:'0.6rem'}}>
                  gameSettings/{currentUser?.uid?.slice(0,6)}...
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
