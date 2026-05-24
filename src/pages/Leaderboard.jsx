// src/pages/Leaderboard.jsx
import { useState, useEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { Trophy, Medal, Crown, Clock, Target, BarChart2, Zap, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAllScores } from '../hooks/useUserStats';
import { syncUserAdvancedStats } from '../services/dbService';
import LoadingSpinner from '../components/LoadingSpinner';

// ── Constants ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'overall', label: 'Overall',  color: '#00f5ff', desc: 'All games combined' },
  { key: 'easy',    label: 'Easy',     color: '#39ff14', desc: '3000ms window' },
  { key: 'medium',  label: 'Medium',   color: '#00f5ff', desc: '2000ms window' },
  { key: 'hard',    label: 'Hard',     color: '#ff6b00', desc: '1500ms window' },
  { key: 'extreme', label: 'Extreme',  color: '#ff0040', desc: '1000ms window' },
];

const RANK_STYLES = [
  { color: '#fbbf24', icon: Crown,  label: '1ST', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.22)' },
  { color: '#94a3b8', icon: Medal,  label: '2ND', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.18)' },
  { color: '#cd7f32', icon: Medal,  label: '3RD', bg: 'rgba(205,127,50,0.06)',  border: 'rgba(205,127,50,0.18)' },
];

// ── Ranking logic ─────────────────────────────────────────────────────────────
function rankPlayers(players, tab) {
  return players
    .map(p => {
      if (tab === 'overall') {
        // Fall back to bestScore if avgScore not computed yet
        const score    = p.avgScore    ?? p.bestScore ?? 0;
        const reaction = p.avgReaction ?? 9999;
        const accuracy = p.avgAccuracy ?? p.accuracy ?? 0;
        const games    = p.totalGames  ?? 0;
        return {
          ...p,
          _score: score, _reaction: reaction, _accuracy: accuracy, _games: games,
          display: {
            score:    `${Number(score).toFixed(score % 1 === 0 ? 0 : 1)}`,
            reaction: reaction < 9999 ? `${reaction}ms` : '—',
            accuracy: `${Number(accuracy).toFixed(accuracy % 1 === 0 ? 0 : 1)}%`,
            games,
            scoreLabel: p.avgScore ? 'Avg Score' : 'Best Score',
          },
        };
      } else {
        const ls = p.levelStats?.[tab];
        if (!ls) return null; // didn't play this level
        return {
          ...p,
          _score: ls.avgScore    ?? 0,
          _reaction: ls.avgReaction ?? 9999,
          _accuracy: ls.avgAccuracy ?? 0,
          _games:    ls.games       ?? 0,
          display: {
            score:    `${ls.avgScore}`,
            reaction: ls.avgReaction ? `${ls.avgReaction}ms` : '—',
            accuracy: `${ls.avgAccuracy}%`,
            games:    ls.games,
            scoreLabel: 'Avg Score',
          },
        };
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b._score    !== a._score)    return b._score    - a._score;
      if (a._reaction !== b._reaction) return a._reaction - b._reaction; // lower = better
      if (b._accuracy !== a._accuracy) return b._accuracy - a._accuracy;
      return b._games - a._games;
    });
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Initials({ name, color, size = 28 }) {
  const text = (name ?? 'OP').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `${color}18`, border: `2px solid ${color}35`,
      color, fontFamily: 'Rajdhani', fontWeight: 700,
      fontSize: size > 36 ? '1rem' : '0.7rem',
      boxShadow: `0 0 10px ${color}18`,
    }}>
      {text}
    </div>
  );
}

