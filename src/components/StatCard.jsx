// src/components/StatCard.jsx
export default function StatCard({ label, value, unit = '', icon: Icon, accent = '#00f5ff', sub }) {
  return (
    <div
      className="glass-card stat-card p-5"
      style={{ '--accent-color': accent }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-slate-500 uppercase tracking-widest" style={{fontFamily:'Share Tech Mono',fontSize:'0.62rem'}}>
          {label}
        </p>
        {Icon && (
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center opacity-80"
            style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}
          >
            <Icon size={15} style={{ color: accent }} strokeWidth={2} />
          </div>
        )}
      </div>
      <div className="flex items-end gap-1">
        <span
          className="text-3xl font-700 leading-none tracking-tight"
          style={{ fontFamily: 'Rajdhani', fontWeight: 700, color: accent, textShadow: `0 0 20px ${accent}40` }}
        >
          {value ?? '—'}
        </span>
        {unit && (
          <span className="text-sm text-slate-500 mb-0.5" style={{fontFamily:'Share Tech Mono'}}>{unit}</span>
        )}
      </div>
      {sub && (
        <p className="text-xs text-slate-600 mt-1">{sub}</p>
      )}
    </div>
  );
}
