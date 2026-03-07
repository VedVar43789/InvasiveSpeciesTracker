import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Leaf, Bug, AlertTriangle, Package, Plane, Globe
} from 'lucide-react';
import hawaiiObservationsAll from '@/assets/hawaii/hawaii-observations-all.json';

// ── Animation helpers ─────────────────────────────────────────────────────

const sectionVariants = {
  hidden: { opacity: 0, y: 48 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

function RevealSection({ children, className = "", as: Tag = "section", margin = "-12% 0px", variants: v = sectionVariants }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin });
  const MotionTag = motion[Tag] || motion.section;
  return (
    <MotionTag ref={ref} variants={v} initial="hidden" animate={inView ? "visible" : "hidden"} className={className}>
      {children}
    </MotionTag>
  );
}

// ── Citation helper ──────────────────────────────────────────────────────

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

// ── Static Data ──────────────────────────────────────────────────────────

const STATS = [
  { value: 8000, label: 'Invasive Species', sublabel: 'established across the islands', suffix: '+', cite: { href: 'https://www.invasivespeciesinfo.gov/us/hawaii', n: 1 } },
  { value: 71, label: 'Native Birds Extinct', sublabel: 'since human arrival', cite: { href: 'https://dlnr.hawaii.gov/wildlife/birds/', n: 2 } },
  { value: 300, label: 'Annual Damage', sublabel: 'agriculture & ecosystems', prefix: '$', suffix: 'M+', cite: { href: 'https://dlnr.hawaii.gov/hisc/info/', n: 3 } },
  { value: 47, label: 'Land Compromised', sublabel: 'of natural areas affected', suffix: '%', cite: { href: 'https://www.fs.usda.gov/research/publications/book/invasiveSpecies/invasiveSpeciesAppendixHawaiiPacificIslands.pdf', n: 4 } },
];

const TIMELINE_EVENTS = [
  { year: '~400 CE', event: 'Polynesian settlers introduce rats, pigs, and taro. Forest bird extinctions begin.', severity: 'orange' },
  { year: '1778', event: 'European contact. Cattle, goats, and new plant species arrive continuously.', severity: 'orange' },
  { year: '1883', event: 'Mongoose introduced to control rats — instead decimates ground-nesting birds.', severity: 'red' },
  { year: '1949', event: 'Brown tree snake first spotted on Oahu. Eradicated, but threat remains active.', severity: 'yellow' },
  { year: '1992', event: 'Coqui frog establishes in Hilo. Now present on all major islands.', severity: 'red' },
  { year: '2023', event: 'Coconut rhinoceros beetle detected. Immediate threat to palm ecosystem.', severity: 'red' },
];

