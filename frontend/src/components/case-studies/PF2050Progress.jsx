import React from 'react';
import { motion } from 'framer-motion';
import { Target, Shield, Sprout } from 'lucide-react';

// ── Animation variants ────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Citation Component ────────────────────────────────────────────────────

function Cite({ href, n }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center text-[9px] text-cyan-400/70 hover:text-cyan-300 align-super ml-0.5 no-underline transition-colors"
      title="View source"
    >
      [{n}]
    </a>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export default function PF2050Progress() {
  return (
    <section className="py-28 px-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-emerald-500/[0.05] to-transparent rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10% 0px' }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <h3 className="text-4xl md:text-5xl font-display text-white mb-4 tracking-tight">
            Predator Free 2050
          </h3>
          <p className="text-slate-400 font-body text-lg max-w-2xl mx-auto leading-relaxed">
            New Zealand's ambitious national goal to eradicate all introduced predators and restore native ecosystems within a generation.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-15% 0px' }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          {/* Card 1: Offshore Islands */}
          <motion.div
            variants={scaleIn}
            className="relative group"
          >
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.1] to-blue-500/[0.05] rounded-3xl blur-xl group-hover:from-cyan-500/[0.15] transition-all duration-500" />
            
            {/* Card */}
            <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/40 rounded-3xl p-8 hover:border-cyan-500/40 transition-all duration-300 h-full">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                  <Shield className="w-8 h-8 text-cyan-400" />
                </div>
              </div>

              {/* Stat */}
              <div className="text-center mb-4">
                <p className="text-5xl font-display font-bold text-white mb-2">
                  117<span className="text-cyan-400">+</span>
                </p>
                <p className="text-sm font-body font-semibold text-slate-300">
                  Offshore Islands Cleared
                </p>
              </div>

              {/* Description */}
              <p className="text-xs font-body text-slate-400 text-center leading-relaxed">
                Island sanctuaries protected from mammalian predators, providing refuge for endangered species
                <Cite href="https://www.doc.govt.nz/nature/pests-and-threats/predator-free-2050/" n={1} />
              </p>
            </div>
          </motion.div>

          {/* Card 2: Mainland Hectares */}
          <motion.div
            variants={scaleIn}
            className="relative group"
          >
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.12] to-green-500/[0.06] rounded-3xl blur-xl group-hover:from-emerald-500/[0.18] transition-all duration-500" />
            
            {/* Card */}
            <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/40 rounded-3xl p-8 hover:border-emerald-500/40 transition-all duration-300 h-full">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <Sprout className="w-8 h-8 text-emerald-400" />
                </div>
              </div>

              {/* Stat with glow effect */}
              <div className="text-center mb-4">
                <p className="text-5xl font-display font-bold text-emerald-400 mb-2 drop-shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                  122,110
                </p>
                <p className="text-sm font-body font-semibold text-slate-300">
                  Hectares Protected
                </p>
              </div>

              {/* Description */}
              <p className="text-xs font-body text-slate-400 text-center leading-relaxed">
                Mainland areas cleared and actively defended with trap networks and surveillance
                <Cite href="https://www.doc.govt.nz/nature/pests-and-threats/predator-free-2050/" n={2} />
              </p>
            </div>
          </motion.div>

          {/* Card 3: 2050 Goal */}
          <motion.div
            variants={scaleIn}
            className="relative group"
          >
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.1] to-pink-500/[0.05] rounded-3xl blur-xl group-hover:from-purple-500/[0.15] transition-all duration-500" />
            
            {/* Card */}
            <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/40 rounded-3xl p-8 hover:border-purple-500/40 transition-all duration-300 h-full">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                  <Target className="w-8 h-8 text-purple-400" />
                </div>
              </div>

              {/* Stat */}
              <div className="text-center mb-4">
                <p className="text-5xl font-display font-bold text-purple-400 mb-2">
                  2050
                </p>
                <p className="text-sm font-body font-semibold text-slate-300 mb-3">
                  Target Year
                </p>
              </div>

              {/* Goal text */}
              <div className="text-center">
                <p className="text-xs font-body font-semibold text-slate-300 mb-2">
                  Goal: 100% Eradication
                </p>
                <p className="text-xs font-body text-slate-400 leading-relaxed">
                  Complete removal of rats, stoats, and possums from New Zealand's mainland
                  <Cite href="https://predatorfreenz.org/" n={3} />
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Info Block */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10% 0px' }}
          variants={fadeUp}
          className="text-center space-y-4"
        >
          {/* Key Strategy */}
          <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-slate-900/40 backdrop-blur-sm border border-slate-700/30">
            <p className="text-sm font-body text-slate-300 leading-relaxed">
              The initiative combines <span className="text-emerald-400 font-semibold">advanced trapping technology</span>, 
              <span className="text-cyan-400 font-semibold"> aerial 1080 poison drops</span>, and 
              <span className="text-purple-400 font-semibold"> community-led local projects</span>. 
              If successful, New Zealand would become the world's first predator-free nation.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
