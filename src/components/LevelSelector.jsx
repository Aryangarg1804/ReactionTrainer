// src/components/LevelSelector.jsx
import { useState } from 'react';
import { Zap, Shield, Swords, Flame } from 'lucide-react';
import { saveLevel, DIFFICULTY_MAP } from '../services/dbService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LEVELS = [
  {
    id: 'easy',
    label: 'Easy',
    icon: Shield,
    color: '#39ff14',
    border: 'border-green-500/40',
    activeBorder: 'border-green-400',
    glow: 'shadow-green-500/20',
    bg: 'hover:bg-green-500/5',
    activeBg: 'bg-green-500/10',
    desc: '3000ms window',
  },
  {
    id: 'medium',
    label: 'Medium',
    icon: Zap,
    color: '#00f5ff',
    border: 'border-cyan-500/40',
    activeBorder: 'border-cyan-400',
    glow: 'shadow-cyan-500/20',
    bg: 'hover:bg-cyan-500/5',
    activeBg: 'bg-cyan-500/10',
    desc: '2000ms window',
  },
  {
    id: 'hard',
    label: 'Hard',
    icon: Swords,
    color: '#ff6b00',
    border: 'border-orange-500/40',
    activeBorder: 'border-orange-400',
    glow: 'shadow-orange-500/20',
    bg: 'hover:bg-orange-500/5',
    activeBg: 'bg-orange-500/10',
    desc: '1500ms window',
  },
  {
    id: 'extreme',
    label: 'Extreme',
    icon: Flame,
    color: '#ff0040',
    border: 'border-red-500/40',
    activeBorder: 'border-red-400',
    glow: 'shadow-red-500/20',
    bg: 'hover:bg-red-500/5',
    activeBg: 'bg-red-500/10',
    desc: '1000ms window',
  },
];

export default function LevelSelector({ currentLevel = 'easy' }) {
  const { currentUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(currentLevel);

  async function handleSelect(levelId) {
    if (levelId === selected || saving) return;
    setSaving(true);
    try {
      await saveLevel(currentUser.uid, levelId);
      setSelected(levelId);
      toast.success(`Level set to ${levelId.toUpperCase()}`, {
        style: { background: '#0a1520', border: '1px solid rgba(0,245,255,0.2)', color: '#e2e8f0' },
        iconTheme: { primary: '#00f5ff', secondary: '#020408' },
      });
    } catch {
      toast.error('Failed to save level');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider" style={{fontFamily:'Rajdhani'}}>
          Difficulty Level
        </h3>
        <span className="text-xs text-slate-600" style={{fontFamily:'Share Tech Mono',fontSize:'0.65rem'}}>
          {DIFFICULTY_MAP[selected]}ms
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {LEVELS.map(({ id, label, icon: Icon, color, border, activeBorder, glow, bg, activeBg, desc }) => {
          const isActive = selected === id;
          return (
            <button
              key={id}
              onClick={() => handleSelect(id)}
              disabled={saving}
              className={`level-btn flex flex-col items-center gap-2 text-center transition-all
                ${isActive ? `${activeBg} ${activeBorder} shadow-lg ${glow} ${isActive ? 'selected' : ''}` : `${border} ${bg} text-slate-400`}
                ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              style={isActive ? { color } : {}}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} style={isActive ? { color } : {}} />
              <span className="text-sm font-700 tracking-wide" style={{fontFamily:'Rajdhani',fontWeight:700}}>{label}</span>
              <span className="text-xs opacity-60" style={{fontFamily:'Share Tech Mono',fontSize:'0.6rem'}}>{desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
