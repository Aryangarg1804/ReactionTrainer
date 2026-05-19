// src/pages/Leaderboard.jsx
import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, RefreshCw, Zap } from 'lucide-react';
import { getLeaderboard } from '../services/dbService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const RANK_STYLES = [
  { color: '#fbbf24', icon: Crown,  label: '1ST', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)' },
  { color: '#94a3b8', icon: Medal,  label: '2ND', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.15)' },
  { color: '#cd7f32', icon: Medal,  label: '3RD', bg: 'rgba(205,127,50,0.06)',  border: 'rgba(205,127,50,0.15)' },
];

export default function Leaderboard() {
  const { currentUser } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadLeaderboard() {
    try {
      const data = await getLeaderboard(20);
      setPlayers(data);
    } catch {
      // silently fail in demo mode
      setPlayers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadLeaderboard(); }, []);

  function handleRefresh() {
    setRefreshing(true);
    loadLeaderboard();
  }

  if (loading) return <LoadingSpinner fullScreen message="Loading Leaderboard..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-600 uppercase tracking-widest mb-1" style={{fontFamily:'Share Tech Mono',fontSize:'0.65rem'}}>
            Global Rankings
          </p>
          <h1 className="text-3xl font-700 text-white tracking-wide" style={{fontFamily:'Rajdhani',fontWeight:700}}>
            <span className="neon-text">Leader</span>board
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Top reaction trainers worldwide</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-cyber btn-outline-cyber px-4 py-2 rounded-lg text-sm flex items-center gap-2"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Top 3 podium */}
      {players.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-2">
          {players.slice(0, 3).map((player, i) => {
            const rs = RANK_STYLES[i];
            const Icon = rs.icon;
            const isMe = player.uid === currentUser?.uid;
            const initials = (player.name ?? 'OP').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
            return (
              <div
                key={player.uid}
                className={`glass-card p-5 text-center ${i === 0 ? 'order-2' : i === 1 ? 'order-1' : 'order-3'}`}
                style={{ border: `1px solid ${rs.border}`, background: rs.bg }}
              >
                <Icon size={18} className="mx-auto mb-2" style={{ color: rs.color }} />
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-2"
                  style={{ background: `${rs.color}20`, border: `2px solid ${rs.color}40`, color: rs.color, fontFamily:'Rajdhani', fontWeight:700 }}
                >
                  {initials}
                </div>
                <p className="text-sm font-600 text-slate-200 truncate" style={{fontFamily:'Rajdhani',fontWeight:600}}>
                  {player.name ?? 'Operator'}{isMe && ' (You)'}
                </p>
                <p className="text-xs text-slate-500 mb-2 capitalize">{player.currentLevel ?? 'easy'}</p>
                <p className="text-2xl font-700" style={{fontFamily:'Rajdhani',fontWeight:700,color:rs.color}}>
                  {player.bestScore ?? 0}
                </p>
                <p className="text-xs text-slate-600">best score</p>
                <div className="mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{fontFamily:'Rajdhani',fontWeight:700,color:rs.color,background:`${rs.color}15`,border:`1px solid ${rs.color}30`}}>
                    {rs.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-cyan-500/10">
          <Trophy size={15} className="text-cyan-400" />
          <h3 className="text-sm font-600 text-slate-300 uppercase tracking-wider" style={{fontFamily:'Rajdhani',fontWeight:600}}>
            All Players
          </h3>
          <span className="ml-auto text-xs text-slate-600" style={{fontFamily:'Share Tech Mono',fontSize:'0.6rem'}}>
            {players.length} operators
          </span>
        </div>

        {players.length === 0 ? (
          <div className="text-center py-16">
            <Zap size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">No players yet</p>
            <p className="text-slate-700 text-sm mt-1">Be the first to set a score!</p>
          </div>
        ) : (
          <div className="divide-y divide-cyan-500/5">
            {/* Table header */}
            <div className="grid grid-cols-6 gap-3 px-5 py-2.5 bg-cyan-500/3">
              {['Rank','Player','Score','Reaction','Accuracy','Level'].map(h => (
                <span key={h} className="text-xs text-slate-600 uppercase tracking-wider" style={{fontFamily:'Share Tech Mono',fontSize:'0.58rem'}}>{h}</span>
              ))}
            </div>

            {players.map((player, i) => {
              const isMe = player.uid === currentUser?.uid;
              const initials = (player.name ?? 'OP').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
              const rankColors = ['#fbbf24', '#94a3b8', '#cd7f32'];
              const rankColor = rankColors[i] ?? '#475569';
              return (
                <div
                  key={player.uid}
                  className={`grid grid-cols-6 gap-3 items-center px-5 py-3 transition-colors ${isMe ? 'bg-cyan-500/5' : 'hover:bg-cyan-500/2'}`}
                >
                  {/* Rank */}
                  <span className="text-sm font-700" style={{fontFamily:'Rajdhani',fontWeight:700,color:rankColor}}>
                    #{i + 1}
                  </span>

                  {/* Player */}
                  <div className="flex items-center gap-2 col-span-1">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-700 shrink-0"
                      style={{ background: `${rankColor}18`, border: `1px solid ${rankColor}30`, color: rankColor, fontFamily:'Rajdhani', fontWeight:700 }}
                    >
                      {initials}
                    </div>
                    <span className="text-sm text-slate-200 truncate" style={{fontFamily:'Exo 2'}}>
                      {player.name ?? 'Operator'}{isMe && <span className="text-cyan-400 ml-1 text-xs">(You)</span>}
                    </span>
                  </div>

                  {/* Score */}
                  <span className="text-sm font-700 text-yellow-400" style={{fontFamily:'Rajdhani',fontWeight:700}}>
                    {player.bestScore ?? 0}
                  </span>

                  {/* Reaction */}
                  <span className="text-sm text-cyan-400" style={{fontFamily:'Share Tech Mono',fontSize:'0.75rem'}}>
                    {player.bestReaction ? `${player.bestReaction}ms` : '—'}
                  </span>

                  {/* Accuracy */}
                  <span className="text-sm text-green-400" style={{fontFamily:'Share Tech Mono',fontSize:'0.75rem'}}>
                    {player.accuracy ?? 0}%
                  </span>

                  {/* Level */}
                  <span className="text-xs capitalize text-slate-400">{player.currentLevel ?? 'easy'}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