function TabBar({ tabs, active, onSelect }) {
  return (
    <div style={{
      display: 'flex', gap: 4, flexWrap: 'wrap',
      background: 'rgba(0,245,255,0.02)',
      border: '1px solid rgba(0,245,255,0.06)',
      borderRadius: 10, padding: 4,
    }}>
      {tabs.map(t => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onSelect(t.key)}
            style={{
              fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.78rem',
              letterSpacing: '0.06em', padding: '5px 14px', borderRadius: 7,
              border: `1px solid ${isActive ? `${t.color}50` : 'transparent'}`,
              background: isActive ? `${t.color}12` : 'transparent',
              color: isActive ? t.color : '#475569',
              cursor: 'pointer', transition: 'all 0.18s ease',
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function RankingCriteria({ tab }) {
  const color = TABS.find(t => t.key === tab)?.color ?? '#00f5ff';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
      fontFamily: 'Share Tech Mono', fontSize: '0.55rem', color: '#334155',
    }}>
      <span>Ranked by:</span>
      {[
        { icon: '📊', label: 'Avg Score' },
        { icon: '⚡', label: 'Avg Reaction' },
        { icon: '🎯', label: 'Accuracy' },
        { icon: '🎮', label: 'Games' },
      ].map((c, i) => (
        <span key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {i > 0 && <span style={{ color: '#1e293b' }}>→</span>}
          <span style={{ color }}>{c.icon} {c.label}</span>
        </span>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Leaderboard() {
  const { currentUser } = useAuth();
  const { allScores }   = useAllScores();
  const [players,  setPlayers]   = useState([]);
  const [loading,  setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('overall');
  const [syncing,  setSyncing]   = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error,    setError]     = useState(null);
  const syncedRef = useRef(false);

  // Sync current user's advanced stats once when scores load
  useEffect(() => {
    if (!currentUser || !allScores.length || syncedRef.current) return;
    syncedRef.current = true;
    setSyncing(true);
    syncUserAdvancedStats(currentUser.uid, allScores)
      .catch(e => console.warn('Stats sync failed:', e))
      .finally(() => setSyncing(false));
  }, [currentUser, allScores]);

  // Real-time listener on all users
  useEffect(() => {
    const r = ref(db, 'users');
    return onValue(r, snap => {
      if (!snap.exists()) { setPlayers([]); setLoading(false); return; }
      const arr = [];
      snap.forEach(child => {
        const val = child.val();
        if (val && typeof val === 'object') arr.push({ uid: child.key, ...val });
      });
      setPlayers(arr);
      setLoading(false);
      setLastUpdated(new Date());
      setError(null);
    }, err => { setError(err.message); setLoading(false); });
  }, []);

  const tab    = TABS.find(t => t.key === activeTab);
  const ranked = rankPlayers(players, activeTab);

  if (loading) return <LoadingSpinner fullScreen message="Loading Leaderboard..." />;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p style={{ fontFamily: 'Share Tech Mono', fontSize: '0.65rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            Global Rankings
          </p>
          <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '2rem', color: '#f1f5f9', lineHeight: 1 }}>
            <span className="neon-text">Leader</span>board
          </h1>
          <p style={{ fontFamily: 'Share Tech Mono', fontSize: '0.65rem', color: '#334155', marginTop: 4 }}>
            {ranked.length} operator{ranked.length !== 1 ? 's' : ''} · {tab.desc}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {syncing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <RefreshCw size={11} style={{ color: '#00f5ff', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.55rem', color: '#00f5ff' }}>Syncing stats…</span>
            </div>
          )}
          {lastUpdated && (
            <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.55rem', color: '#1e293b' }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <div className="glass-card px-3 py-1.5" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className="online-dot" />
            <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.58rem', color: '#39ff14' }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="glass-card p-4" style={{ borderColor: 'rgba(255,0,64,0.2)' }}>
          <p style={{ fontFamily: 'Share Tech Mono', fontSize: '0.6rem', color: '#ff0040' }}>
            ⚠ Firebase rules error — ensure /users node allows authenticated reads. {error}
          </p>
        </div>
      )}

      {/* ── Tab Bar ── */}
      <TabBar tabs={TABS} active={activeTab} onSelect={setActiveTab} />

      {/* ── Ranking criteria hint ── */}
      <RankingCriteria tab={activeTab} />

      {ranked.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <BarChart2 size={40} style={{ color: '#1e293b', margin: '0 auto 12px' }} />
          <p style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '1.1rem', color: '#475569' }}>
            {activeTab === 'overall' ? 'No players yet' : `No ${tab.label} games recorded`}
          </p>
          <p style={{ fontFamily: 'Share Tech Mono', fontSize: '0.6rem', color: '#1e293b', marginTop: 6 }}>
            {activeTab === 'overall'
              ? 'Play a game to appear on the leaderboard!'
              : `Switch to ${tab.label} difficulty and play a game to rank here.`}
          </p>
        </div>
      ) : (
        <>
          {/* ── Top 3 Podium ── */}
          {ranked.length >= 2 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: ranked.length >= 3 ? '1fr 1fr 1fr' : '1fr 1fr',
              gap: 12,
            }}>
              {ranked.slice(0, Math.min(3, ranked.length)).map((player, i) => {
                const rs     = RANK_STYLES[i];
                const Icon   = rs.icon;
                const isMe   = player.uid === currentUser?.uid;
                const d      = player.display;
                const order  = i === 0 ? 2 : i === 1 ? 1 : 3;

                return (
                  <div
                    key={player.uid}
                    className="glass-card p-5 text-center"
                    style={{
                      order,
                      border: `1px solid ${rs.border}`,
                      background: rs.bg,
                      position: 'relative', overflow: 'hidden',
                    }}
                  >
                    {/* Ambient glow */}
                    <div style={{
                      position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
                      width: 120, height: 120, borderRadius: '50%',
                      background: `radial-gradient(circle, ${rs.color}14 0%, transparent 70%)`,
                      pointerEvents: 'none',
                    }} />

                    {isMe && (
                      <span style={{
                        position: 'absolute', top: 8, right: 8,
                        fontFamily: 'Share Tech Mono', fontSize: '0.52rem',
                        color: tab.color, background: `${tab.color}12`,
                        border: `1px solid ${tab.color}25`, borderRadius: 3, padding: '1px 5px',
                      }}>YOU</span>
                    )}

                    <Icon size={20} style={{ color: rs.color, margin: '0 auto 10px', filter: `drop-shadow(0 0 6px ${rs.color})` }} />
                    <Initials name={player.name} color={rs.color} size={48} />

                    <p style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '0.9rem', color: '#e2e8f0', marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {player.name ?? 'Operator'}
                    </p>

                    {/* Score */}
                    <p style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '2.2rem', color: rs.color, lineHeight: 1, textShadow: `0 0 20px ${rs.color}50`, marginTop: 6 }}>
                      {d.score}
                    </p>
                    <p style={{ fontFamily: 'Share Tech Mono', fontSize: '0.52rem', color: '#334155', marginBottom: 10 }}>
                      {d.scoreLabel}
                    </p>

                    {/* Mini stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, borderTop: `1px solid ${rs.color}15`, paddingTop: 8 }}>
                      <div>
                        <p style={{ fontFamily: 'Share Tech Mono', fontSize: '0.48rem', color: '#475569' }}>AVG RT</p>
                        <p style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.9rem', color: rs.color }}>{d.reaction}</p>
                      </div>
                      <div>
                        <p style={{ fontFamily: 'Share Tech Mono', fontSize: '0.48rem', color: '#475569' }}>ACCURACY</p>
                        <p style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.9rem', color: rs.color }}>{d.accuracy}</p>
                      </div>
                    </div>

                    <span style={{
                      display: 'inline-block', marginTop: 10,
                      fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.7rem',
                      letterSpacing: '0.1em', color: rs.color,
                      background: `${rs.color}10`, border: `1px solid ${rs.color}28`,
                      borderRadius: 4, padding: '2px 10px',
                    }}>
                      {rs.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Full Table ── */}
          <div className="glass-card overflow-hidden">
            {/* Table header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', borderBottom: '1px solid rgba(0,245,255,0.07)' }}>
              <Trophy size={14} style={{ color: tab.color }} />
              <span style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '0.82rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {tab.label} Rankings
              </span>
              <span style={{ marginLeft: 'auto', fontFamily: 'Share Tech Mono', fontSize: '0.55rem', color: '#334155' }}>
                {ranked.length} player{ranked.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Column headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: '52px 1fr 90px 100px 90px 70px 60px',
              gap: 8, padding: '8px 20px',
              background: 'rgba(0,245,255,0.02)', borderBottom: '1px solid rgba(0,245,255,0.05)',
            }}>
              {['Rank', 'Player', 'Avg Score', 'Avg RT', 'Accuracy', 'Games', 'Level'].map(h => (
                <span key={h} style={{ fontFamily: 'Share Tech Mono', fontSize: '0.52rem', color: '#334155', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            <div>
              {ranked.map((player, i) => {
                const isMe        = player.uid === currentUser?.uid;
                const rankColors  = ['#fbbf24', '#94a3b8', '#cd7f32'];
                const rankColor   = rankColors[i] ?? '#334155';
                const d           = player.display;
                const LEVEL_COLORS = { easy: '#39ff14', medium: '#00f5ff', hard: '#ff6b00', extreme: '#ff0040' };
                const lvlColor    = LEVEL_COLORS[player.currentLevel] ?? '#475569';

                return (
                  <div
                    key={player.uid}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '52px 1fr 90px 100px 90px 70px 60px',
                      gap: 8, padding: '11px 20px',
                      alignItems: 'center',
                      borderBottom: '1px solid rgba(0,245,255,0.04)',
                      background: isMe ? 'rgba(0,245,255,0.04)' : 'transparent',
                      borderLeft: isMe ? `2px solid ${tab.color}50` : '2px solid transparent',
                      transition: 'background 0.15s',
                      animation: `fadeSlideIn 0.3s ease ${Math.min(i, 10) * 0.025}s both`,
                    }}
                    onMouseEnter={e => { if (!isMe) e.currentTarget.style.background = 'rgba(0,245,255,0.02)'; }}
                    onMouseLeave={e => { if (!isMe) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Rank */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {i < 3 && RANK_STYLES[i] && (() => { const Icon = RANK_STYLES[i].icon; return <Icon size={12} style={{ color: rankColor, flexShrink: 0 }} />; })()}
                      <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.9rem', color: rankColor }}>
                        #{i + 1}
                      </span>
                    </div>

                    {/* Player */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <Initials name={player.name} color={rankColor} size={26} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: 'Exo 2', fontSize: '0.85rem', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {player.name ?? 'Operator'}
                          {isMe && <span style={{ color: tab.color, marginLeft: 6, fontSize: '0.62rem', fontFamily: 'Share Tech Mono' }}>(you)</span>}
                        </p>
                        <p style={{ fontFamily: 'Share Tech Mono', fontSize: '0.52rem', color: '#1e293b' }}>
                          {d.games} game{d.games !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Avg Score */}
                    <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.05rem', color: '#fbbf24', textShadow: '0 0 8px rgba(251,191,36,0.3)' }}>
                      {d.score}
                    </span>

                    {/* Avg Reaction */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={9} style={{ color: '#1e293b' }} />
                      <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.68rem', color: '#00f5ff' }}>
                        {d.reaction}
                      </span>
                    </div>

                    {/* Accuracy */}
                    <div>
                      <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.68rem', color: '#39ff14' }}>
                        {d.accuracy}
                      </span>
                      <div style={{ height: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 1, overflow: 'hidden', marginTop: 3 }}>
                        <div style={{
                          width: `${Math.min(100, player._accuracy ?? 0)}%`, height: '100%',
                          background: '#39ff14', borderRadius: 1,
                          boxShadow: '0 0 4px rgba(57,255,20,0.5)',
                        }} />
                      </div>
                    </div>

                    {/* Games */}
                    <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.65rem', color: '#475569' }}>
                      {d.games}
                    </span>

                    {/* Level */}
                    <span style={{
                      fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.6rem',
                      letterSpacing: '0.05em', textTransform: 'capitalize',
                      color: lvlColor, background: `${lvlColor}10`,
                      border: `1px solid ${lvlColor}22`, borderRadius: 4,
                      padding: '2px 6px', display: 'inline-block', whiteSpace: 'nowrap',
                    }}>
                      {player.currentLevel ?? 'easy'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Footer note ── */}
          <p style={{ fontFamily: 'Share Tech Mono', fontSize: '0.55rem', color: '#1e293b', textAlign: 'center' }}>
            Rankings update live · Your stats sync when you open this page ·
            {activeTab !== 'overall' && ` Only players with ${tab.label} games appear on this tab`}
          </p>
        </>
      )}
    </div>
  );
}
