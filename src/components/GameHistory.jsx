// src/components/GameHistory.jsx
import { Clock, Target, Zap, Award } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const LEVEL_COLORS = {
  easy:    { color: '#39ff14', bg: 'rgba(57,255,20,0.1)',  border: 'rgba(57,255,20,0.25)' },
  medium:  { color: '#00f5ff', bg: 'rgba(0,245,255,0.1)',  border: 'rgba(0,245,255,0.25)' },
  hard:    { color: '#ff6b00', bg: 'rgba(255,107,0,0.1)',  border: 'rgba(255,107,0,0.25)' },
  extreme: { color: '#ff0040', bg: 'rgba(255,0,64,0.1)',   border: 'rgba(255,0,64,0.25)' },
};

function timeAgo(ts) {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function GameHistory({ scores, loading }) {
  if (loading) return <LoadingSpinner />;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider" style={{fontFamily:'Rajdhani'}}>
          Recent Games
        </h3>
        <span className="text-xs text-slate-600" style={{fontFamily:'Share Tech Mono',fontSize:'0.6rem'}}>
          LAST {scores.length}
        </span>
      </div>

      {scores.length === 0 ? (
        <div className="text-center py-8">
          <Zap size={28} className="text-slate-700 mx-auto mb-2" />
          <p className="text-slate-600 text-sm">No games recorded yet</p>
          <p className="text-slate-700 text-xs mt-1">Connect your ESP32 and start playing</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-5 gap-2 px-3 pb-1 border-b border-cyan-500/10">
            {['Score','Reaction','Accuracy','Level','Time'].map(h => (
              <span key={h} className="text-xs text-slate-600 uppercase tracking-wider" style={{fontFamily:'Share Tech Mono',fontSize:'0.58rem'}}>{h}</span>
            ))}
          </div>

          {scores.map((game, i) => {
            const lvl = LEVEL_COLORS[game.level] ?? LEVEL_COLORS.easy;
            return (
              <div
                key={game.id ?? i}
                className="grid grid-cols-5 gap-2 items-center px-3 py-2 rounded-lg hover:bg-cyan-500/3 transition-colors"
                style={{borderLeft: i === 0 ? '2px solid rgba(0,245,255,0.3)' : '2px solid transparent'}}
              >
                <div className="flex items-center gap-1.5">
                  {i === 0 && <Award size={10} className="text-yellow-400" />}
                  <span className="text-sm font-700 text-cyan-400" style={{fontFamily:'Rajdhani',fontWeight:700}}>
                    {game.score ?? 0}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={10} className="text-slate-600" />
                  <span className="text-xs text-slate-300" style={{fontFamily:'Share Tech Mono'}}>
                    {game.reactionTime ? `${game.reactionTime}ms` : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Target size={10} className="text-slate-600" />
                  <span className="text-xs text-slate-300" style={{fontFamily:'Share Tech Mono'}}>
                    {game.accuracy ?? 0}%
                  </span>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full w-fit uppercase"
                  style={{
                    fontFamily:'Rajdhani', fontWeight:700, fontSize:'0.65rem',
                    color: lvl.color, background: lvl.bg, border: `1px solid ${lvl.border}`
                  }}
                >
                  {game.level ?? 'easy'}
                </span>
                <span className="text-xs text-slate-600" style={{fontFamily:'Share Tech Mono',fontSize:'0.6rem'}}>
                  {timeAgo(game.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
