import React from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ── Animation variants ────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 },
  },
};

// ── Chart Data ────────────────────────────────────────────────────────────

const POSSUM_DATA = [
  {
    year: '1837',
    tonnes: 0,
    description: '58 possums introduced from Australia',
  },
  {
    year: '1850',
    tonnes: 50,
    description: 'Population beginning to establish',
  },
  {
    year: '1858',
    tonnes: 200,
    description: 'Population established and spreading',
  },
  {
    year: '1900',
    tonnes: 1500,
    description: 'Rapid expansion across both islands',
  },
  {
    year: '1920',
    tonnes: 3500,
    description: 'Fur trade encourages further releases',
  },
  {
    year: '1940',
    tonnes: 6000,
    description: 'Severe forest damage becomes apparent',
  },
  {
    year: '1960',
    tonnes: 11000,
    description: 'Control efforts begin but prove ineffective',
  },
  {
    year: '1980',
    tonnes: 21000,
    description: 'Peak: 70 million possums',
  },
  {
    year: '2000',
    tonnes: 16000,
    description: 'Intensive control reduces population',
  },
  {
    year: '2020',
    tonnes: 10000,
    description: 'Ongoing management maintains lower levels',
  },
];

// ── Custom Tooltip ────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 shadow-2xl">
      <p className="text-white font-display font-semibold text-sm mb-1">
        {data.year}
      </p>
      <p className="text-red-400 font-body font-bold text-lg mb-2 tabular-nums">
        {data.tonnes.toLocaleString()} tonnes/night
      </p>
      <p className="text-slate-400 font-body text-xs leading-relaxed max-w-[200px]">
        {data.description}
      </p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export default function PossumExplosionChart() {
  return (
    <section className="py-28 px-6 bg-slate-900/20 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.015] to-transparent" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10% 0px' }}
          variants={fadeUp}
          className="mb-12"
        >
          <h2 className="text-2xl font-display font-bold text-white tracking-tight mb-6">
            The Possum Explosion
          </h2>
          
          {/* Bold callout text */}
          <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20">
            <p className="text-xl md:text-2xl font-body text-slate-200 leading-[1.4]">
              By the 1980s, introduced possums were devouring{' '}
              <span className="text-red-400 font-bold">21,000 tonnes</span> of
              native canopy{' '}
              <span className="text-red-400 font-bold">every single night</span>.
            </p>
          </div>

          <p className="text-slate-500 font-body mt-4 text-sm">
            Native vegetation consumed per night by brushtail possum population (1837–2020)
          </p>
        </motion.div>

        {/* Chart */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-15% 0px' }}
          variants={scaleIn}
        >
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart
              data={POSSUM_DATA}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="possumGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              {/* No CartesianGrid for cleaner look */}

              <XAxis
                dataKey="year"
                tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: '"DM Sans", sans-serif' }}
                axisLine={{ stroke: '#1e293b' }}
                tickLine={false}
              />

              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: '"DM Sans", sans-serif' }}
                axisLine={{ stroke: '#1e293b' }}
                tickLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />

              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ef4444', strokeWidth: 1 }} />

              <Area
                type="monotone"
                dataKey="tonnes"
                stroke="#ef4444"
                strokeWidth={2.5}
                fill="url(#possumGradient)"
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Bottom note */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10% 0px' }}
          variants={fadeUp}
          className="mt-8"
        >
          <p className="text-slate-600 text-xs font-body italic">
            Data compiled from New Zealand Department of Conservation reports and ecological surveys. 
            Peak population estimate based on Landcare Research studies (1980s).
          </p>
        </motion.div>
      </div>
    </section>
  );
}
