// src/components/ProgressChart.jsx
import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart
} from 'recharts';
import { TrendingUp, Zap, Activity, BarChart2 } from 'lucide-react';

const VIEWS = [
  { key: 'score',    label: 'Score',         color: '#00f5ff', unit: 'pts',  dataKey: 'score' },
  { key: 'reaction', label: 'Avg Reaction',   color: '#39ff14', unit: 'ms',  dataKey: 'averageReaction' },
  { key: 'accuracy', label: 'Accuracy',       color: '#bf00ff', unit: '%',   dataKey: 'accuracy' },
];

function CustomTooltip({ active, payload, label, view }) {
  if (!active || !payload?.length) return null;
  const v = VIEWS.find(x => x.key === view);
  const val = payload[0]?.value;
  return (
    <div style={{
      background: 'rgba(6,13,20,0.95)',
      border: `1px solid ${v.color}40`,
      borderRadius: 8,
      padding: '10px 14px',
      fontFamily: 'Share Tech Mono',
      boxShadow: `0 0 20px ${v.color}20`,
    }}>
      <p style={{ color: '#475569', fontSize: '0.6rem', marginBottom: 4 }}>GAME #{label}</p>
      <p style={{ color: v.color, fontSize: '1.1rem', fontFamily: 'Rajdhani', fontWeight: 700 }}>
        {val != null ? `${Number(val).toFixed(val % 1 === 0 ? 0 : 1)}${v.unit}` : '—'}
      </p>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <BarChart2 size={36} className="text-slate-700" />
      <p className="text-slate-500 text-sm">No game data yet</p>
      <p className="text-slate-700 text-xs">Connect your ESP32 and play to see your progress</p>
    </div>
  );
}

function TrendBadge({ data, dataKey, color }) {
  if (data.length < 2) return null;
  const first = data[0]?.[dataKey] ?? 0;
  const last  = data[data.length - 1]?.[dataKey] ?? 0;
  const pct   = first === 0 ? 0 : ((last - first) / first) * 100;
  const up     = pct >= 0;
  return (
    <span
      style={{
        fontSize: '0.65rem',
        fontFamily: 'Share Tech Mono',
        color: up ? '#39ff14' : '#ff0040',
        background: up ? 'rgba(57,255,20,0.08)' : 'rgba(255,0,64,0.08)',
        border: `1px solid ${up ? 'rgba(57,255,20,0.2)' : 'rgba(255,0,64,0.2)'}`,
        borderRadius: 4,
        padding: '2px 6px',
      }}
    >
      {up ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export default function ProgressChart({ data = [], loading }) {
  const [activeView, setActiveView] = useState('score');
  const v = VIEWS.find(x => x.key === activeView);

  // Show all games — only skip if the metric is truly null/undefined
  // Re-index gameNum so x-axis stays sequential (1,2,3...) after filter
  const chartData = data
    .filter(g => g[v.dataKey] != null)
    .map((g, i) => ({ ...g, gameNum: i + 1 }));

  const avgVal = chartData.length
    ? chartData.reduce((s, g) => s + (g[v.dataKey] ?? 0), 0) / chartData.length
    : null;

  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-cyan-400" />
          <h3
            className="text-sm font-600 text-slate-300 uppercase tracking-wider"
            style={{ fontFamily: 'Rajdhani', fontWeight: 600 }}
          >
            Performance Trend
          </h3>
          {!loading && chartData.length > 0 && (
            <TrendBadge data={chartData} dataKey={v.dataKey} color={v.color} />
          )}
        </div>

        {/* View Toggles */}
        <div className="flex items-center gap-1.5">
          {VIEWS.map(vw => (
            <button
              key={vw.key}
              onClick={() => setActiveView(vw.key)}
              style={{
                fontFamily: 'Rajdhani',
                fontWeight: 700,
                fontSize: '0.72rem',
                letterSpacing: '0.06em',
                padding: '4px 10px',
                borderRadius: 6,
                border: `1px solid ${activeView === vw.key ? vw.color + '60' : 'rgba(0,245,255,0.08)'}`,
                background: activeView === vw.key ? `${vw.color}12` : 'transparent',
                color: activeView === vw.key ? vw.color : '#475569',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {vw.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      {!loading && chartData.length > 0 && (
        <div className="flex gap-5 mb-4 flex-wrap">
          {[
            { label: 'GAMES',   val: data.length,                         unit: '' },
            { label: 'AVERAGE', val: avgVal?.toFixed(1),                  unit: v.unit },
            { label: 'BEST',    val: Math.max(...chartData.map(g => g[v.dataKey] ?? 0)).toFixed(v.key === 'accuracy' ? 1 : 0), unit: v.unit },
            { label: 'LATEST',  val: chartData[chartData.length-1]?.[v.dataKey]?.toFixed(1), unit: v.unit },
          ].map(({ label, val, unit }) => (
            <div key={label}>
              <p style={{ fontFamily: 'Share Tech Mono', fontSize: '0.55rem', color: '#475569' }}>{label}</p>
              <p style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.1rem', color: v.color }}>
                {val ?? '—'}<span style={{ fontSize: '0.7rem', color: '#475569', marginLeft: 2 }}>{unit}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="spinner" />
        </div>
      ) : chartData.length === 0 ? (
        <EmptyChart />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${v.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={v.color} stopOpacity={0.18} />
                <stop offset="95%" stopColor={v.color} stopOpacity={0} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(0,245,255,0.04)"
              vertical={false}
            />

            <XAxis
              dataKey="gameNum"
              tick={{ fill: '#334155', fontSize: 10, fontFamily: 'Share Tech Mono' }}
              axisLine={{ stroke: 'rgba(0,245,255,0.06)' }}
              tickLine={false}
              label={{ value: 'Game #', position: 'insideBottom', offset: -2, fill: '#334155', fontSize: 9, fontFamily: 'Share Tech Mono' }}
            />
            <YAxis
              tick={{ fill: '#334155', fontSize: 10, fontFamily: 'Share Tech Mono' }}
              axisLine={false}
              tickLine={false}
              width={40}
            />

            {avgVal != null && (
              <ReferenceLine
                y={avgVal}
                stroke={`${v.color}40`}
                strokeDasharray="4 4"
                label={{ value: 'avg', position: 'right', fill: `${v.color}60`, fontSize: 9, fontFamily: 'Share Tech Mono' }}
              />
            )}

            <Tooltip content={<CustomTooltip view={activeView} />} cursor={{ stroke: `${v.color}20`, strokeWidth: 1 }} />

            <Area
              type="monotone"
              dataKey={v.dataKey}
              stroke={v.color}
              strokeWidth={2}
              fill={`url(#grad-${v.key})`}
              dot={{ fill: v.color, r: 3, strokeWidth: 0, filter: 'url(#glow)' }}
              activeDot={{ fill: v.color, r: 5, strokeWidth: 0, filter: 'url(#glow)' }}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