const SPECIES_DATA = {
  plants: [
    { commonName: 'Strawberry Guava', scientificName: 'Psidium cattleianum', origin: 'Brazil', impact: 'Forms dense monotypic stands that exclude all native understory plants. Covers over 330,000 acres of forest.', coveragePercent: 24, riskLevel: 'High Risk', cite: { href: 'https://www.fs.usda.gov/psw/publications/johnson_mt/psw_2016_johnson_mt001.pdf', n: 7 } },
    { commonName: 'Miconia', scientificName: 'Miconia calvescens', origin: 'Central America', impact: 'Called "the green cancer of the Pacific." Its leaves create 99% shade, destroying native biodiversity below.', coveragePercent: 17, riskLevel: 'High Risk', cite: { href: 'https://dlnr.hawaii.gov/hisc/miconia-calvescens/', n: 8 } },
    { commonName: 'Fountain Grass', scientificName: 'Pennisetum setaceum', origin: 'Africa', impact: 'Fuels wildfires in dry ecosystems. Increases fire frequency 300%, permanently converting native shrubland.', coveragePercent: 38, riskLevel: 'Moderate Risk', cite: { href: 'https://dlnr.hawaii.gov/hisc/info/species/invasive-grasses-in-hawaii-and-their-impacts/', n: 9 } },
  ],
  animals: [
    { commonName: 'Feral Pig', scientificName: 'Sus scrofa', origin: 'Polynesia/Europe', impact: 'Roots up native ferns, creating water-filled wallows that breed millions of disease-carrying mosquitoes.', coveragePercent: 55, riskLevel: 'High Risk' },
    { commonName: 'Small Indian Mongoose', scientificName: 'Herpestes javanicus', origin: 'South Asia', impact: 'Introduced in 1883 to control rats. Instead predated ground-nesting birds, driving multiple extinctions.', coveragePercent: 62, riskLevel: 'High Risk' },
    { commonName: 'Barn Owl', scientificName: 'Tyto alba', origin: 'North America', impact: 'Introduced to control rats. Preys heavily on endangered Hawaiian Petrels and native seabirds.', coveragePercent: 31, riskLevel: 'Moderate Risk' },
  ],
  insects: [
    { commonName: 'Varroa Mite', scientificName: 'Varroa destructor', origin: 'Asia', impact: 'Decimated native Hawaiian yellow-faced bee populations, threatening pollination of 60% of native plants.', coveragePercent: 78, riskLevel: 'High Risk', cite: { href: 'https://dab.hawaii.gov/pi/varroa-mite-information/frequently-asked-questions-about-varroa-mite/', n: 10 } },
    { commonName: 'Rapid Ohia Death', scientificName: 'Ceratocystis spp.', origin: 'Unknown', impact: 'Fungal pathogen killing Hawaii\'s most iconic tree within weeks. Millions of ohia dead since 2014.', coveragePercent: 29, riskLevel: 'High Risk' },
    { commonName: 'Little Fire Ant', scientificName: 'Wasmannia auropunctata', origin: 'Central America', impact: 'Stings blind pets and livestock, reduces native arthropod diversity by 75%.', coveragePercent: 41, riskLevel: 'Moderate Risk', cite: { href: 'https://dlnr.hawaii.gov/hisc/little-fire-ant-lfa/', n: 11 } },
  ],
};

const ECOLOGICAL_DATA = [
  { era: 'Pre-Human', native: 10000, invasive: 0 },
  { era: '1800', native: 8200, invasive: 340 },
  { era: '1900', native: 5800, invasive: 1800 },
  { era: '1950', native: 4100, invasive: 3900 },
  { era: '2000', native: 2900, invasive: 6200 },
  { era: 'Today', native: 2100, invasive: 8000 },
];

const BIRD_DECLINE_DATA = [
  { year: '1778', species: 71 },
  { year: '1850', species: 58 },
  { year: '1900', species: 44 },
  { year: '1940', species: 33 },
  { year: '1970', species: 24 },
  { year: '1990', species: 17 },
  { year: '2010', species: 14 },
  { year: '2024', species: 12 },
];

const PATHWAYS = [
  { icon: Package, title: 'Cargo & Shipping', body: 'Hawaii receives 80% of its goods by cargo ship. Wooden pallets, produce, and machinery routinely carry seeds, insects, and pathogens. A single container ship can introduce dozens of organisms in one arrival.', cite: { href: 'https://files.hawaii.gov/dbedt/economic/reports/Marine_Cargo_Study_Final.pdf', n: 12 } },
  { icon: Plane, title: 'Air Travel & Tourism', body: 'Over 10 million tourists visit annually. Each traveler can unknowingly transport seeds in shoe treads, soil on hiking boots, or insects in luggage. The window for interception is brief.', cite: { href: 'https://www.hawaiitourismauthority.org/news/news-releases/2020/hawai-i-visitor-statistics-released-for-2019/', n: 13 } },
  { icon: Globe, title: 'Online Commerce', body: 'Online plant sales bypass traditional agricultural inspection. Plants shipped directly to consumers carry soil insects and fungal spores. Interceptions from mail packages increased 60% between 2010 and 2020.', cite: { href: 'https://www.aphis.usda.gov/plant-pests-diseases/hawaii', n: 14 } },
];

