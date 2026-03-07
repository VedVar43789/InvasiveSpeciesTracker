import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// ── Population Data ───────────────────────────────────────────────────────

const populationData = [
  { year: '1800', birds: 100, predators: 0, event: 'Pre-European Contact' },
  { year: '1850', birds: 90, predators: 2, event: 'Early Introductions' },
  { year: '1900', birds: 65, predators: 15, event: 'Mustelids (Stoats) Introduced' },
  { year: '1950', birds: 40, predators: 45, event: 'Predator Boom' },
  { year: '1980', birds: 25, predators: 70, event: 'Peak Possum Population' },
  { year: '2000', birds: 20, predators: 50, event: '1080 Drops & Trapping Begin' },
  { year: '2024', birds: 15, predators: 30, event: 'PF2050 Active' },
];

// ── Custom Tooltip ────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg shadow-xl font-body">
      <p className="text-white font-semibold mb-1">{data.year}</p>
      <p className="text-slate-400 text-xs mb-3">{data.event}</p>
      <div className="space-y-1">
        <p className="text-sm">
          <span className="text-emerald-400 font-medium">Native Birds:</span>{' '}
          <span className="text-white">{data.birds}M</span>
        </p>
        <p className="text-sm">
          <span className="text-red-400 font-medium">Predators:</span>{' '}
          <span className="text-white">{data.predators}M</span>
        </p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export default function ExtinctionCross() {
  return (
    <section className="px-6 py-16 border-b border-slate-800/30">
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white tracking-tight mb-2">
              The Extinction Cross
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
              As introduced mammal populations exploded, native bird populations collapsed. The intersection marks the point of accelerating extinctions.
            </p>
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart
              data={populationData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                {/* Emerald gradient for birds */}
                <linearGradient id="birdsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                
                {/* Red gradient for predators */}
                <linearGradient id="predatorsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              
              <XAxis
                dataKey="year"
                stroke="#64748b"
                style={{ fontSize: '12px', fontFamily: 'inherit' }}
              />
              
              <YAxis
                stroke="#64748b"
                style={{ fontSize: '12px', fontFamily: 'inherit' }}
                label={{ value: 'Population (Millions)', angle: -90, position: 'insideLeft', fill: '#64748b', style: { fontSize: '12px' } }}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              {/* Birds Area (Declining) */}
              <Area
                type="monotone"
                dataKey="birds"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#birdsGradient)"
              />
              
              {/* Predators Area (Rising) */}
              <Area
                type="monotone"
                dataKey="predators"
                stroke="#ef4444"
                strokeWidth={3}
                fill="url(#predatorsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex items-center justify-center gap-8 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-sm font-body text-slate-300">Native Birds (Millions)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-sm font-body text-slate-300">Introduced Predators (Millions)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
