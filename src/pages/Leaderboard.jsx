// src/pages/Leaderboard.jsx
import { useState, useEffect } from 'react';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from '../firebase';
import { Trophy, Medal, Crown, RefreshCw, Zap, Clock, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const RANK_STYLES = [
  { color: '#fbbf24', icon: Crown, label: '1ST', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)' },
  { color: '#94a3b8', icon: Medal, label: '2ND', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.15)' },
  { color: '#cd7f32', icon: Medal, label: '3RD', bg: 'rgba(205,127,50,0.06)',  border: 'rgba(205,127,50,0.15)' },
];

const LEVEL_COLORS = {
  easy:    '#39ff14',
  medium:  '#00f5ff',
  hard:    '#ff6b00',
  extreme: '#ff0040',
};

function PlayerInitials({ name, color, size = 'md' }) {
  const initials = (name ?? 'OP').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const dim = size === 'lg' ? 52 : 28;
  const fontSize = size === 'lg' ? '1.1rem' : '0.75rem';
  return (
    <div style={{
      width: dim, height: dim, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `${color}18`, border: `2px solid ${color}35`,
      color, fontFamily: 'Rajdhani', fontWeight: 700, fontSize,
      boxShadow: `0 0 12px ${color}20`,
    }}>
      {initials}
    </div>
  );
}

export default function Leaderboard() {
  const { currentUser } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Real-time listener on /users ordered by bestScore
    const q = query(
      ref(db, 'users'),
      orderByChild('bestScore'),
      limitToLast(50)
    );

    const unsub = onValue(
      q,
      snap => {
        if (!snap.exists()) {
          setPlayers([]);
          setLoading(false);
          setLastUpdated(new Date());
          return;
        }
        const arr = [];
        snap.forEach(child => {
          const val = child.val();
          if (val && typeof val === 'object') {
            arr.push({ uid: child.key, ...val });
          }
        });
        // Firebase returns lowest→highest when using orderByChild + limitToLast
        // Reverse to get highest score first
        arr.reverse();
        setPlayers(arr);
        setLoading(false);
        setLastUpdated(new Date());
        setError(null);
      },
      err => {
        console.error('Leaderboard error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  if (loading) return <LoadingSpinner fullScreen message="Loading Leaderboard..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-slate-600 uppercase tracking-widest mb-1" style={{ fontFamily: 'Share Tech Mono', fontSize: '0.65rem' }}>
            Global Rankings
          </p>
          <h1 className="text-3xl font-700 text-white tracking-wide" style={{ fontFamily: 'Rajdhani', fontWeight: 700 }}>
            <span className="neon-text">Leader</span>board
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Top reaction trainers · Live updates
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="glass-card px-3 py-2 flex items-center gap-2">
            <span className="online-dot" />
            <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.6rem', color: '#39ff14' }}>LIVE</span>
          </div>
          {lastUpdated && (
            <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.58rem', color: '#334155' }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="glass-card p-4 border-red-500/20" style={{ borderColor: 'rgba(255,0,64,0.2)' }}>
          <p className="text-xs text-red-400" style={{ fontFamily: 'Share Tech Mono' }}>
            ⚠ Permission error — update Firebase Rules in console: allow users node read for auth !== null
          </p>
          <p className="text-xs text-slate-600 mt-1">{error}</p>
        </div>
      )}

      {players.length === 0 && !error ? (
        <div className="glass-card p-16 text-center">
          <Zap size={40} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 text-lg" style={{ fontFamily: 'Rajdhani', fontWeight: 600 }}>No players yet</p>
          <p className="text-slate-700 text-sm mt-1">Be the first to set a score with your ESP32!</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {players.length >= 2 && (
            <div className={`grid gap-3 mb-2 ${players.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {players.slice(0, Math.min(3, players.length)).map((player, i) => {
                const rs = RANK_STYLES[i];
                const Icon = rs.icon;
                const isMe = player.uid === currentUser?.uid;
                const lvlColor = LEVEL_COLORS[player.currentLevel] ?? '#00f5ff';
                return (
                  <div
                    key={player.uid}
                    className={`glass-card p-5 text-center ${i === 0 ? 'order-2' : i === 1 ? 'order-1' : 'order-3'}`}
                    style={{ border: `1px solid ${rs.border}`, background: rs.bg, position: 'relative', overflow: 'hidden' }}
                  >
                    {/* Ambient glow */}
                    <div style={{
                      position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
                      width: 100, height: 100, borderRadius: '50%',
                      background: `radial-gradient(circle, ${rs.color}15 0%, transparent 70%)`,
                      pointerEvents: 'none',
                    }} />

                    {isMe && (
                      <div style={{
                        position: 'absolute', top: 8, right: 8,
                        fontFamily: 'Share Tech Mono', fontSize: '0.55rem',
                        color: '#00f5ff', background: 'rgba(0,245,255,0.1)',
                        border: '1px solid rgba(0,245,255,0.2)', borderRadius: 3, padding: '1px 5px',
                      }}>YOU</div>
                    )}

                    <Icon size={20} className="mx-auto mb-3" style={{ color: rs.color, filter: `drop-shadow(0 0 6px ${rs.color})` }} />

                    <PlayerInitials name={player.name} color={rs.color} size="lg" />

                    <p className="text-sm font-600 text-slate-200 truncate mt-2" style={{ fontFamily: 'Rajdhani', fontWeight: 600 }}>
                      {player.name ?? 'Operator'}
                    </p>

                    <div className="flex items-center justify-center gap-1 mb-3">
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: lvlColor, display: 'inline-block', boxShadow: `0 0 4px ${lvlColor}` }} />
                      <p className="text-xs text-slate-500 capitalize">{player.currentLevel ?? 'easy'}</p>
                    </div>

                    <p className="text-3xl font-700" style={{ fontFamily: 'Rajdhani', fontWeight: 700, color: rs.color, textShadow: `0 0 20px ${rs.color}50` }}>
                      {player.bestScore ?? 0}
                    </p>
                    <p className="text-xs text-slate-600 mb-3">best score</p>

                    {/* Mini stats */}
                    <div className="grid grid-cols-2 gap-1 mt-2 pt-2 border-t" style={{ borderColor: `${rs.color}15` }}>
                      <div>
                        <p style={{ fontFamily: 'Share Tech Mono', fontSize: '0.5rem', color: '#475569' }}>AVG RT</p>
                        <p style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.85rem', color: rs.color }}>
                          {player.bestReaction ? `${player.bestReaction}ms` : '—'}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontFamily: 'Share Tech Mono', fontSize: '0.5rem', color: '#475569' }}>ACCURACY</p>
                        <p style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.85rem', color: rs.color }}>
                          {player.accuracy ?? 0}%
                        </p>
                      </div>
                    </div>

                    <span style={{
                      display: 'inline-block', marginTop: 10,
                      fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.75rem',
                      letterSpacing: '0.1em', color: rs.color,
                      background: `${rs.color}12`, border: `1px solid ${rs.color}30`,
                      borderRadius: 4, padding: '2px 10px',
                    }}>
                      {rs.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Table */}
          <div className="glass-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-cyan-500/10">
              <Trophy size={15} className="text-cyan-400" />
              <h3 className="text-sm font-600 text-slate-300 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani', fontWeight: 600 }}>
                All Players
              </h3>
              <span className="ml-auto text-xs text-slate-600" style={{ fontFamily: 'Share Tech Mono', fontSize: '0.6rem' }}>
                {players.length} operator{players.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Column headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '50px 1fr 80px 100px 90px 80px',
              gap: 8, padding: '8px 20px',
              background: 'rgba(0,245,255,0.02)',
              borderBottom: '1px solid rgba(0,245,255,0.05)',
            }}>
              {['Rank', 'Player', 'Score', 'Avg RT', 'Accuracy', 'Level'].map(h => (
                <span key={h} style={{ fontFamily: 'Share Tech Mono', fontSize: '0.55rem', color: '#334155', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {h}
                </span>
              ))}
            </div>

            <div>
              {players.map((player, i) => {
                const isMe = player.uid === currentUser?.uid;
                const rankColors = ['#fbbf24', '#94a3b8', '#cd7f32'];
                const rankColor = rankColors[i] ?? '#475569';
                const lvlColor = LEVEL_COLORS[player.currentLevel] ?? '#475569';

                return (
                  <div
                    key={player.uid}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '50px 1fr 80px 100px 90px 80px',
                      gap: 8, padding: '12px 20px',
                      alignItems: 'center',
                      borderBottom: '1px solid rgba(0,245,255,0.04)',
                      background: isMe ? 'rgba(0,245,255,0.04)' : 'transparent',
                      borderLeft: isMe ? '2px solid rgba(0,245,255,0.4)' : '2px solid transparent',
                      transition: 'background 0.2s',
                      animation: `fadeSlideIn 0.3s ease ${i * 0.03}s both`,
                    }}
                    onMouseEnter={e => { if (!isMe) e.currentTarget.style.background = 'rgba(0,245,255,0.02)'; }}
                    onMouseLeave={e => { if (!isMe) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Rank */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {i < 3 && RANK_STYLES[i]
                        ? (() => { const Icon = RANK_STYLES[i].icon; return <Icon size={14} style={{ color: rankColor }} />; })()
                        : null
                      }
                      <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.9rem', color: rankColor }}>
                        #{i + 1}
                      </span>
                    </div>

                    {/* Player */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <PlayerInitials name={player.name} color={rankColor} size="sm" />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: 'Exo 2', fontSize: '0.875rem', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {player.name ?? 'Operator'}
                          {isMe && <span style={{ color: '#00f5ff', marginLeft: 6, fontSize: '0.7rem', fontFamily: 'Share Tech Mono' }}>(you)</span>}
                        </p>
                        <p style={{ fontFamily: 'Share Tech Mono', fontSize: '0.55rem', color: '#334155' }}>
                          {player.totalGames ?? 0} games
                        </p>
                      </div>
                    </div>

                    {/* Score */}
                    <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.1rem', color: '#fbbf24', textShadow: '0 0 10px rgba(251,191,36,0.3)' }}>
                      {player.bestScore ?? 0}
                    </span>

                    {/* Reaction */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={9} style={{ color: '#334155' }} />
                      <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.7rem', color: '#00f5ff' }}>
                        {player.bestReaction ? `${player.bestReaction}ms avg` : '—'}
                      </span>
                    </div>

                    {/* Accuracy */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.7rem', color: '#39ff14' }}>
                        {player.accuracy ?? 0}%
                      </span>
                      <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, player.accuracy ?? 0)}%`,
                          height: '100%', background: '#39ff14',
                          boxShadow: '0 0 4px rgba(57,255,20,0.6)',
                          borderRadius: 1,
                        }} />
                      </div>
                    </div>

                    {/* Level */}
                    <span style={{
                      fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.65rem',
                      letterSpacing: '0.05em', textTransform: 'capitalize',
                      color: lvlColor, background: `${lvlColor}10`,
                      border: `1px solid ${lvlColor}25`, borderRadius: 4,
                      padding: '2px 7px', display: 'inline-block',
                    }}>
                      {player.currentLevel ?? 'easy'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