const FAILED_RESPONSES = [
  { title: 'Biological Control — "Fighting nature with nature"', body: 'Introducing predators to control invasives has had mixed results. The mongoose — itself a catastrophic biocontrol mistake — illustrates the problem: a solution for one species became a threat to dozens of others. Modern biocontrol is more targeted, but approval takes 8–12 years and does nothing about the 20+ new species arriving annually.' },
  { title: 'Manual Removal — "Boots on the ground"', body: 'Removal programs have protected tens of thousands of acres. However, manual removal averages $1,200 per acre for initial clearing and requires indefinite follow-up. A single mature miconia produces 200 million seeds per year — the arithmetic favors the invader.' },
  { title: 'Border Inspection — "Stop it at the door"', body: 'Hawaii intercepts thousands of organisms annually at airports and ports. But studies suggest 10–30% of introduced organisms go undetected at entry. By the time a new species is noticed, it may already have populations across multiple islands.' },
  { title: 'Fencing & Enclosures — "Protecting refuges"', body: 'Predator-proof fencing has saved critically endangered species like the nene. Over 100,000 acres are now enclosed. But fencing is protective, not restorative — it preserves remnant populations while the surrounding landscape continues to degrade.' },
  { title: 'Public Awareness — "Education and reporting"', body: 'Campaigns urging hikers to clean gear and report sightings have created genuine engagement. Yet most reporting systems operate reactively: a citizen reports what they see, an agency responds weeks later. By then, a new population may be well established. The challenge is not awareness — it is speed.' },
];

const ARRIVAL_TICKER_SPECIES = [
  'Coqui Frog', 'Fire Ant', 'Strawberry Guava', 'Mongoose', 'Varroa Mite',
  'Miconia', 'Fountain Grass', 'Coconut Rhinoceros Beetle', 'Axis Deer',
  'African Tulip Tree', 'Brown Tree Snake', 'Giant African Snail',
  'Albizia', 'Kahili Ginger', 'Chameleon', 'Tilapia', 'Red-vented Bulbul',
  'Christmas Berry', 'Feral Cat', 'Rat Lungworm',
];

// ── Utility ──────────────────────────────────────────────────────────────

function getRiskBadgeStyle(label) {
  if (label === 'High Risk') return 'bg-red-500/20 text-red-400 border-0';
  if (label === 'Moderate Risk') return 'bg-orange-500/20 text-orange-400 border-0';
  return 'bg-yellow-500/20 text-yellow-400 border-0';
}

const severityColor = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
};

const severityGlow = {
  red: 'shadow-[0_0_8px_rgba(239,68,68,0.5)]',
  orange: 'shadow-[0_0_8px_rgba(249,115,22,0.5)]',
  yellow: 'shadow-[0_0_8px_rgba(234,179,8,0.5)]',
};

// ── Animated Counter ─────────────────────────────────────────────────────

function CountUp({ target, duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(id); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [inView, target, duration]);

  return <span ref={ref} className="tabular-nums">{count.toLocaleString()}</span>;
}

// ── Species Arrival Ticker ───────────────────────────────────────────────

function ArrivalTicker() {
  const doubled = [...ARRIVAL_TICKER_SPECIES, ...ARRIVAL_TICKER_SPECIES];

  return (
    <RevealSection variants={fadeIn} className="py-12 overflow-hidden border-y border-slate-800/30 bg-slate-950/60 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/[0.02] via-transparent to-red-500/[0.02]" />
      <p className="text-center text-[11px] font-body text-slate-500 uppercase tracking-[0.25em] mb-5 relative z-10">
        20+ new species arrive in Hawaii every year
      </p>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-950 to-transparent z-10" />
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
          className="flex items-center gap-8 whitespace-nowrap"
        >
          {doubled.map((species, i) => (
            <span key={i} className="text-sm font-body text-slate-500/80 flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500/60 animate-glow-pulse" />
              {species}
            </span>
          ))}
        </motion.div>
      </div>
    </RevealSection>
  );
}

// ── Section Components ───────────────────────────────────────────────────

