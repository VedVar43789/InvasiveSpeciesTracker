import React from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle } from 'lucide-react';

// ── Animation variants ────────────────────────────────────────────────────

const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 },
  },
};

// ── Species Data ──────────────────────────────────────────────────────────

const PREY_SPECIES = [
  { name: 'Kākāpō', scientific: 'Strigops habroptilus', detail: 'Flightless parrot, nocturnal' },
  { name: 'Kiwi', scientific: 'Apteryx spp.', detail: 'Ground-dwelling, egg size equals 20% body weight' },
  { name: 'Takahē', scientific: 'Porphyrio hochstetteri', detail: 'Flightless rail, thought extinct until 1948' },
];

const PREDATOR_SPECIES = [
  { name: 'Stoat', scientific: 'Mustela erminea', detail: 'Introduced 1884, kills prey larger than itself' },
  { name: 'Ship Rat', scientific: 'Rattus rattus', detail: 'Climbs trees, raids nests, breeds year-round' },
  { name: 'Brushtail Possum', scientific: 'Trichosurus vulpecula', detail: 'Introduced 1837, eats eggs, chicks, and foliage' },
];

// ── Main Component ────────────────────────────────────────────────────────

export default function EvolutionaryMismatch() {
  return (
    <section className="py-28 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 to-transparent" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10% 0px' }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <h3 className="text-4xl font-display text-white mb-4 tracking-tight">
            The Evolutionary Mismatch
          </h3>
          <p className="text-slate-400 font-body text-lg max-w-2xl mx-auto leading-relaxed">
            80 million years of evolution without terrestrial predators made New Zealand's birds extraordinarily vulnerable.
          </p>
        </motion.div>

        {/* Two-Column Comparison */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Left Column - The Prey */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-15% 0px' }}
            variants={slideInLeft}
            className="relative group"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-cyan-500/[0.05] to-transparent rounded-3xl blur-2xl group-hover:from-emerald-500/[0.12] transition-all duration-500" />
            
            {/* Card content */}
            <div className="relative bg-slate-900/40 backdrop-blur-sm border border-slate-700/30 rounded-3xl p-8 hover:border-emerald-500/30 transition-all duration-300">
              {/* Icon */}
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Shield className="w-6 h-6 text-emerald-400" />
                </div>
                <h4 className="text-2xl font-display text-white">The Prey</h4>
              </div>

              {/* Description */}
              <p className="text-slate-400 font-body text-sm leading-relaxed mb-6">
                For millions of years, New Zealand's birds evolved in isolation. With no mammalian predators, many species became flightless, ground-nesting, and had no defensive behaviors against terrestrial hunters.
              </p>

              {/* Species List */}
              <div className="space-y-4">
                {PREY_SPECIES.map((species) => (
                  <div
                    key={species.name}
                    className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/20 hover:bg-slate-800/50 hover:border-emerald-500/20 transition-all group/item"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h5 className="font-body font-semibold text-white group-hover/item:text-emerald-300 transition-colors">
                        {species.name}
                      </h5>
                    </div>
                    <p className="text-xs font-body text-slate-500 italic mb-1">
                      {species.scientific}
                    </p>
                    <p className="text-xs font-body text-slate-400 leading-relaxed">
                      {species.detail}
                    </p>
                  </div>
                ))}
              </div>

              {/* Footer note */}
              <div className="mt-6 pt-4 border-t border-slate-700/30">
                <p className="text-xs font-body text-slate-500 italic">
                  No evolved defense mechanisms against mammalian predators
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Column - The Predators */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-15% 0px' }}
            variants={slideInRight}
            className="relative group"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.08] via-orange-500/[0.05] to-transparent rounded-3xl blur-2xl group-hover:from-red-500/[0.12] transition-all duration-500" />
            
            {/* Card content */}
            <div className="relative bg-slate-900/40 backdrop-blur-sm border border-slate-700/30 rounded-3xl p-8 hover:border-red-500/30 transition-all duration-300">
              {/* Icon */}
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <h4 className="text-2xl font-display text-white">The Predators</h4>
              </div>

              {/* Description */}
              <p className="text-slate-400 font-body text-sm leading-relaxed mb-6">
                Introduced by European settlers for fur trade and pest control, these highly adaptable apex predators found defenseless prey in abundance. With no natural controls, their populations exploded.
              </p>

              {/* Species List */}
              <div className="space-y-4">
                {PREDATOR_SPECIES.map((species) => (
                  <div
                    key={species.name}
                    className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/20 hover:bg-slate-800/50 hover:border-red-500/20 transition-all group/item"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h5 className="font-body font-semibold text-white group-hover/item:text-red-300 transition-colors">
                        {species.name}
                      </h5>
                    </div>
                    <p className="text-xs font-body text-slate-500 italic mb-1">
                      {species.scientific}
                    </p>
                    <p className="text-xs font-body text-slate-400 leading-relaxed">
                      {species.detail}
                    </p>
                  </div>
                ))}
              </div>

              {/* Footer note */}
              <div className="mt-6 pt-4 border-t border-slate-700/30">
                <p className="text-xs font-body text-slate-500 italic">
                  Efficient hunters with no natural predators in New Zealand
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Callout */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10% 0px' }}
          variants={fadeUp}
          className="mt-12 text-center"
        >
          <p className="text-sm font-body text-slate-500 italic max-w-3xl mx-auto leading-relaxed">
            The result: an extinction rate among native birds that is among the highest in the world. Of the 245 bird species present when humans arrived, 51 are now extinct and 76 are threatened or endangered.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
