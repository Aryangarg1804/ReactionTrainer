// src/components/GameControl.jsx
import { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Play, Square, RotateCcw, Zap, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';

const TOAST_OPTS = {
  style: { background: '#0a1520', border: '1px solid rgba(0,245,255,0.2)', color: '#e2e8f0' },
  iconTheme: { primary: '#00f5ff', secondary: '#020408' },
};

const STATE_CFG = {
  start: { label: 'IN PROGRESS', color: '#39ff14' },
  stop:  { label: 'IDLE',        color: '#475569' },
  reset: { label: 'RESETTING',   color: '#ff6b00' },
};

function CmdButton({ icon: Icon, label, color, onClick, disabled, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        padding: '12px 8px', borderRadius: 10, width: '100%',
        border: `1px solid ${disabled ? `${color}18` : `${color}40`}`,
        background: disabled ? 'transparent' : `${color}08`,
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.18s ease',
        outline: 'none',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = `${color}14`; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = `${color}08`; }}
    >
      {loading
        ? <div style={{
            width: 16, height: 16, borderRadius: '50%',
            border: `2px solid ${color}30`, borderTopColor: color,
            animation: 'spin 0.7s linear infinite',
          }} />
        : <Icon size={16} style={{ color }} />
      }
      <span style={{
        fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.68rem',
        color, letterSpacing: '0.08em',
      }}>
        {label}
      </span>
    </button>
  );
}

export default function GameControl({ effectiveOnline = false }) {
  const { currentUser } = useAuth();
  const [gameState, setGameState] = useState('stop');
  const [sending, setSending] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const r = ref(db, `gameControl/${currentUser.uid}/gameState`);
    return onValue(r, snap => { if (snap.exists()) setGameState(snap.val()); });
  }, [currentUser]);

  async function sendCmd(cmd) {
    if (!currentUser || sending) return;
    setSending(cmd);
    try {
      await set(ref(db, `gameControl/${currentUser.uid}/gameState`), cmd);
      const msgs = {
        start: '▶ Game started!',
        stop:  '⏹ Game stopped',
        reset: '🔄 Scores reset',
      };
      toast.success(msgs[cmd], TOAST_OPTS);
    } catch {
      toast.error('Command failed — check connection');
    } finally {
      setSending(null);
    }
  }

  const cfg       = STATE_CFG[gameState] ?? STATE_CFG.stop;
  const isRunning = gameState === 'start';

  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Zap size={14} style={{ color: '#00f5ff' }} />
          <span style={{
            fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '0.82rem',
            color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Game Control
          </span>
        </div>
        {/* State badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: `${cfg.color}10`, border: `1px solid ${cfg.color}28`,
          borderRadius: 4, padding: '2px 8px',
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: cfg.color,
            boxShadow: isRunning ? `0 0 6px ${cfg.color}` : 'none',
            display: 'inline-block',
            animation: isRunning ? 'pulse-slow 2s ease-in-out infinite' : 'none',
          }} />
          <span style={{
            fontFamily: 'Share Tech Mono', fontSize: '0.55rem',
            color: cfg.color, letterSpacing: '0.08em',
          }}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Offline warning */}
      {!effectiveOnline && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.18)',
          borderRadius: 6, padding: '6px 10px', marginBottom: 12,
        }}>
          <WifiOff size={11} style={{ color: '#ff6b00', flexShrink: 0 }} />
          <p style={{ fontFamily: 'Share Tech Mono', fontSize: '0.56rem', color: '#ff6b00' }}>
            ESP32 offline — command queued until device connects
          </p>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <CmdButton
          icon={Play}
          label="START"
          color="#39ff14"
          onClick={() => sendCmd('start')}
          disabled={isRunning || !!sending}
          loading={sending === 'start'}
        />
        <CmdButton
          icon={Square}
          label="STOP"
          color="#ff0040"
          onClick={() => sendCmd('stop')}
          disabled={!isRunning || !!sending}
          loading={sending === 'stop'}
        />
        <CmdButton
          icon={RotateCcw}
          label="RESET"
          color="#ff6b00"
          onClick={() => sendCmd('reset')}
          disabled={!!sending}
          loading={sending === 'reset'}
        />
      </div>

      <p style={{
        fontFamily: 'Share Tech Mono', fontSize: '0.52rem',
        color: '#1e293b', textAlign: 'center', marginTop: 10,
      }}>
        Commands written to Firebase → ESP32 reads every loop cycle
      </p>
    </div>
  );
}