function PageIntro() {
  return (
    <RevealSection variants={staggerContainer} className="px-6 pt-12 pb-16 border-b border-slate-800/30 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-cyan-500/[0.04] to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-radial from-red-500/[0.03] to-transparent rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.p variants={fadeUp} className="text-[11px] font-body uppercase tracking-[0.3em] text-cyan-400/70 mb-3">
          Case Study
        </motion.p>
        <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-display text-white leading-[1.1] tracking-tight">
          Hawaii's Silent War
        </motion.h2>
        <motion.p variants={fadeUp} className="text-lg md:text-xl font-body text-slate-400 mt-3 tracking-wide">
          One Archipelago. 10,000 Threats.
        </motion.p>
        <motion.p variants={fadeUp} className="mt-6 text-[15px] font-body text-slate-400/90 max-w-2xl leading-[1.8]">
          Hawaii loses species faster than anywhere on Earth — and by the time threats are detected, it's often too late. InvasiveWatch uses predictive modeling to identify high-risk species <em className="text-slate-300 not-italic">before</em> they establish, giving agencies the early warning that reactive monitoring can't.
        </motion.p>
        <motion.blockquote
          variants={fadeUp}
          className="mt-8 text-[15px] font-body text-slate-400/80 italic border-l-2 border-cyan-500/30 pl-5 max-w-2xl leading-[1.8]"
        >
          "The one process now going on that will take millions of years to correct is the loss of genetic and species diversity by the destruction of natural habitats. This is the folly our descendants are least likely to forgive us."
          <span className="block mt-2 text-xs text-slate-500 not-italic tracking-wide">— E.O. Wilson, biologist</span>
        </motion.blockquote>
      </div>
    </RevealSection>
  );
}

function StatsBar() {
  return (
    <RevealSection variants={staggerContainer} className="py-14 px-6">
      <div className="max-w-4xl mx-auto flex flex-wrap items-baseline gap-x-12 gap-y-8">
        {STATS.map((stat, i) => (
          <React.Fragment key={stat.label}>
            <motion.div variants={scaleIn} className="group">
              <p className="text-3xl md:text-4xl font-display text-white tabular-nums">
                {stat.prefix}<CountUp target={stat.value} />{stat.suffix}
              </p>
              <p className="text-sm font-body text-slate-400 mt-1 group-hover:text-slate-300 transition-colors">
                {stat.label}{stat.cite && <Cite href={stat.cite.href} n={stat.cite.n} />}
              </p>
            </motion.div>
            {i < STATS.length - 1 && <div className="hidden md:block w-px h-12 bg-gradient-to-b from-transparent via-slate-700/50 to-transparent" />}
          </React.Fragment>
        ))}
      </div>
    </RevealSection>
  );
}

