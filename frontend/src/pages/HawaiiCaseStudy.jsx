import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView, useScroll, useSpring, useTransform } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  Globe2, Leaf, Bug, ChevronDown, ArrowLeft, Package, Plane, Globe, AlertTriangle
} from 'lucide-react';

// ── Citation helper ──────────────────────────────────────────────────────

function Cite({ href, n }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center text-[9px] text-cyan-400/70 hover:text-cyan-300 align-super ml-0.5 no-underline"
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

// Per-island data for modal popups
const ISLANDS = [
  {
    name: 'Niihau', severity: 'yellow', threats: 12,
    species: [
      { name: 'Feral Pig', risk: 'Moderate Risk', note: 'Small population, limited range' },
      { name: 'Fountain Grass', risk: 'Low Risk', note: 'Scattered along dry western coast' },
    ],
    summary: 'Privately owned with restricted access. Minimal invasive pressure compared to other islands, but feral ungulates remain a concern.',
  },
  {
    name: 'Kauai', severity: 'orange', threats: 89,
    species: [
      { name: 'Avian Malaria', risk: 'High Risk', note: 'Mosquito-borne; devastating remaining forest birds' },
      { name: 'Strawberry Guava', risk: 'High Risk', note: 'Dominant understory across wet forests' },
      { name: 'Feral Pig', risk: 'High Risk', note: 'Creates mosquito breeding pools in wallows' },
      { name: 'Coqui Frog', risk: 'Moderate Risk', note: 'Recently detected, containment ongoing' },
    ],
    summary: 'The oldest main island. Home to the last wild populations of several critically endangered birds, all threatened by mosquito-borne avian malaria expanding upslope with warming temperatures.',
  },
  {
    name: 'Oahu', severity: 'red', threats: 247,
    species: [
      { name: 'Little Fire Ant', risk: 'High Risk', note: 'Established in multiple valleys' },
      { name: 'Coconut Rhinoceros Beetle', risk: 'High Risk', note: 'Active eradication effort since 2013' },
      { name: 'Brown Tree Snake', risk: 'High Risk', note: 'Interdiction program at ports — not yet established' },
      { name: 'Miconia', risk: 'High Risk', note: 'Targeted removal in Koolau range' },
      { name: 'Coqui Frog', risk: 'Moderate Risk', note: 'Multiple populations across windward side' },
    ],
    summary: 'Most urbanized island, highest port traffic. Primary entry point for new invasives. The coconut rhinoceros beetle fight has cost over $20M since detection.',
  },
  {
    name: 'Molokai', severity: 'orange', threats: 64,
    species: [
      { name: 'Axis Deer', risk: 'High Risk', note: 'Severe overgrazing, population over 50,000' },
      { name: 'Feral Pig', risk: 'High Risk', note: 'Damaging native watershed forests' },
      { name: 'Albizia', risk: 'Moderate Risk', note: 'Fast-growing tree displacing native canopy' },
    ],
    summary: 'Axis deer population has exploded beyond carrying capacity, stripping vegetation and causing severe erosion. Residents report bare hillsides where forest stood a decade ago.',
  },
  {
    name: 'Lanai', severity: 'yellow', threats: 38,
    species: [
      { name: 'Axis Deer', risk: 'High Risk', note: 'Population of ~30,000 on 141 sq mi island' },
      { name: 'Fountain Grass', risk: 'Moderate Risk', note: 'Increasing fire risk in dry lowlands' },
    ],
    summary: 'Once the world\'s largest pineapple plantation. Axis deer now outnumber people roughly 30 to 1, preventing any native forest regeneration.',
  },
  {
    name: 'Maui', severity: 'red', threats: 183,
    species: [
      { name: 'Miconia', risk: 'High Risk', note: 'Major infestation in East Maui watershed' },
      { name: 'Coqui Frog', risk: 'High Risk', note: 'Widespread across East Maui' },
      { name: 'Axis Deer', risk: 'High Risk', note: 'Expanding into native forest areas' },
      { name: 'Rapid Ohia Death', risk: 'High Risk', note: 'Not yet confirmed — highest vigilance' },
      { name: 'Albizia', risk: 'Moderate Risk', note: 'Colonizing disturbed areas rapidly' },
    ],
    summary: 'Miconia has been the target of Hawaii\'s longest-running invasive plant control effort. Despite $15M spent, complete eradication has proven impossible in the wet East Maui forest.',
  },
  {
    name: 'Kahoolawe', severity: 'yellow', threats: 8,
    species: [
      { name: 'Kiawe', risk: 'Moderate Risk', note: 'Dominant vegetation on eroded landscape' },
    ],
    summary: 'Uninhabited island, formerly used as military bombing range. Severely eroded with limited native vegetation remaining. Restoration efforts ongoing.',
  },
  {
    name: 'Hawaii', severity: 'red', threats: 312,
    species: [
      { name: 'Rapid Ohia Death', risk: 'High Risk', note: 'Epicenter of outbreak — millions of trees dead' },
      { name: 'Coqui Frog', risk: 'High Risk', note: 'Densest populations anywhere; up to 10,000/acre' },
      { name: 'Little Fire Ant', risk: 'High Risk', note: 'Established in Puna, spreading' },
      { name: 'Feral Pig', risk: 'High Risk', note: 'Major vector for disease and erosion' },
      { name: 'Albizia', risk: 'High Risk', note: 'Falls on power lines during storms, causes outages' },
      { name: 'Strawberry Guava', risk: 'High Risk', note: 'Dominant in wet forest understory' },
    ],
    summary: 'The Big Island is ground zero for Rapid Ohia Death, which has killed over 1 million ohia trees since 2014. As the largest and youngest island, it has the most diverse habitats — and the most to lose.',
  },
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

// ── Scroll Progress Bar ──────────────────────────────────────────────────

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      style={{ scaleX, transformOrigin: '0%' }}
      className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500 z-[60]"
    />
  );
}



