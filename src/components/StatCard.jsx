// src/components/StatCard.jsx
import { useEffect, useRef, useState } from 'react';

function useCountUp(target, duration = 900) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    const num = parseFloat(target);
    if (isNaN(num)) { setDisplay(target); return; }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay((num * eased).toFixed(num % 1 !== 0 ? 1 : 0));
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return display;
}

export default function StatCard({ label, value, unit = '', icon: Icon, accent = '#00f5ff', sub }) {
  const numericVal = typeof value === 'number' ? value : parseFloat(value);
  const isNumeric  = !isNaN(numericVal);
  const animated   = useCountUp(isNumeric ? numericVal : 0);
  const displayVal = isNumeric ? animated : (value ?? '—');

  return (
    <div
      className="glass-card stat-card p-5"
      style={{ '--accent-color': accent, position: 'relative', overflow: 'hidden' }}
    >
      {/* Ambient glow blob */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}15 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div className="flex items-start justify-between mb-3">
        <p
          className="text-xs text-slate-500 uppercase tracking-widest"
          style={{ fontFamily: 'Share Tech Mono', fontSize: '0.62rem' }}
        >
          {label}
        </p>
        {Icon && (
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${accent}20 0%, ${accent}08 100%)`,
              border: `1px solid ${accent}30`,
              boxShadow: `0 0 12px ${accent}15`,
            }}
          >
            <Icon size={15} style={{ color: accent }} strokeWidth={2} />
          </div>
        )}
      </div>

      <div className="flex items-end gap-1">
        <span
          className="text-3xl font-700 leading-none tracking-tight"
          style={{
            fontFamily: 'Rajdhani',
            fontWeight: 700,
            color: accent,
            textShadow: `0 0 20px ${accent}40`,
          }}
        >
          {displayVal}
        </span>
        {unit && (
          <span
            className="text-sm text-slate-500 mb-0.5"
            style={{ fontFamily: 'Share Tech Mono' }}
          >
            {unit}
          </span>
        )}
      </div>

      {sub && (
        <p className="text-xs text-slate-600 mt-1">{sub}</p>
      )}
    </div>
  );
}