function CrisisSection() {
  return (
    <section className="py-28 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-transparent" />
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 relative z-10">
        <RevealSection as="div" variants={staggerContainer} className="">
          <motion.h3 variants={fadeUp} className="text-4xl font-display text-white mb-10 tracking-tight">
            An Archipelago Under Siege
          </motion.h3>
          <div className="space-y-6">
            {[
              <>Hawaii's geographic isolation made it one of the most biologically unique places on Earth. Over millions of years, species arrived roughly once every 100,000 years by wind, ocean currents, and birds. This extreme isolation produced extraordinary endemism — more than 90% of Hawaii's native species are found nowhere else.<Cite href="https://www.nfwf.org/landscapes/hawaii" n={5} /></>,
              <>The first wave of disruption came with Polynesian settlers around 400 CE, who introduced pigs, rats, and dozens of plant species. Within centuries, 50+ bird species that had evolved with no ground predators were driven to extinction. But this was only the beginning.</>,
              <>European contact in 1778 opened the floodgates. Deliberate introductions of cattle, goats, and mongoose — along with accidental stowaways — multiplied the pressure. By 1900, alien species outnumbered native species in most lowland areas.</>,
              <>Today, new invasive species arrive in Hawaii at an estimated rate of 20 per year.<Cite href="https://www.ctahr.hawaii.edu/adap/hottopics/invasive_species.htm" n={6} /> The archipelago lacks the continental buffer zones that allow other ecosystems to absorb pressure. What would be a local problem elsewhere becomes an extinction event in Hawaii.</>,
            ].map((text, i) => (
              <motion.p key={i} variants={fadeUp} className="text-[15px] font-body text-slate-400/90 leading-[1.8]">
                {text}
              </motion.p>
            ))}
          </div>
        </RevealSection>

        <RevealSection as="div" variants={staggerContainer} className="relative pl-10">
          <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/30 via-slate-700/30 to-red-500/30" />
          <div className="space-y-10">
            {TIMELINE_EVENTS.map((ev, i) => (
              <motion.div key={ev.year} variants={fadeUp} className="relative group">
                <div className={`absolute -left-7 top-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${severityColor[ev.severity]} ${severityGlow[ev.severity]} transition-shadow`} />
                <p className="text-sm font-display text-white tracking-wide">{ev.year}</p>
                <p className="text-sm font-body text-slate-500 mt-1 leading-relaxed group-hover:text-slate-400 transition-colors">{ev.event}{ev.cite && <Cite href={ev.cite.href} n={ev.cite.n} />}</p>
              </motion.div>
            ))}
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

function SpeciesCard({ species }) {
  return (
    <motion.div variants={fadeUp} className="py-5 group">
      <div className="flex items-start justify-between mb-1.5">
        <div>
          <h4 className="text-white font-body font-medium group-hover:text-cyan-300 transition-colors">{species.commonName}</h4>
          <p className="text-xs font-body text-slate-500 italic">{species.scientificName} · {species.origin}</p>
        </div>
        <Badge className={getRiskBadgeStyle(species.riskLevel)}>{species.riskLevel}</Badge>
      </div>
      <p className="text-sm font-body text-slate-400 mt-2 leading-[1.7]">{species.impact}{species.cite && <Cite href={species.cite.href} n={species.cite.n} />}</p>
      <div className="flex items-center gap-3 mt-3">
        <Progress value={species.coveragePercent} className="h-1.5 flex-1 bg-slate-800" />
        <span className="text-xs font-body text-slate-500 tabular-nums">{species.coveragePercent}%</span>
      </div>
    </motion.div>
  );
}

function SpeciesSpotlightSection() {
  return (
    <RevealSection className="py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h3 className="text-4xl font-display text-white tracking-tight">Species That Changed Everything</h3>
          <p className="text-slate-500 font-body mt-3">A few of the organisms reshaping Hawaii's ecosystems.</p>
        </div>

        <Tabs defaultValue="plants" className="w-full">
          <TabsList className="bg-slate-800/30 border border-slate-700/30 mx-auto flex w-fit rounded-full p-1">
            <TabsTrigger value="plants" className="data-[state=active]:bg-slate-700/80 data-[state=active]:text-white text-slate-400 rounded-full font-body text-sm px-5 transition-all">
              <Leaf className="w-4 h-4 mr-1.5" /> Plants
            </TabsTrigger>
            <TabsTrigger value="animals" className="data-[state=active]:bg-slate-700/80 data-[state=active]:text-white text-slate-400 rounded-full font-body text-sm px-5 transition-all">
              <AlertTriangle className="w-4 h-4 mr-1.5" /> Animals
            </TabsTrigger>
            <TabsTrigger value="insects" className="data-[state=active]:bg-slate-700/80 data-[state=active]:text-white text-slate-400 rounded-full font-body text-sm px-5 transition-all">
              <Bug className="w-4 h-4 mr-1.5" /> Insects & Pathogens
            </TabsTrigger>
          </TabsList>

          {Object.entries(SPECIES_DATA).map(([key, species]) => (
            <TabsContent key={key} value={key} className="mt-8">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="divide-y divide-slate-800/40"
              >
                {species.map(s => <SpeciesCard key={s.scientificName} species={s} />)}
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </RevealSection>
  );
}

const chartTooltipStyle = {
  contentStyle: { background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(51, 65, 85, 0.3)', borderRadius: '12px', color: '#e2e8f0', fontFamily: '"DM Sans", sans-serif', fontSize: '13px' },
  itemStyle: { color: '#e2e8f0' },
  labelStyle: { color: '#94a3b8' },
};

// ── Hawaii spread map (time-slider heatmap) ─────────────────────────────

const HAWAII_BOUNDS = [[-160.5, 18.9], [-154.7, 22.5]];
const YEAR_MIN = 2005;
const YEAR_MAX = 2024;
const EMPTY_GEOJSON = { type: 'FeatureCollection', features: [] };

const HAWAII_DATA_CACHE = (() => {
  const m = new Map();
  const { years = {} } = hawaiiObservationsAll;
  Object.entries(years).forEach(([y, geojson]) => m.set(Number(y), geojson));
  return m;
})();

function HawaiiSpreadMapSection() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [year, setYear] = useState(2010);
  const [error, setError] = useState(null);

  const setMapData = useCallback((y) => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource('hawaii-observations');
    if (!src) return;
    const data = HAWAII_DATA_CACHE.get(y) ?? EMPTY_GEOJSON;
    src.setData(data);
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token) {
      setError('Mapbox token not configured');
      return;
    }

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [-157.6, 20.7],
      zoom: 6,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    map.on('load', () => {
      map.fitBounds(HAWAII_BOUNDS, { padding: 40, maxZoom: 10 });
      map.addSource('hawaii-observations', {
        type: 'geojson',
        data: EMPTY_GEOJSON,
      });
      map.addLayer({
        id: 'hawaii-heat',
        type: 'heatmap',
        source: 'hawaii-observations',
        minzoom: 5,
        maxzoom: 14,
        paint: {
          'heatmap-weight': 1,
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            6, 1.4,
            10, 1.8,
            14, 2.2,
          ],
          'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            6, 7,
            8, 5,
            10, 4,
            12, 3,
            14, 2.5,
          ],
          'heatmap-opacity': 0.72,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 0, 0, 0)',
            0.1, 'rgba(34, 211, 238, 0.75)',
            0.35, 'rgba(34, 211, 238, 0.95)',
            0.55, 'rgba(251, 146, 60, 0.9)',
            0.75, 'rgba(239, 68, 68, 0.95)',
            1, 'rgba(220, 38, 38, 1)',
          ],
        },
      });
      mapRef.current = map;
      setMapData(year);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [setMapData, year]);

  useEffect(() => {
    if (!mapRef.current) return;
    setMapData(year);
  }, [year, setMapData]);

  return (
    <RevealSection className="py-28 px-6 bg-slate-900/20">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <motion.h3 variants={fadeUp} className="text-4xl font-display text-white mb-2 tracking-tight">
            Spread Over Time
          </motion.h3>
          <motion.p variants={fadeUp} className="text-slate-500 font-body">
            Invasive species observations in Hawaii. Slide forward in time to see cumulative spread (introduced species, iNaturalist).
          </motion.p>
        </div>

        <motion.div variants={scaleIn} className="rounded-2xl overflow-hidden border border-slate-700/40 bg-slate-900/50 shadow-xl">
          <div className="relative h-[420px] w-full bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900" ref={mapContainerRef} />
          <div className="p-4 flex flex-col sm:flex-row items-center gap-4 border-t border-slate-700/40">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-slate-400 text-sm font-body whitespace-nowrap">Through</span>
              <Slider
                value={[year]}
                onValueChange={([v]) => setYear(v)}
                min={YEAR_MIN}
                max={YEAR_MAX}
                step={1}
                className="w-full sm:w-48"
              />
              <span className="text-white font-display tabular-nums min-w-[3rem]">{year}</span>
            </div>
            {error && (
              <span className="text-red-400/90 text-sm">{error}</span>
            )}
          </div>
          <p className="px-4 pb-3 text-slate-500 text-xs">
            Observations from{' '}
            <a href="https://www.inaturalist.org" target="_blank" rel="noopener noreferrer" className="text-cyan-400/80 hover:text-cyan-300 underline underline-offset-1">
              iNaturalist
            </a>
            {' '}(introduced, verifiable). Map © Mapbox.
          </p>
        </motion.div>

        {!error && (
          <p className="text-slate-500 text-sm font-body mt-3">
            Showing observations from {YEAR_MIN} through {year}. Some observations may have obscured coordinates and are not shown.
          </p>
        )}
      </div>
    </RevealSection>
  );
}

function EcologicalImpactSection() {
  return (
    <RevealSection className="py-28 px-6 bg-slate-900/20 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.015] to-transparent" />
      <div className="max-w-4xl mx-auto relative z-10">
        <h3 className="text-4xl font-display text-white mb-3 tracking-tight">The Inversion</h3>
        <p className="text-slate-500 font-body mb-10">Native vs. invasive species counts over time</p>

        <motion.div variants={scaleIn}>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={ECOLOGICAL_DATA} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.25)" />
              <XAxis dataKey="era" tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: '"DM Sans", sans-serif' }} axisLine={{ stroke: '#1e293b' }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: '"DM Sans", sans-serif' }} axisLine={{ stroke: '#1e293b' }} />
              <Tooltip {...chartTooltipStyle} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12, fontFamily: '"DM Sans", sans-serif' }} />
              <Bar dataKey="native" name="Native Species" fill="#22d3ee" radius={[6, 6, 0, 0]} />
              <Bar dataKey="invasive" name="Invasive Species" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        <p className="text-slate-500 text-sm font-body italic mt-6">
          For every native species present today, Hawaii has nearly four invasive species competing for the same resources.
        </p>
      </div>
    </RevealSection>
  );
}

