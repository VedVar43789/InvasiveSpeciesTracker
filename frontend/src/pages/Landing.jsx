import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Globe2, ArrowRight, MapPin, Leaf, AlertTriangle, BarChart3, Search, Layers, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";

// ── Animated text (per-character blur reveal, adapted from EXAMPLE_FRONTEND) ──

function AnimatedWord({ text }) {
  return (
    <span>
      {text.split('').map((char, i) => (
        <motion.span
          key={`${text}-${i}`}
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: i * 0.03, ease: [0.21, 0.47, 0.32, 0.98] }}
          style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
}

// ── Scroll-triggered reveal wrapper ───────────────────────────────────────

function RevealOnScroll({ children, className = '', delay = 0, y = 30 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px 0px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Features data ─────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: MapPin,
    title: 'Click-to-Scan',
    description: 'Click any point on a 3D globe and instantly assess invasive species risk using FAISS similarity search across 160,000+ species.',
  },
  {
    icon: BarChart3,
    title: 'Dynamic Risk Profiles',
    description: 'Risk scores calculated from real-time climate data, soil pH, biome classification, and GBIF occurrence records.',
  },
  {
    icon: Leaf,
    title: 'Species Intelligence',
    description: 'Detailed profiles enriched from iNaturalist, Wikipedia, and Trefle — growth traits, native ranges, and threat status.',
  },
  {
    icon: AlertTriangle,
    title: 'Live Heatmaps',
    description: 'iNaturalist observation heatmaps overlaid on Mapbox to visualize introduced plant density near any location.',
  },
];

// ── Visual card placeholders (one per feature) ───────────────────────────

function ClickToScanVisual() {
  return (
    <div className="relative w-full h-full rounded-2xl border border-slate-700/30 overflow-hidden">
      <img src="/earth-globe.png" alt="Earth globe" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 bg-slate-900/70 backdrop-blur rounded-lg px-3 py-2 border border-slate-700/40">
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs text-slate-400">Click anywhere on the globe...</span>
      </div>
    </div>
  );
}

function RiskProfileVisual() {
  const bars = [
    { label: 'Climate', pct: 82, color: 'bg-cyan-400' },
    { label: 'Soil pH', pct: 64, color: 'bg-blue-400' },
    { label: 'Biome', pct: 91, color: 'bg-indigo-400' },
    { label: 'GBIF', pct: 47, color: 'bg-emerald-400' },
  ];

  return (
    <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/30 overflow-hidden p-6 flex flex-col justify-between">
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Risk Assessment</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-display font-bold text-white">87</span>
          <span className="text-sm text-red-400 font-medium">High Risk</span>
        </div>
      </div>
      <div className="space-y-3 mt-4">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="flex justify-between mb-1">
              <span className="text-[11px] text-slate-500">{b.label}</span>
              <span className="text-[11px] text-slate-400 tabular-nums">{b.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${b.pct}%` }}
                transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className={`h-full rounded-full ${b.color}`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
          <p className="text-lg font-display font-bold text-red-400">342</p>
          <p className="text-[10px] text-red-400/70">High Risk</p>
        </div>
        <div className="flex-1 bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 text-center">
          <p className="text-lg font-display font-bold text-orange-400">518</p>
          <p className="text-[10px] text-orange-400/70">Moderate</p>
        </div>
        <div className="flex-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-center">
          <p className="text-lg font-display font-bold text-yellow-400">1.2K</p>
          <p className="text-[10px] text-yellow-400/70">Low Risk</p>
        </div>
      </div>
    </div>
  );
}

function SpeciesIntelVisual() {
  return (
    <div className="relative w-full h-full rounded-2xl border border-slate-700/30 overflow-hidden">
      <img src="/invasive-plant-2.jpg" alt="Invasive species" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-display font-semibold text-white">Psidium cattleianum</p>
            <p className="text-[11px] text-slate-400">Strawberry Guava · Brazil</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">High Risk</span>
          <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">Invasive</span>
          <span className="text-[10px] bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-full">24,891 obs</span>
        </div>
      </div>
    </div>
  );
}

// Generate heatmap dots once so they don't change on every scroll/re-render
function useHeatmapDots() {
  return useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 70,
      size: 3 + Math.random() * 12,
      opacity: 0.15 + Math.random() * 0.4,
      isHot: Math.random() > 0.5,
    }))
  )[0];
}

function HeatmapVisual() {
  const dots = useHeatmapDots();
  return (
    <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/30 overflow-hidden">
      <div className="absolute inset-0">
        {dots.map((d) => (
          <div
            key={d.id}
            className="absolute rounded-full"
            style={{
              left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size,
              background: d.isHot ? `rgba(239,68,68,${d.opacity})` : `rgba(234,179,8,${d.opacity})`,
              boxShadow: d.isHot ? `0 0 ${d.size * 2}px rgba(239,68,68,${d.opacity * 0.5})` : `0 0 ${d.size}px rgba(234,179,8,${d.opacity * 0.3})`,
            }}
          />
        ))}
        <div className="absolute inset-4 border border-slate-700/20 rounded-lg" />
        <div className="absolute inset-4 grid grid-cols-4 grid-rows-3">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="border border-slate-700/10" />)}
        </div>
      </div>
      <div className="absolute bottom-4 left-4 right-4 bg-slate-900/80 backdrop-blur rounded-lg px-4 py-3 border border-slate-700/40">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-400 font-medium">Introduced Plant Density</p>
          <Layers className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500">Sparse</span>
          <div className="flex-1 h-2 rounded-full" style={{ background: 'linear-gradient(to right, rgba(34,197,94,0.9), rgba(250,204,21,0.9), rgba(234,88,12,0.9), rgba(220,38,38,0.95))' }} />
          <span className="text-[10px] text-slate-500">Dense</span>
        </div>
      </div>
    </div>
  );
}

const VISUALS = [ClickToScanVisual, RiskProfileVisual, SpeciesIntelVisual, HeatmapVisual];

// ── Animated counter (scroll-triggered) ──────────────────────────────────

function AnimatedCounter({ value, suffix = '' }) {
  const [displayValue, setDisplayValue] = useState('0');
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const numericStr = value.replace(/[^0-9.]/g, '');
          const targetNum = parseFloat(numericStr);
          const unit = value.replace(/[0-9.]/g, '');

          let current = 0;
          const increment = targetNum / 60;
          const interval = setInterval(() => {
            current += increment;
            if (current >= targetNum) {
              setDisplayValue(`${targetNum}${unit}`);
              clearInterval(interval);
            } else {
              setDisplayValue(`${current.toFixed(1)}${unit}`.replace('.0', ''));
            }
          }, 16);

          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div className="text-5xl md:text-7xl font-display font-bold tracking-tight" ref={ref}>
      {displayValue}{suffix}
    </div>
  );
}

// ── Global Reach section (map + metrics) ─────────────────────────────────

function GlobalReachSection() {
  return (
    <section id="global-reach" className="relative py-20 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <RevealOnScroll>
            <p className="text-[11px] font-body uppercase tracking-[0.25em] text-cyan-400/60 mb-4 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-glow-pulse" />
              Global Reach
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.1}>
            <h2 className="text-3xl md:text-[48px] md:leading-[1.1] font-display font-semibold tracking-tight mb-4">
              Worldwide Species{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Surveillance</span>
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.2}>
            <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              Track, assess, and predict invasive species risk across every continent with AI-powered analysis spanning 160,000+ species records.
            </p>
          </RevealOnScroll>
        </div>

        <RevealOnScroll delay={0.15} y={40}>
          <div className="relative w-full mb-16">
            <img src="/map.svg" alt="Global coverage map" className="w-full h-auto" />
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
          {[
            { label: 'SPECIES INDEXED', value: '90K+', desc: 'global plant species', color: 'cyan' },
            { label: 'DATA SOURCES', value: '7', desc: 'real-time integrations', color: 'blue' },
            { label: 'RISK FACTORS', value: '12', desc: 'environmental variables', color: 'cyan' },
            { label: 'COVERAGE', value: '99%', desc: 'of terrestrial biomes', color: 'blue' },
          ].map((metric, i) => (
            <RevealOnScroll key={i} delay={i * 0.1} className="text-center py-6 border-t border-slate-800/50">
              <div className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-slate-500 mb-3 flex items-center justify-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${metric.color === 'cyan' ? 'bg-cyan-400/60' : 'bg-blue-400/60'}`} />
                {metric.label}
              </div>
              <AnimatedCounter value={metric.value} />
              <div className="text-[11px] md:text-xs text-slate-500 mt-2">{metric.desc}</div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Feature section with stacked card shuffle + auto-rotation ────────────

function FeatureShowcase() {
  const [selectedFeature, setSelectedFeature] = useState(0);
  const [imageFade, setImageFade] = useState(true);
  const [autoKey, setAutoKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setImageFade(false);
      setTimeout(() => {
        setSelectedFeature((prev) => (prev + 1) % FEATURES.length);
        setImageFade(true);
      }, 300);
    }, 6000);
    return () => clearInterval(interval);
  }, [autoKey]);

  const handleFeatureClick = (i) => {
    setImageFade(false);
    setTimeout(() => {
      setSelectedFeature(i);
      setImageFade(true);
      setAutoKey((prev) => prev + 1);
    }, 300);
  };

  return (
    <section className="relative py-24 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-stretch">
          {/* Left: heading + clickable feature list */}
          <div>
            <RevealOnScroll>
              <p className="text-[11px] font-body uppercase tracking-[0.25em] text-cyan-400/60 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-glow-pulse" />
                How it works
              </p>
            </RevealOnScroll>
            <RevealOnScroll delay={0.1}>
              <h2 className="text-3xl md:text-[44px] md:leading-[1.1] font-display font-semibold tracking-tight mb-4">
                Every invasive species{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">matters</span>
              </h2>
            </RevealOnScroll>
            <RevealOnScroll delay={0.2}>
              <p className="text-slate-400 text-[15px] leading-relaxed mb-10 max-w-md">
                Our predictive engine combines FAISS similarity search, live climate data, and global occurrence records to surface threats before they establish.
              </p>
            </RevealOnScroll>

            {/* Mobile: show active visual inline */}
            <div className="md:hidden mb-8">
              <div className="rounded-2xl w-full aspect-square overflow-hidden">
                {(() => { const V = VISUALS[selectedFeature]; return (
                  <div className={`w-full h-full transition-opacity duration-300 ${imageFade ? 'opacity-100' : 'opacity-0'}`}>
                    <V />
                  </div>
                ); })()}
              </div>
            </div>

            <div className="space-y-3">
              {FEATURES.map((f, i) => {
                const isActive = selectedFeature === i;
                return (
                  <button
                    key={i}
                    onClick={() => handleFeatureClick(i)}
                    className={`relative w-full text-left flex gap-4 items-start p-5 rounded-xl transition-all duration-300 overflow-hidden border ${
                      isActive ? 'border-slate-600/50 bg-slate-800/20' : 'border-slate-800/30 hover:border-slate-700/40'
                    }`}
                  >
                    <f.icon className={`w-5 h-5 flex-shrink-0 mt-0.5 transition-colors duration-300 ${isActive ? 'text-cyan-400' : 'text-slate-600'}`} />
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm md:text-base font-display font-semibold mb-0.5 transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                        {f.title}
                      </h3>
                      <p className={`text-xs md:text-sm leading-relaxed transition-colors duration-300 ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>
                        {f.description}
                      </p>
                    </div>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-700/30">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 animate-[progress_6s_linear]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: stacked card shuffle (desktop only) */}
          <div className="hidden md:flex items-stretch justify-center">
            <div className="relative w-full h-full min-h-[480px]">
              {FEATURES.map((_, i) => {
                const posInStack = (i - selectedFeature + FEATURES.length) % FEATURES.length;
                const isActive = posInStack === 0;
                const Visual = VISUALS[i];

                return (
                  <div
                    key={i}
                    className="absolute inset-0 transition-all duration-500 ease-out rounded-2xl overflow-hidden"
                    style={{
                      zIndex: FEATURES.length - posInStack,
                      transform: `translateX(${posInStack * 14}px) scale(${1 - posInStack * 0.025})`,
                      opacity: isActive ? (imageFade ? 1 : 0.6) : Math.max(0, 0.5 - posInStack * 0.15),
                    }}
                  >
                    <Visual />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── CSS keyframe for progress bar (injected once) ────────────────────────

const progressStyle = document.createElement('style');
progressStyle.textContent = `@keyframes progress { from { width: 0% } to { width: 100% } }`;
if (!document.querySelector('[data-iw-progress]')) {
  progressStyle.setAttribute('data-iw-progress', '');
  document.head.appendChild(progressStyle);
}

// ── Rotating words ───────────────────────────────────────────────────────

const HERO_WORDS = ['smarter', 'faster', 'earlier'];

// ── Main page ────────────────────────────────────────────────────────────

export default function Landing() {
  const [wordIndex, setWordIndex] = useState(0);
  const [wordFade, setWordFade] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordFade(false);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % HERO_WORDS.length);
        setWordFade(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a1628] to-slate-950 text-white font-body selection:bg-cyan-500/20">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-3 items-center">
            <div className="flex items-center gap-3 w-fit">
              <div className="shrink-0">
                <img src="/favicon/favicon-96x96.png" alt="InvasiveWatch" className="w-9 h-9 rounded-lg" />
              </div>
              <div>
                <h1 className="text-xl font-display font-semibold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  InvasiveWatch
                </h1>
                <p className="text-[11px] text-slate-500 tracking-wide">Global Species Tracker</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center justify-center gap-8">
              <span className="text-white text-sm font-medium relative pb-1">
                Home
                <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500" />
              </span>
              <Link to="/dashboard" className="text-slate-400 text-sm hover:text-white transition-colors">Dashboard</Link>
              <Link to="/research" className="text-slate-400 text-sm hover:text-white transition-colors">Research</Link>
            </nav>

            <div className="flex items-center justify-end gap-3">
              <Link to="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-body">
                  Open Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero with earth.jpg parallax background */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-20 overflow-hidden">
        <div
          className="absolute -inset-[15%] pointer-events-none"
          style={{ transform: `translateY(${scrollY * 0.35}px)` }}
        >
          <img src="/earth.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/80 to-[#0a1628]/30 pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10" style={{ transform: `translateY(${scrollY * 0.15}px)` }}>
          <motion.div
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 bg-slate-800/40 border border-slate-700/30 rounded-full px-4 py-1.5 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-glow-pulse" />
            <span className="text-xs font-body text-slate-400 tracking-wide">Predictive invasive species monitoring</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.08]">
            <span className={`block transition-all duration-500 ${wordFade ? 'opacity-100 blur-0' : 'opacity-0 blur-lg'}`}>
              Track{' '}
              <AnimatePresence mode="wait">
                <AnimatedWord key={wordIndex} text={HERO_WORDS[wordIndex]} />
              </AnimatePresence>
            </span>
            <motion.span
              initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, delay: 0.09, ease: [0.16, 1, 0.3, 1] }}
              className="block bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"
            >
              before it spreads
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-lg text-slate-400 max-w-xl mx-auto leading-relaxed"
          >
            InvasiveWatch combines FAISS similarity search, real-time climate data, and global occurrence records to assess invasive plant risk at any point on Earth.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.27, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex items-center justify-center gap-4 flex-wrap"
          >
            <Link to="/dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-body text-base px-8 h-12 rounded-xl gap-2 group">
                Launch Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
            <Link to="/research">
              <button className="inline-flex items-center justify-center h-12 px-8 text-base font-body font-medium rounded-xl border border-cyan-500/40 text-cyan-300 bg-cyan-500/5 hover:bg-cyan-500/15 hover:border-cyan-400/60 hover:text-cyan-200 transition-all duration-200">
                Read: Hawaii Case Study
              </button>
            </Link>
          </motion.div>
        </div>

        <motion.button
          onClick={() => document.getElementById('global-reach')?.scrollIntoView({ behavior: 'smooth' })}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Scroll to next section"
        >
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </motion.button>
      </section>

      {/* Global Reach – world map section */}
      <GlobalReachSection />

      {/* Feature showcase with stacked cards */}
      <FeatureShowcase />

      {/* CTA */}
      <section className="py-24 px-6">
        <RevealOnScroll className="max-w-2xl mx-auto text-center">
          <div className="p-10 rounded-3xl border border-slate-800/40 bg-gradient-to-b from-slate-900/40 to-transparent">
            <h3 className="text-2xl font-display font-semibold tracking-tight text-white mb-3">
              Ready to explore?
            </h3>
            <p className="text-sm font-body text-slate-400 mb-8 max-w-md mx-auto">
              Click anywhere on the globe to scan for invasive species risk. No account needed.
            </p>
            <Link to="/dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-body px-10 h-12 rounded-xl gap-2 group">
                Open Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          </div>
        </RevealOnScroll>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-slate-800/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-600">
            <div className="shrink-0">
              <img src="/favicon/favicon-96x96.png" alt="InvasiveWatch" className="w-5 h-5 rounded-md" />
            </div>
            <span className="text-sm font-display tracking-wide">InvasiveWatch</span>
          </div>
          <p className="text-xs font-body text-slate-600">Predictive invasive species monitoring</p>
        </div>
      </footer>
    </div>
  );
}