// ── Species Arrival Ticker ───────────────────────────────────────────────

function ArrivalTicker() {
  const doubled = [...ARRIVAL_TICKER_SPECIES, ...ARRIVAL_TICKER_SPECIES];

  return (
    <section className="py-10 overflow-hidden border-y border-slate-800/50 bg-slate-950/50">
      <p className="text-center text-xs text-slate-600 uppercase tracking-widest mb-4">
        20+ new species arrive in Hawaii every year
      </p>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-950 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-950 to-transparent z-10" />
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
          className="flex items-center gap-6 whitespace-nowrap"
        >
          {doubled.map((species, i) => (
            <span key={i} className="text-sm text-slate-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
              {species}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Section Components ───────────────────────────────────────────────────

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
              <Globe2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                InvasiveWatch
              </h1>
              <p className="text-xs text-slate-500">Global Species Tracker</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-slate-400 text-sm hover:text-white transition-colors">Dashboard</Link>
            <span className="text-white text-sm font-medium">Research</span>
          </nav>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative px-6 pt-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.08)_0%,_transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="relative text-center max-w-4xl"
      >
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500 mb-6">Case Study</p>
        <h2 className="text-5xl md:text-7xl font-bold leading-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Hawaii's Silent War
        </h2>
        <p className="text-2xl md:text-3xl text-slate-500 mt-3 font-light">
          One Archipelago. 10,000 Threats.
        </p>
        <blockquote className="mt-10 text-lg md:text-xl text-slate-400 italic max-w-2xl mx-auto leading-relaxed">
          "The Hawaiian Islands are the bird extinction capital of the world. Invasive species are the primary cause."
        </blockquote>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        className="absolute bottom-10"
      >
        <ChevronDown className="w-6 h-6 text-slate-600" />
      </motion.div>
    </section>
  );
}

function StatsBar() {
  return (
    <section className="bg-slate-900/50 border-y border-slate-800/50 py-12 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/50 text-center"
          >
            <p className="text-3xl md:text-4xl font-bold text-white">
              {stat.prefix}<CountUp target={stat.value} />{stat.suffix}
            </p>
            <p className="text-sm text-slate-300 mt-1 font-medium">{stat.label}{stat.cite && <Cite href={stat.cite.href} n={stat.cite.n} />}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.sublabel}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CrisisSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
        <div>
          <motion.h3
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-white mb-8"
          >
            An Archipelago Under Siege
          </motion.h3>
          <div className="space-y-5 text-slate-400 leading-relaxed">
            <p>
              Hawaii's geographic isolation made it one of the most biologically unique places on Earth. Over millions of years, species arrived roughly once every 100,000 years by wind, ocean currents, and birds. This extreme isolation produced extraordinary endemism — more than 90% of Hawaii's native species are found nowhere else.<Cite href="https://www.nfwf.org/landscapes/hawaii" n={5} />
            </p>
            <p>
              The first wave of disruption came with Polynesian settlers around 400 CE, who introduced pigs, rats, and dozens of plant species. Within centuries, 50+ bird species that had evolved with no ground predators were driven to extinction. But this was only the beginning.
            </p>
            <p>
              European contact in 1778 opened the floodgates. Deliberate introductions of cattle, goats, and mongoose — along with accidental stowaways — multiplied the pressure. By 1900, alien species outnumbered native species in most lowland areas.
            </p>
            <p>
              Today, new invasive species arrive in Hawaii at an estimated rate of 20 per year.<Cite href="https://www.ctahr.hawaii.edu/adap/hottopics/invasive_species.htm" n={6} /> The archipelago lacks the continental buffer zones that allow other ecosystems to absorb pressure. What would be a local problem elsewhere becomes an extinction event in Hawaii.
            </p>
          </div>
        </div>

        <div className="relative pl-8">
          <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-700/50" />
          <div className="space-y-8">
            {TIMELINE_EVENTS.map((ev, i) => (
              <motion.div
                key={ev.year}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className={`absolute -left-5 top-1.5 w-3 h-3 rounded-full ${severityColor[ev.severity]} ring-4 ring-slate-950`} />
                <p className="text-sm font-semibold text-slate-300">{ev.year}</p>
                <p className="text-sm text-slate-500 mt-1">{ev.event}{ev.cite && <Cite href={ev.cite.href} n={ev.cite.n} />}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SpeciesCard({ species }) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-white font-medium">{species.commonName}</h4>
          <p className="text-xs text-slate-500 italic">{species.scientificName}</p>
        </div>
        <Badge className={getRiskBadgeStyle(species.riskLevel)}>{species.riskLevel}</Badge>
      </div>
      <Badge className="bg-slate-700/50 text-slate-400 border-0 text-xs mb-3">Origin: {species.origin}</Badge>
      <p className="text-sm text-slate-400 mb-3">{species.impact}{species.cite && <Cite href={species.cite.href} n={species.cite.n} />}</p>
      <div className="flex items-center gap-2">
        <Progress value={species.coveragePercent} className="h-2 flex-1 bg-slate-700" />
        <span className="text-xs text-slate-500 tabular-nums w-8 text-right">{species.coveragePercent}%</span>
      </div>
      <p className="text-[10px] text-slate-600 mt-1">Invasion coverage</p>
    </div>
  );
}

function SpeciesSpotlightSection() {
  return (
    <section className="py-24 px-6 bg-slate-900/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h3 className="text-3xl font-bold text-white">Species That Changed Everything</h3>
          <p className="text-slate-500 mt-2">A few of the organisms reshaping Hawaii's ecosystems.</p>
        </motion.div>

        <Tabs defaultValue="plants" className="w-full">
          <TabsList className="bg-slate-800/50 border border-slate-700/50 mx-auto flex w-fit">
            <TabsTrigger value="plants" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              <Leaf className="w-4 h-4 mr-1.5" /> Plants
            </TabsTrigger>
            <TabsTrigger value="animals" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              <AlertTriangle className="w-4 h-4 mr-1.5" /> Animals
            </TabsTrigger>
            <TabsTrigger value="insects" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              <Bug className="w-4 h-4 mr-1.5" /> Insects & Pathogens
            </TabsTrigger>
          </TabsList>

          {Object.entries(SPECIES_DATA).map(([key, species]) => (
            <TabsContent key={key} value={key} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {species.map(s => <SpeciesCard key={s.scientificName} species={s} />)}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

const chartTooltipStyle = {
  contentStyle: { background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(51, 65, 85, 0.5)', borderRadius: '8px', color: '#e2e8f0' },
  itemStyle: { color: '#e2e8f0' },
  labelStyle: { color: '#94a3b8' },
};

function EcologicalImpactSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h3 className="text-3xl font-bold text-white">The Inversion</h3>
          <p className="text-slate-500 mt-2">Native vs. invasive species counts over time</p>
        </motion.div>

        <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={ECOLOGICAL_DATA} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" />
              <XAxis dataKey="era" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} />
              <Tooltip {...chartTooltipStyle} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
              <Bar dataKey="native" name="Native Species" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              <Bar dataKey="invasive" name="Invasive Species" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-slate-500 text-sm text-center italic mt-4">
            For every native species present today, Hawaii has nearly four invasive species competing for the same resources.
          </p>
        </div>
      </div>
    </section>
  );
}

function SpreadMechanicsSection() {
  return (
    <section className="py-24 px-6 bg-slate-900/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h3 className="text-3xl font-bold text-white">How Species Cross the Pacific</h3>
          <p className="text-slate-500 mt-2">The pathways that keep the invasion accelerating.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PATHWAYS.map((pw, i) => (
            <motion.div
              key={pw.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50"
            >
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl w-fit mb-4">
                <pw.icon className="w-6 h-6 text-cyan-400" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">{pw.title}</h4>
              <p className="text-sm text-slate-400 leading-relaxed">{pw.body}{pw.cite && <Cite href={pw.cite.href} n={pw.cite.n} />}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BiodiversityLossSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.blockquote
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xl md:text-2xl text-slate-300 italic text-center mb-10 leading-relaxed max-w-3xl mx-auto"
        >
          "Of the 71 native forest bird species documented at European contact, only 12 survive today. No other place on Earth has lost more bird species in recorded history."
          <Cite href="https://dlnr.hawaii.gov/wildlife/birds/" n={15} />
        </motion.blockquote>

        <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={BIRD_DECLINE_DATA}>
              <defs>
                <linearGradient id="birdDecline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" />
              <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} domain={[0, 80]} />
              <Tooltip {...chartTooltipStyle} />
              <Area type="monotone" dataKey="species" name="Surviving Species" stroke="#ef4444" fill="url(#birdDecline)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-slate-600 text-xs text-center mt-4">
            Data compiled from IUCN Red List, USGS Hawaiian Forest Bird Survey, and State of Hawaii DLNR records.
          </p>
        </div>
      </div>
    </section>
  );
}

function FailedResponsesSection() {
  return (
    <section className="py-24 px-6 bg-slate-900/30">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h3 className="text-3xl font-bold text-white">Why Conventional Responses Fall Short</h3>
          <p className="text-slate-500 mt-2">Decades of management efforts have yielded local victories — but the systemic threat keeps escalating.</p>
        </motion.div>

        <Accordion type="multiple" className="space-y-2">
          {FAILED_RESPONSES.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-slate-800/50 bg-slate-800/30 rounded-xl px-4">
              <AccordionTrigger className="text-white text-left hover:no-underline text-sm md:text-base">
                {item.title}
              </AccordionTrigger>
              <AccordionContent className="text-slate-400 text-sm leading-relaxed">
                {item.body}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function DataGapSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        {/* Radar visualization */}
        <div className="relative aspect-square max-w-sm mx-auto w-full">
          {[100, 75, 50, 25].map((size) => (
            <div
              key={size}
              className="absolute border border-slate-700/30 rounded-full"
              style={{
                width: `${size}%`, height: `${size}%`,
                top: `${(100 - size) / 2}%`, left: `${(100 - size) / 2}%`,
              }}
            />
          ))}
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute w-3 h-3 bg-cyan-400 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-cyan-400/50"
          />
          {[
            { top: '15%', left: '60%', delay: 0 },
            { top: '70%', left: '25%', delay: 1 },
            { top: '40%', left: '80%', delay: 2 },
          ].map((dot, i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 3, delay: dot.delay }}
              className="absolute w-2 h-2 bg-red-400 rounded-full"
              style={{ top: dot.top, left: dot.left }}
            />
          ))}
          <p className="absolute -bottom-8 left-0 right-0 text-center text-xs text-slate-600">
            Each pulse represents an undetected species.
          </p>
        </div>

        {/* Text */}
        <div>
          <motion.h3
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-white mb-6"
          >
            The Surveillance Gap
          </motion.h3>
          <div className="space-y-4 text-slate-400 leading-relaxed text-sm">
            <p>
              The fundamental problem is that we see the damage long after the invasion becomes irreversible. By the time Rapid Ohia Death was identified in 2014, it had already killed over a million trees. By the time coqui frogs were recognized as a threat, they had established on four islands.
            </p>
            <p>
              Effective management requires knowing where species are before they reach critical mass. This demands continuous, systematic monitoring at scales no single agency can currently provide.
            </p>
            <p>
              The window for effective intervention is narrow. Research suggests a new invasive population can be eradicated for roughly $4,000 if caught within its first year. That cost rises to $1.2 million after three years.<Cite href="https://www.kauaiisc.org/the-cost-of-invasive-species/" n={16} /> After ten years, eradication is typically impossible.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-8">
            {[
              { cost: '$4K', when: 'If caught in Year 1' },
              { cost: '$1.2M', when: 'If caught in Year 3' },
              { cost: '???', when: 'After Year 10' },
            ].map((item) => (
              <div key={item.cost} className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-3 text-center">
                <p className="text-red-400 font-bold text-lg">{item.cost}</p>
                <p className="text-red-400/60 text-xs mt-0.5">{item.when}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PageFooter() {
  return (
    <footer className="py-12 px-6">
      <Separator className="bg-slate-800 mb-10" />
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Return to Dashboard
        </Link>
        <p className="text-slate-600 text-xs leading-relaxed">
          Data sources:{' '}
          <a href="https://www.iucnredlist.org/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 underline underline-offset-2">IUCN Red List</a>,{' '}
          <a href="https://www.usgs.gov/centers/pierc" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 underline underline-offset-2">USGS PIERC</a>,{' '}
          <a href="https://dlnr.hawaii.gov/hisc/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 underline underline-offset-2">Hawaii DLNR</a>,{' '}
          <a href="https://www.bishopmuseum.org/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 underline underline-offset-2">Bishop Museum</a>,{' '}
          <a href="https://www.nature.org/en-us/about-us/where-we-work/united-states/hawaii/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 underline underline-offset-2">Nature Conservancy of Hawaii</a>.
        </p>
        <div className="flex items-center justify-center gap-2 text-slate-600">
          <div className="p-1.5 bg-gradient-to-br from-blue-500/50 to-cyan-500/50 rounded-lg">
            <Globe2 className="w-4 h-4 text-white/70" />
          </div>
          <span className="text-sm">InvasiveWatch</span>
        </div>
      </div>
    </footer>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────

export default function HawaiiCaseStudy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <ScrollProgressBar />
      <Header />
      <main className="pt-20">
        <HeroSection />
        <StatsBar />
        <ArrivalTicker />
        <CrisisSection />
        <SpeciesSpotlightSection />
        <EcologicalImpactSection />
        <SpreadMechanicsSection />
        <BiodiversityLossSection />
        <FailedResponsesSection />
        <DataGapSection />
      </main>
      <PageFooter />
    </div>
  );
}
