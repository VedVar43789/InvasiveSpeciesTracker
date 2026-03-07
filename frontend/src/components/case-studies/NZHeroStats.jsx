import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Skull, AlertTriangle, Shield, ChevronDown } from 'lucide-react';

// ── Animation variants ────────────────────────────────────────────────────

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// ── Animated Counter ──────────────────────────────────────────────────────

function CountUp({ target, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(id);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(id);
  }, [inView, target, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {count === 0 && target === 0 ? '0' : count.toLocaleString()}{suffix}
    </span>
  );
}

// ── Stats Data ────────────────────────────────────────────────────────────

const NZ_STATS = [
  {
    value: 25,
    suffix: 'M',
    label: 'Native Birds Killed',
    sublabel: 'every year by introduced predators',
    color: 'text-red-400',
    icon: Skull,
    iconColor: 'text-red-400',
  },
  {
    value: 70,
    suffix: 'M',
    label: 'Possum Population',
    sublabel: 'at its peak in the 1980s',
    color: 'text-orange-400',
    icon: AlertTriangle,
    iconColor: 'text-orange-400',
  },
  {
    value: 0,
    suffix: '',
    label: 'Native Land Mammals',
    sublabel: 'before human arrival',
    color: 'text-emerald-400',
    icon: Shield,
    iconColor: 'text-emerald-400',
  },
];

// ── Main Component ────────────────────────────────────────────────────────

export default function NZHeroStats() {
  return (
    <section className="relative px-6 pt-12 pb-24 border-b border-slate-800/30 overflow-hidden">
      {/* Ambient Background Orbs */}
      <div className="absolute top-20 left-0 w-[600px] h-[600px] bg-red-900/20 rounded-full blur-[120px]" />
      <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-emerald-900/20 rounded-full blur-[120px]" />

      {/* Content */}
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10% 0px' }}
        >
          {/* Overline */}
          <motion.p
            variants={fadeUp}
            className="text-[11px] font-body uppercase tracking-[0.3em] text-emerald-400/70 mb-3"
          >
            Case Study
          </motion.p>

          {/* Title */}
          <motion.h2
            variants={fadeUp}
            className="text-4xl md:text-6xl font-display text-white leading-[1.1] tracking-tight"
          >
            New Zealand's Mammal Crisis
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl font-body text-slate-400 mt-3 tracking-wide"
          >
            An Evolutionary Mismatch.
          </motion.p>

          {/* Description */}
          <motion.p
            variants={fadeUp}
            className="mt-6 text-[15px] font-body text-slate-400/90 max-w-2xl leading-[1.8]"
          >
            For 80 million years, New Zealand evolved without terrestrial mammals. When rats, stoats, and possums arrived, native birds had no defense against predators they'd never encountered. The result: an extinction crisis that continues to accelerate.
          </motion.p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-15% 0px' }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {NZ_STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                variants={scaleIn}
                className="group relative bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/60 transition-all"
              >
                {/* Icon */}
                <Icon className={`w-8 h-8 ${stat.iconColor} mb-4`} />

                {/* Stat Value */}
                <p className={`text-4xl md:text-5xl font-display ${stat.color} tabular-nums`}>
                  <CountUp target={stat.value} duration={2000} suffix={stat.suffix} />
                </p>

                {/* Stat Label */}
                <p className="text-sm font-body font-medium text-slate-300 mt-3">
                  {stat.label}
                </p>

                {/* Stat Sublabel */}
                <p className="text-xs font-body text-slate-500 mt-1.5 leading-relaxed">
                  {stat.sublabel}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Scroll Anchor */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 0.6 }}
          className="flex flex-col items-center gap-3 mt-20"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-6 h-6 text-slate-400" />
          </motion.div>
          <p className="text-xs font-body text-slate-400 uppercase tracking-wider">
            Explore the Crisis
          </p>
        </motion.div>
      </div>
    </section>
  );
}
