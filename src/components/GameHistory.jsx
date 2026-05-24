// src/components/GameHistory.jsx
import { CheckCircle, XCircle, MinusCircle, Clock, Award, Zap } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const LEVEL_COLORS = {
  easy:    { color: '#39ff14', bg: 'rgba(57,255,20,0.08)',  border: 'rgba(57,255,20,0.2)',  dot: '#39ff14' },
  medium:  { color: '#00f5ff', bg: 'rgba(0,245,255,0.08)',  border: 'rgba(0,245,255,0.2)',  dot: '#00f5ff' },
  hard:    { color: '#ff6b00', bg: 'rgba(255,107,0,0.08)',  border: 'rgba(255,107,0,0.2)',  dot: '#ff6b00' },
  extreme: { color: '#ff0040', bg: 'rgba(255,0,64,0.08)',   border: 'rgba(255,0,64,0.2)',   dot: '#ff0040' },
};

const DIFF_LABELS = {
  3000: 'easy',
  2000: 'medium',
  1500: 'hard',
  1000: 'extreme',
};

function timeAgo(ts) {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function AccuracyBar({ value }) {
  const pct = Math.min(100, Math.max(0, value ?? 0));
  const color = pct >= 80 ? '#39ff14' : pct >= 50 ? '#00f5ff' : '#ff6b00';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: 2,
          boxShadow: `0 0 6px ${color}80`,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.65rem', color, minWidth: 32, textAlign: 'right' }}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

function LevelBadge({ level }) {
  const lvl = LEVEL_COLORS[level] ?? LEVEL_COLORS.easy;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.62rem',
      letterSpacing: '0.06em', textTransform: 'uppercase',
      color: lvl.color, background: lvl.bg,
      border: `1px solid ${lvl.border}`, borderRadius: 4,
      padding: '2px 7px',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: lvl.dot, boxShadow: `0 0 4px ${lvl.dot}` }} />
      {level ?? 'easy'}
    </span>
  );
}

function HitBreakdown({ correct, wrong, miss }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span title="Correct" style={{ display: 'flex', alignItems: 'center', gap: 2, fontFamily: 'Share Tech Mono', fontSize: '0.62rem', color: '#39ff14' }}>
        <CheckCircle size={9} /> {correct ?? 0}
      </span>
      <span title="Wrong" style={{ display: 'flex', alignItems: 'center', gap: 2, fontFamily: 'Share Tech Mono', fontSize: '0.62rem', color: '#ff0040' }}>
        <XCircle size={9} /> {wrong ?? 0}
      </span>
      <span title="Miss" style={{ display: 'flex', alignItems: 'center', gap: 2, fontFamily: 'Share Tech Mono', fontSize: '0.62rem', color: '#ff6b00' }}>
        <MinusCircle size={9} /> {miss ?? 0}
      </span>
    </div>
  );
}

export default function GameHistory({ scores, loading }) {
  if (loading) return <LoadingSpinner />;

  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px 14px',
        borderBottom: '1px solid rgba(0,245,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={14} style={{ color: '#00f5ff' }} />
          <h3 style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '0.85rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            Recent Games
          </h3>
        </div>
        <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.58rem', color: '#334155' }}>
          LAST {scores.length} SESSIONS
        </span>
      </div>

      {scores.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Zap size={28} style={{ color: '#1e293b', margin: '0 auto 10px' }} />
          <p style={{ color: '#475569', fontSize: '0.875rem' }}>No games recorded yet</p>
          <p style={{ color: '#334155', fontSize: '0.75rem', marginTop: 4 }}>Connect your ESP32 and start playing</p>
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '44px 1fr 80px 90px 100px 70px',
            gap: 8,
            padding: '8px 20px',
            background: 'rgba(0,245,255,0.02)',
          }}>
            {['#', 'BREAKDOWN', 'SCORE', 'REACTION', 'ACCURACY', 'WHEN'].map(h => (
              <span key={h} style={{ fontFamily: 'Share Tech Mono', fontSize: '0.55rem', color: '#334155', letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          <div>
            {scores.map((game, i) => {
              const lvlKey = game.level ?? DIFF_LABELS[game.difficulty] ?? 'easy';
              const isLatest = i === 0;
              return (
                <div
                  key={game.id ?? i}
                  className="game-history-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '44px 1fr 80px 90px 100px 70px',
                    gap: 8,
                    padding: '12px 20px',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(0,245,255,0.04)',
                    borderLeft: isLatest ? '2px solid rgba(0,245,255,0.4)' : '2px solid transparent',
                    background: isLatest ? 'rgba(0,245,255,0.02)' : 'transparent',
                    transition: 'background 0.2s',
                    animation: `fadeSlideIn 0.3s ease ${i * 0.05}s both`,
                  }}
                >
                  {/* Rank / Index */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {isLatest
                      ? <Award size={12} style={{ color: '#fbbf24' }} />
                      : <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.62rem', color: '#334155' }}>#{i + 1}</span>
                    }
                  </div>

                  {/* Breakdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <HitBreakdown correct={game.score} wrong={game.wrong} miss={game.miss} />
                    <LevelBadge level={lvlKey} />
                  </div>

                  {/* Score */}
                  <div>
                    <span style={{
                      fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.15rem',
                      color: '#00f5ff', textShadow: '0 0 12px rgba(0,245,255,0.4)',
                    }}>
                      {game.score ?? 0}
                    </span>
                    <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.55rem', color: '#334155', marginLeft: 2 }}>
                      /{game.total ?? 20}
                    </span>
                  </div>

                  {/* Reaction */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={9} style={{ color: '#475569', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.7rem', color: '#94a3b8' }}>
                      {game.averageReaction ? `${Math.round(game.averageReaction)}ms` : '—'}
                    </span>
                  </div>

                  {/* Accuracy bar */}
                  <AccuracyBar value={game.accuracy} />

                  {/* Timestamp */}
                  <span style={{ fontFamily: 'Share Tech Mono', fontSize: '0.58rem', color: '#475569' }}>
                    {timeAgo(game.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