function SpreadMechanicsSection() {
  return (
    <RevealSection variants={staggerContainer} className="py-28 px-6 bg-slate-900/20">
      <div className="max-w-4xl mx-auto">
        <motion.h3 variants={fadeUp} className="text-4xl font-display text-white mb-4 tracking-tight">How Species Cross the Pacific</motion.h3>
        <motion.p variants={fadeUp} className="text-slate-500 font-body mb-12">The pathways that keep the invasion accelerating.</motion.p>

        <div className="space-y-1">
          {PATHWAYS.map((pw) => (
            <motion.div
              key={pw.title}
              variants={fadeUp}
              className="flex gap-5 items-start p-5 rounded-2xl hover:bg-slate-800/20 transition-colors group"
            >
              <div className="p-2.5 rounded-xl bg-slate-800/50 group-hover:bg-slate-700/50 transition-colors shrink-0">
                <pw.icon className="w-5 h-5 text-cyan-400/70 group-hover:text-cyan-400 transition-colors" />
              </div>
              <div>
                <h4 className="text-base font-body font-medium text-white mb-1.5">{pw.title}</h4>
                <p className="text-sm font-body text-slate-400 leading-[1.7]">{pw.body}{pw.cite && <Cite href={pw.cite.href} n={pw.cite.n} />}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </RevealSection>
  );
}

function BiodiversityLossSection() {
  return (
    <RevealSection variants={staggerContainer} className="py-28 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-t from-red-500/[0.02] to-transparent" />
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.blockquote
          variants={fadeUp}
          className="text-xl md:text-2xl font-display text-slate-200 italic mb-12 leading-[1.5] max-w-3xl border-l-2 border-red-500/40 pl-6"
        >
          "Of the 71 native forest bird species documented at European contact, only 12 survive today. No other place on Earth has lost more bird species in recorded history."
          <Cite href="https://dlnr.hawaii.gov/wildlife/birds/" n={15} />
        </motion.blockquote>

        <motion.div variants={scaleIn}>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={BIRD_DECLINE_DATA}>
              <defs>
                <linearGradient id="birdDecline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.25)" />
              <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: '"DM Sans", sans-serif' }} axisLine={{ stroke: '#1e293b' }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: '"DM Sans", sans-serif' }} axisLine={{ stroke: '#1e293b' }} domain={[0, 80]} />
              <Tooltip {...chartTooltipStyle} />
              <Area type="monotone" dataKey="species" name="Surviving Species" stroke="#ef4444" fill="url(#birdDecline)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.p variants={fadeUp} className="text-slate-600 text-xs font-body mt-5">
          Data compiled from IUCN Red List, USGS Hawaiian Forest Bird Survey, and State of Hawaii DLNR records.
        </motion.p>
      </div>
    </RevealSection>
  );
}

