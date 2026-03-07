import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { Separator } from "@/components/ui/separator";
import { Globe2, ArrowLeft } from 'lucide-react';
import HawaiiTab from '@/components/case-studies/HawaiiTab';
import NewZealandTab from '@/components/case-studies/NewZealandTab';


// ── Scroll Progress Bar ──────────────────────────────────────────────────

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      style={{ scaleX, transformOrigin: '0%' }}
      className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 z-[60]"
    />
  );
}


// ── Header Component ─────────────────────────────────────────────────────

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/30">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <Globe2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display text-white tracking-tight">
                InvasiveWatch
              </h1>
              <p className="text-[11px] font-body text-slate-500 tracking-wide">Global Species Tracker</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-slate-400 text-sm font-body hover:text-white transition-colors">Home</Link>
            <Link to="/dashboard" className="text-slate-400 text-sm font-body hover:text-white transition-colors">Dashboard</Link>
            <span className="text-white text-sm font-body font-medium relative">
              Research
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-cyan-500 to-blue-500" />
            </span>
          </nav>
        </div>
      </div>
    </header>
  );
}

// ── Glassmorphic Toggle ──────────────────────────────────────────────────

function CaseStudyToggle({ activeTab, setActiveTab }) {
  return (
    <div className="py-8 px-6">
      <div className="flex justify-center">
        <div className="inline-flex items-center p-1.5 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-full">
          {/* Hawaii Button */}
          <button
            onClick={() => setActiveTab('hawaii')}
            className="relative rounded-full px-8 py-2.5 text-sm transition-colors"
          >
            {activeTab === 'hawaii' && (
              <motion.div
                layoutId="activeCaseStudyTab"
                className="absolute inset-0 bg-slate-800 border border-slate-700 rounded-full shadow-[0_0_15px_rgba(56,189,248,0.15)]"
                initial={false}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 30,
                }}
              />
            )}
            <span className={`relative z-10 font-body whitespace-nowrap ${
              activeTab === 'hawaii'
                ? 'text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}>
              Hawaii: The Pacific Sink
            </span>
          </button>
          
          {/* New Zealand Button */}
          <button
            onClick={() => setActiveTab('newzealand')}
            className="relative rounded-full px-8 py-2.5 text-sm transition-colors"
          >
            {activeTab === 'newzealand' && (
              <motion.div
                layoutId="activeCaseStudyTab"
                className="absolute inset-0 bg-slate-800 border border-slate-700 rounded-full shadow-[0_0_15px_rgba(56,189,248,0.15)]"
                initial={false}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 30,
                }}
              />
            )}
            <span className={`relative z-10 font-body whitespace-nowrap ${
              activeTab === 'newzealand'
                ? 'text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}>
              New Zealand: The Mammal Crisis
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page Footer ──────────────────────────────────────────────────────────

function PageFooter({ activeTab }) {
  return (
    <footer className="py-16 px-6">
      <Separator className="bg-gradient-to-r from-transparent via-slate-700/50 to-transparent mb-12" />
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-body group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Return to Dashboard
        </Link>
        <p className="text-slate-600 text-xs font-body leading-relaxed">
          Data sources:{' '}
          {activeTab === 'hawaii' ? (
            <>
              <a href="https://www.iucnredlist.org/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors">IUCN Red List</a>,{' '}
              <a href="https://www.usgs.gov/centers/pierc" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors">USGS PIERC</a>,{' '}
              <a href="https://dlnr.hawaii.gov/hisc/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors">Hawaii DLNR</a>,{' '}
              <a href="https://www.bishopmuseum.org/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors">Bishop Museum</a>,{' '}
              <a href="https://www.nature.org/en-us/about-us/where-we-work/united-states/hawaii/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors">Nature Conservancy of Hawaii</a>.
            </>
          ) : (
            <>
              <a href="https://www.doc.govt.nz/nature/pests-and-threats/predator-free-2050/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors">NZ Department of Conservation</a>,{' '}
              <a href="https://predatorfreenz.org/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors">Predator Free NZ Trust</a>,{' '}
              <a href="https://www.mpi.govt.nz/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors">Ministry for Primary Industries</a>.
            </>
          )}
        </p>
        <div className="flex items-center justify-center gap-2.5 text-slate-600">
          <div className="p-1.5 bg-gradient-to-br from-blue-500/40 to-cyan-500/40 rounded-lg">
            <Globe2 className="w-4 h-4 text-white/60" />
          </div>
          <span className="text-sm font-display tracking-wide">InvasiveWatch</span>
        </div>
      </div>
    </footer>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────

export default function HawaiiCaseStudy() {
  const [activeTab, setActiveTab] = useState('hawaii');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a1628] to-slate-950 text-white font-body selection:bg-cyan-500/20">
      <ScrollProgressBar />
      <Header />
      <main className="pt-20">
        <CaseStudyToggle activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTab === 'hawaii' ? <HawaiiTab /> : <NewZealandTab />}
          </motion.div>
        </AnimatePresence>
      </main>
      <PageFooter activeTab={activeTab} />
    </div>
  );
}
