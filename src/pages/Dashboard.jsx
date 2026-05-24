// src/pages/Dashboard.jsx
import {
  Trophy, Clock, Target, Gamepad2, Activity,
  Wifi, WifiOff, TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserStats, useRecentScores, useGameSettings, useAllScores, useEsp32Status } from '../hooks/useUserStats';
import StatCard from '../components/StatCard';
import LevelSelector from '../components/LevelSelector';
import GameHistory from '../components/GameHistory';
import GameControl from '../components/GameControl';
import ProgressChart from '../components/ProgressChart';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { stats, loading: statsLoading } = useUserStats();
  const { scores, loading: scoresLoading } = useRecentScores(10);
  const { allScores, loading: chartLoading } = useAllScores();
  const { settings } = useGameSettings();
  const { effectiveOnline, recentlyActive, lastSeenLabel } = useEsp32Status();

  if (statsLoading) return <LoadingSpinner fullScreen message="Loading Dashboard..." />;

  // Compute real best avg reaction from all stored game scores
  // (ESP32 stores averageReaction per game; stats.bestReaction just overwrites with latest)
  const validReactions = allScores
    .map(g => g.averageReaction)
    .filter(v => v != null && v > 0);
  const bestAvgReaction = validReactions.length > 0
    ? Math.round(Math.min(...validReactions))
    : null;
  const lastAvgReaction = validReactions.length > 0
    ? Math.round(validReactions[validReactions.length - 1])
    : null;

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
        <div style={{ position: 'relative' }}>
          {/* Subtle glow behind header */}
          <div style={{
            position: 'absolute', top: -10, left: -20,
            width: 200, height: 80,
            background: 'radial-gradient(ellipse, rgba(0,245,255,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <p className="text-xs text-slate-600 uppercase tracking-widest mb-1" style={{ fontFamily: 'Share Tech Mono', fontSize: '0.65rem' }}>
            {greeting}, operator
          </p>
          <h1 className="text-3xl font-700 text-white tracking-wide" style={{ fontFamily: 'Rajdhani', fontWeight: 700 }}>
            Welcome back,{' '}
            <span className="neon-text">{displayName}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {stats?.totalGames ?? 0} games played · Level:{' '}
            <span className="text-cyan-400 capitalize">{stats?.currentLevel ?? 'easy'}</span>
          </p>
        </div>

        {/* ESP32 Status Badge */}
        <div className={`glass-card px-4 py-3 flex items-center gap-3`}
          style={{ borderColor: effectiveOnline ? 'rgba(57,255,20,0.25)' : recentlyActive ? 'rgba(255,107,0,0.2)' : 'rgba(255,0,64,0.15)' }}
        >
          <div className="flex items-center gap-2">
            {effectiveOnline ? (
              <><span className="online-dot" /><Wifi size={14} className="text-green-400" /></>
            ) : recentlyActive ? (
              <><span style={{ width:8, height:8, borderRadius:'50%', background:'#ff6b00', boxShadow:'0 0 8px #ff6b00', display:'inline-block' }} /><Wifi size={14} style={{ color:'#ff6b00' }} /></>
            ) : (
              <><span className="offline-dot" /><WifiOff size={14} className="text-red-400" /></>
            )}
          </div>
          <div>
            <p className="text-xs font-600 uppercase tracking-wider" style={{
              fontFamily: 'Rajdhani', fontWeight: 600,
              color: effectiveOnline ? '#39ff14' : recentlyActive ? '#ff6b00' : '#ff0040'
            }}>
              ESP32 {effectiveOnline ? 'Online' : recentlyActive ? 'Idle' : 'Offline'}
            </p>
            <p className="text-xs text-slate-600">
              {effectiveOnline
                ? 'Game in progress'
                : recentlyActive
                ? `Last active ${lastSeenLabel}`
                : lastSeenLabel
                ? `Last seen ${lastSeenLabel}`
                : 'Connect hardware'}
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
          label="Best Avg RT"
          value={bestAvgReaction ?? '—'}
          unit={bestAvgReaction ? 'ms' : ''}
          icon={Clock}
          accent="#00f5ff"
          sub={lastAvgReaction ? `Last game: ${lastAvgReaction}ms` : 'No data yet'}
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

      {/* Progress Chart — full width */}
      <ProgressChart data={allScores} loading={chartLoading} />

      {/* Bottom grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent games — 2 cols */}
        <div className="lg:col-span-2">
          <GameHistory scores={scores} loading={scoresLoading} />
        </div>

        {/* Quick stats sidebar */}
        <div className="space-y-4">
          {/* Game Control Panel */}
          <GameControl effectiveOnline={effectiveOnline} />

          {/* Performance summary */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={15} className="text-cyan-400" />
              <h3 className="text-sm font-600 text-slate-300 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani', fontWeight: 600 }}>
                Performance
              </h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Best Score',   val: stats?.bestScore ?? 0,       color: '#fbbf24' },
                { label: 'Accuracy',     val: `${stats?.accuracy ?? 0}%`,  color: '#39ff14' },
                { label: 'Games Played', val: stats?.totalGames ?? 0,      color: '#bf00ff' },
                { label: 'Best Avg RT',  val: bestAvgReaction ? `${bestAvgReaction}ms` : '—', color: '#00f5ff' },
                { label: 'Last Avg RT',  val: lastAvgReaction  ? `${lastAvgReaction}ms`  : '—', color: '#64748b' },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-cyan-500/5 last:border-0">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-sm font-700" style={{ fontFamily: 'Rajdhani', fontWeight: 700, color }}>
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Device Info */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={15} className="text-cyan-400" />
              <h3 className="text-sm font-600 text-slate-300 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani', fontWeight: 600 }}>
                Device Info
              </h3>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Firebase Node', val: `users/${currentUser?.uid?.slice(0, 8)}...` },
                { label: 'Current Level', val: stats?.currentLevel ?? 'easy' },
                { label: 'Difficulty',    val: `${settings?.difficulty ?? 3000}ms` },
                { label: 'Game State',    val: settings?.gameState ?? 'idle' },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-slate-600">{label}</span>
                  <span className="text-xs text-cyan-400 capitalize" style={{ fontFamily: 'Share Tech Mono', fontSize: '0.65rem' }}>{val}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-cyan-500/10">
              <p className="text-xs text-slate-600">
                ESP32 reads level from{' '}
                <code className="text-cyan-500/80" style={{ fontFamily: 'Share Tech Mono', fontSize: '0.6rem' }}>
                  gameSettings/{currentUser?.uid?.slice(0, 6)}...
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