function FailedResponsesSection() {
  return (
    <RevealSection variants={staggerContainer} className="py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <motion.h3 variants={fadeUp} className="text-4xl font-display text-white tracking-tight">Why Conventional Responses Fall Short</motion.h3>
          <motion.p variants={fadeUp} className="text-slate-500 font-body mt-3">Decades of management efforts have yielded local victories — but the systemic threat keeps escalating.</motion.p>
        </div>

        <motion.div variants={fadeUp}>
          <Accordion type="multiple">
            {FAILED_RESPONSES.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-slate-800/30">
                <AccordionTrigger className="text-white text-left hover:no-underline text-sm md:text-base py-5 font-body hover:text-cyan-300 transition-colors">
                  {item.title}
                </AccordionTrigger>
                <AccordionContent className="text-slate-400 text-sm font-body leading-[1.8] pb-5">
                  {item.body}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </RevealSection>
  );
}

const FUNNEL_STAGES = [
  { label: 'Species Arrives', time: 'Day 0', cost: '$0', dotClass: 'bg-cyan-400', textClass: 'text-cyan-400', glowClass: 'shadow-[0_0_10px_rgba(34,211,238,0.4)]' },
  { label: 'Detected', time: '~1 Year', cost: '$4K', dotClass: 'bg-blue-400', textClass: 'text-blue-400', glowClass: 'shadow-[0_0_10px_rgba(96,165,250,0.4)]' },
  { label: 'Response Mounted', time: '~3 Years', cost: '$1.2M', dotClass: 'bg-orange-400', textClass: 'text-orange-400', glowClass: 'shadow-[0_0_10px_rgba(251,146,60,0.4)]' },
  { label: 'Irreversible', time: '10+ Years', cost: '', dotClass: 'bg-red-400', textClass: 'text-red-400', glowClass: 'shadow-[0_0_10px_rgba(248,113,113,0.4)]' },
];

function DataGapSection() {
  return (
    <RevealSection variants={staggerContainer} className="py-28 px-6 bg-slate-900/20 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.015] to-transparent" />
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.h3 variants={fadeUp} className="text-4xl font-display text-white mb-3 tracking-tight">The Surveillance Gap</motion.h3>
        <motion.p variants={fadeUp} className="text-slate-500 font-body mb-12">Why reactive monitoring fails — and why prediction matters.</motion.p>

        <div className="grid md:grid-cols-2 gap-20">
          <motion.div variants={staggerContainer} className="relative pl-7">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-cyan-500/40 via-orange-500/40 to-red-500/40" />
            <div className="space-y-10">
              {FUNNEL_STAGES.map((stage) => (
                <motion.div key={stage.label} variants={fadeUp} className="relative group">
                  <div className={`absolute -left-7 top-0.5 w-4 h-4 rounded-full ${stage.dotClass}/20 flex items-center justify-center`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${stage.dotClass} ${stage.glowClass} transition-shadow`} />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-body text-slate-200 font-medium">{stage.label}</p>
                    {stage.cost && <span className={`text-sm font-display font-bold ${stage.textClass} tabular-nums`}>{stage.cost}</span>}
                  </div>
                  <p className="text-xs font-body text-slate-500 mt-0.5">{stage.time}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={staggerContainer} className="space-y-5">
            {[
              <>The fundamental problem is that we see the damage long after the invasion becomes irreversible. By the time Rapid Ohia Death was identified in 2014, it had already killed over a million trees. By the time coqui frogs were recognized as a threat, they had established on four islands.</>,
              <>Effective management requires knowing where species are before they reach critical mass. This demands continuous, systematic monitoring at scales no single agency can currently provide.</>,
              <>The window for effective intervention is narrow. Research suggests a new invasive population can be eradicated for roughly $4,000 if caught within its first year. That cost rises to $1.2 million after three years.<Cite href="https://www.kauaiisc.org/the-cost-of-invasive-species/" n={16} /> After ten years, eradication is typically impossible.</>,
            ].map((text, i) => (
              <motion.p key={i} variants={fadeUp} className="text-[15px] font-body text-slate-400/90 leading-[1.8]">
                {text}
              </motion.p>
            ))}
          </motion.div>
        </div>
      </div>
    </RevealSection>
  );
}

// ── Main Tab Component ────────────────────────────────────────────────────

export default function HawaiiTab() {
  return (
    <>
      <PageIntro />
      <StatsBar />
      <ArrivalTicker />
      <HawaiiSpreadMapSection />
      <CrisisSection />
      <SpeciesSpotlightSection />
      <EcologicalImpactSection />
      <SpreadMechanicsSection />
      <BiodiversityLossSection />
      <FailedResponsesSection />
      <DataGapSection />
    </>
  );
}
