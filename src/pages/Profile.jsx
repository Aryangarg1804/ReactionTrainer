// src/pages/Profile.jsx
import { useState } from 'react';
import { User, Mail, Calendar, Shield, Camera, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserStats, useAllScores } from '../hooks/useUserStats';
import { updateUserProfile } from '../services/dbService';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import toast from 'react-hot-toast';

const LEVEL_LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard', extreme: 'Extreme' };
const LEVEL_COLORS = { easy: '#39ff14', medium: '#00f5ff', hard: '#ff6b00', extreme: '#ff0040' };

export default function Profile() {
  const { currentUser } = useAuth();
  const { stats } = useUserStats();
  const { allScores } = useAllScores();

  // Compute real best avg reaction from all game history
  const validReactions = allScores
    .map(g => g.averageReaction)
    .filter(v => v != null && v > 0);
  const bestAvgReaction = validReactions.length > 0
    ? Math.round(Math.min(...validReactions))
    : null;
  const lastAvgReaction = validReactions.length > 0
    ? Math.round(validReactions[validReactions.length - 1])
    : null;

  const [name, setName] = useState(currentUser?.displayName ?? '');
  const [saving, setSaving] = useState(false);

  const initials = (currentUser?.displayName ?? 'OP')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);

  async function handleSave() {
    if (!name.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      await updateUserProfile(currentUser.uid, { name });
      toast.success('Profile updated', {
        style: { background:'#0a1520', border:'1px solid rgba(0,245,255,0.2)', color:'#e2e8f0' },
        iconTheme: { primary:'#00f5ff', secondary:'#020408' },
      });
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  }

  const verified = currentUser?.emailVerified;
  const joinDate = currentUser?.metadata?.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
    : '—';

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <p className="text-xs text-slate-600 uppercase tracking-widest mb-1" style={{fontFamily:'Share Tech Mono',fontSize:'0.65rem'}}>Account</p>
        <h1 className="text-3xl font-700 text-white tracking-wide" style={{fontFamily:'Rajdhani',fontWeight:700}}>
          <span className="neon-text">Operator</span> Profile
        </h1>
      </div>

      {/* Avatar + info card */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-5 flex-wrap">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-2xl font-700 text-dark-900"
              style={{fontFamily:'Rajdhani',fontWeight:700,boxShadow:'0 0 30px rgba(0,245,255,0.2)'}}
            >
              {initials}
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-dark-600 border border-cyan-500/30 flex items-center justify-center cursor-pointer hover:border-cyan-400 transition-colors">
              <Camera size={10} className="text-cyan-400" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-700 text-white" style={{fontFamily:'Rajdhani',fontWeight:700}}>
              {currentUser?.displayName ?? 'Operator'}
            </h2>
            <p className="text-slate-500 text-sm">{currentUser?.email}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <div className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${verified ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20'}`}
                style={{fontFamily:'Share Tech Mono',fontSize:'0.6rem'}}
              >
                {verified ? <CheckCircle size={10} /> : <Shield size={10} />}
                {verified ? 'Email Verified' : 'Verify Email'}
              </div>
              <div className="text-xs text-slate-600" style={{fontFamily:'Share Tech Mono',fontSize:'0.6rem'}}>
                Joined {joinDate}
              </div>
            </div>
          </div>

          {/* Current level badge */}
          <div className="text-center glass-card px-4 py-3">
            <p className="text-xs text-slate-600 mb-1" style={{fontFamily:'Share Tech Mono',fontSize:'0.6rem'}}>CURRENT LEVEL</p>
            <p className="text-xl font-700 capitalize" style={{fontFamily:'Rajdhani',fontWeight:700,color:LEVEL_COLORS[stats?.currentLevel ?? 'easy']}}>
              {LEVEL_LABELS[stats?.currentLevel ?? 'easy']}
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Best Score',    value: stats?.bestScore ?? 0,                                           color:'#fbbf24' },
          { label:'Best Avg RT',   value: bestAvgReaction ? `${bestAvgReaction}ms` : '—',                 color:'#00f5ff' },
          { label:'Accuracy',      value: `${stats?.accuracy ?? 0}%`,                                     color:'#39ff14' },
          { label:'Total Games',   value: stats?.totalGames ?? 0,                                         color:'#bf00ff' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card p-4 text-center" style={{'--accent-color':color}}>
            <p className="text-xs text-slate-600 mb-1 uppercase" style={{fontFamily:'Share Tech Mono',fontSize:'0.6rem'}}>{label}</p>
            <p className="text-2xl font-700" style={{fontFamily:'Rajdhani',fontWeight:700,color,textShadow:`0 0 15px ${color}40`}}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Edit profile */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-600 text-slate-300 uppercase tracking-wider mb-4" style={{fontFamily:'Rajdhani',fontWeight:600}}>
          Edit Profile
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider" style={{fontFamily:'Share Tech Mono',fontSize:'0.6rem'}}>
              Display Name
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-cyber pl-9"
                placeholder="Your display name"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider" style={{fontFamily:'Share Tech Mono',fontSize:'0.6rem'}}>
              Email Address
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="email"
                value={currentUser?.email ?? ''}
                disabled
                className="input-cyber pl-9 opacity-50 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-slate-700 mt-1">Email cannot be changed here</p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-cyber btn-primary px-6 py-2.5 rounded-lg text-sm flex items-center gap-2"
          >
            {saving
              ? <div className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
              : <><Save size={14} /> Save Changes</>
            }
          </button>
        </div>
      </div>

      {/* Firebase UID info */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={14} className="text-cyan-400" />
          <h3 className="text-sm font-600 text-slate-300 uppercase tracking-wider" style={{fontFamily:'Rajdhani',fontWeight:600}}>
            Device Integration
          </h3>
        </div>
        <p className="text-xs text-slate-600 mb-2">Your Firebase UID (use in ESP32 firmware):</p>
        <code className="block text-xs bg-dark-700 border border-cyan-500/10 rounded-lg px-3 py-2 text-cyan-400 break-all" style={{fontFamily:'Share Tech Mono',fontSize:'0.7rem'}}>
          {currentUser?.uid ?? '—'}
        </code>
        <p className="text-xs text-slate-700 mt-2">
          Configure your ESP32 with this UID to sync scores and read difficulty settings.
        </p>
      </div>
    </div>
  );
}
