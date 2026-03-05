import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useSpring } from 'framer-motion';
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
  Globe2, Leaf, Bug, ArrowLeft, Package, Plane, Globe, AlertTriangle
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
              <Globe2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
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

function PageIntro() {
  return (
    <section className="px-6 pt-8 pb-12 border-b border-slate-800/50">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Case Study</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white">
          Hawaii's Silent War
        </h2>
        <p className="text-lg text-slate-500 mt-2">
          One Archipelago. 10,000 Threats.
        </p>
        <p className="mt-4 text-sm text-slate-400 max-w-2xl leading-relaxed">
          Hawaii loses species faster than anywhere on Earth — and by the time threats are detected, it's often too late. InvasiveWatch uses predictive modeling to identify high-risk species <em>before</em> they establish, giving agencies the early warning that reactive monitoring can't.
        </p>
        <blockquote className="mt-6 text-sm text-slate-400 italic border-l-2 border-slate-700 pl-4 max-w-2xl">
          "The one process now going on that will take millions of years to correct is the loss of genetic and species diversity by the destruction of natural habitats. This is the folly our descendants are least likely to forgive us."
          <span className="block mt-1 text-xs text-slate-500 not-italic">— E.O. Wilson, biologist</span>
        </blockquote>
      </div>
    </section>
  );
}

function StatsBar() {
  return (
    <section className="py-12 px-6">
      <div className="max-w-4xl mx-auto flex flex-wrap items-baseline gap-x-10 gap-y-6">
        {STATS.map((stat, i) => (
          <React.Fragment key={stat.label}>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-white tabular-nums">
                {stat.prefix}<CountUp target={stat.value} />{stat.suffix}
              </p>
              <p className="text-sm text-slate-400 mt-0.5">{stat.label}{stat.cite && <Cite href={stat.cite.href} n={stat.cite.n} />}</p>
            </div>
            {i < STATS.length - 1 && <div className="hidden md:block w-px h-10 bg-slate-800" />}
          </React.Fragment>
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
          <h3 className="text-3xl font-bold text-white mb-8">
            An Archipelago Under Siege
          </h3>
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
            {TIMELINE_EVENTS.map((ev) => (
              <div key={ev.year} className="relative">
                <div className={`absolute -left-5 top-1.5 w-2.5 h-2.5 rounded-full ${severityColor[ev.severity]}`} />
                <p className="text-sm font-semibold text-slate-300">{ev.year}</p>
                <p className="text-sm text-slate-500 mt-1">{ev.event}{ev.cite && <Cite href={ev.cite.href} n={ev.cite.n} />}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SpeciesCard({ species }) {
  return (
    <div className="py-4">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h4 className="text-white font-medium">{species.commonName}</h4>
          <p className="text-xs text-slate-500 italic">{species.scientificName} · {species.origin}</p>
        </div>
        <Badge className={getRiskBadgeStyle(species.riskLevel)}>{species.riskLevel}</Badge>
      </div>
      <p className="text-sm text-slate-400 mt-2 leading-relaxed">{species.impact}{species.cite && <Cite href={species.cite.href} n={species.cite.n} />}</p>
      <div className="flex items-center gap-2 mt-3">
        <Progress value={species.coveragePercent} className="h-1.5 flex-1 bg-slate-800" />
        <span className="text-xs text-slate-500 tabular-nums">{species.coveragePercent}%</span>
      </div>
    </div>
  );
}

function SpeciesSpotlightSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h3 className="text-3xl font-bold text-white">Species That Changed Everything</h3>
          <p className="text-slate-500 mt-2">A few of the organisms reshaping Hawaii's ecosystems.</p>
        </div>

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
              <div className="divide-y divide-slate-800/60">
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
    <section className="py-24 px-6 bg-slate-900/30">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-3xl font-bold text-white mb-2">The Inversion</h3>
        <p className="text-slate-500 mb-8">Native vs. invasive species counts over time</p>

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
        <p className="text-slate-500 text-sm italic mt-4">
          For every native species present today, Hawaii has nearly four invasive species competing for the same resources.
        </p>
      </div>
    </section>
  );
}

function SpreadMechanicsSection() {
  return (
    <section className="py-24 px-6 bg-slate-900/30">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-3xl font-bold text-white mb-3">How Species Cross the Pacific</h3>
        <p className="text-slate-500 mb-10">The pathways that keep the invasion accelerating.</p>

        <div className="space-y-6">
          {PATHWAYS.map((pw) => (
            <div key={pw.title} className="flex gap-4 items-start">
              <pw.icon className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-base font-medium text-white mb-1">{pw.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{pw.body}{pw.cite && <Cite href={pw.cite.href} n={pw.cite.n} />}</p>
              </div>
            </div>
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
        <blockquote className="text-lg md:text-xl text-slate-300 italic mb-10 leading-relaxed max-w-3xl border-l-2 border-red-500/40 pl-4">
          "Of the 71 native forest bird species documented at European contact, only 12 survive today. No other place on Earth has lost more bird species in recorded history."
          <Cite href="https://dlnr.hawaii.gov/wildlife/birds/" n={15} />
        </blockquote>

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
        <p className="text-slate-600 text-xs mt-4">
          Data compiled from IUCN Red List, USGS Hawaiian Forest Bird Survey, and State of Hawaii DLNR records.
        </p>
      </div>
    </section>
  );
}

function FailedResponsesSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h3 className="text-3xl font-bold text-white">Why Conventional Responses Fall Short</h3>
          <p className="text-slate-500 mt-2">Decades of management efforts have yielded local victories — but the systemic threat keeps escalating.</p>
        </div>

        <Accordion type="multiple">
          {FAILED_RESPONSES.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-slate-800/40">
              <AccordionTrigger className="text-white text-left hover:no-underline text-sm md:text-base py-4">
                {item.title}
              </AccordionTrigger>
              <AccordionContent className="text-slate-400 text-sm leading-relaxed pb-4">
                {item.body}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

const FUNNEL_STAGES = [
  { label: 'Species Arrives', time: 'Day 0', cost: '$0', dotClass: 'bg-cyan-400', textClass: 'text-cyan-400' },
  { label: 'Detected', time: '~1 Year', cost: '$4K', dotClass: 'bg-blue-400', textClass: 'text-blue-400' },
  { label: 'Response Mounted', time: '~3 Years', cost: '$1.2M', dotClass: 'bg-orange-400', textClass: 'text-orange-400' },
  { label: 'Irreversible', time: '10+ Years', cost: '', dotClass: 'bg-red-400', textClass: 'text-red-400' },
];

function DataGapSection() {
  return (
    <section className="py-24 px-6 bg-slate-900/30">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-3xl font-bold text-white mb-2">The Surveillance Gap</h3>
        <p className="text-slate-500 mb-10">Why reactive monitoring fails — and why prediction matters.</p>

        <div className="grid md:grid-cols-2 gap-16">
          {/* Timeline */}
          <div className="relative pl-6">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-800" />
            <div className="space-y-8">
              {FUNNEL_STAGES.map((stage) => (
                <div key={stage.label} className="relative">
                  <div className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full ${stage.dotClass}/30 flex items-center justify-center`}>
                    <div className={`w-2 h-2 rounded-full ${stage.dotClass}`} />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm text-slate-200 font-medium">{stage.label}</p>
                    {stage.cost && <span className={`text-sm font-bold ${stage.textClass} tabular-nums`}>{stage.cost}</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{stage.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Text */}
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
        <PageIntro />
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
