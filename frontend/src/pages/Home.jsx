// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Globe from 'react-globe.gl';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Globe2, Bug, AlertTriangle, X, Search, Leaf, Loader2
} from 'lucide-react';
import { scanRisk } from '@/api/client';

const SAN_DIEGO = { lat: 32.7157, lng: -117.1611, name: "San Diego" };

function formatCoords({ lat, lng }) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return '';
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

// Build heatmap data from scan results — single point at the selected location
// with intensity derived from the ratio of high-risk species found.
function buildHeatmapData(results, location) {
  if (!results?.length) return [];

  const highCount = results.filter(s => s.risk_label === 'High Risk').length;
  const intensity = Math.min(highCount / results.length + 0.3, 1.0);

  return [{ lat: location.lat, lng: location.lng, intensity }];
}

function getRiskBadgeStyle(label) {
  if (label === 'High Risk') return 'bg-red-500/20 text-red-400';
  if (label === 'Moderate Risk') return 'bg-orange-500/20 text-orange-400';
  return 'bg-yellow-500/20 text-yellow-400';
}

export default function Home() {
  const globeEl = useRef(null);
  const hasAutoScanned = useRef(false);
  const isScanningRef = useRef(false);

  const [selectedLocation, setSelectedLocation] = useState(SAN_DIEGO);
  const [riskData, setRiskData] = useState(null);
  const [heatCloudData, setHeatCloudData] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);

  const highRiskCount = riskData?.results?.filter(r => r.risk_label === 'High Risk').length ?? 0;
  const modRiskCount = riskData?.results?.filter(r => r.risk_label === 'Moderate Risk').length ?? 0;
  const speciesCount = riskData?.results?.length ?? 0;

  const runScan = useCallback(async (location = selectedLocation) => {
    if (!location) return;
    isScanningRef.current = true;
    setIsScanning(true);
    setScanError(null);
    setRiskData(null);
    setHeatCloudData([]);

    try {
      const data = await scanRisk({
        lat: location.lat,
        lng: location.lng,
        radius_km: 50,
      });
      setRiskData(data);
      setHeatCloudData(buildHeatmapData(data.results, location));
    } catch (err) {
      setScanError(err.message);
    } finally {
      isScanningRef.current = false;
      setIsScanning(false);
    }
  }, [selectedLocation]);

  const handlePickLocation = useCallback(async (location, { flyTo = true } = {}) => {
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') return;
    if (isScanningRef.current) return;

    setExpandedCategory(null);
    setSelectedLocation(location);

    if (flyTo && globeEl.current) {
      globeEl.current.pointOfView(
        { lat: location.lat, lng: location.lng, altitude: 0.15 },
        1200
      );
    }

    await runScan(location);
    setShowModal(true);
  }, [runScan]);

  const pointsData = useMemo(() => {
    const base = [SAN_DIEGO];
    const isSameAsSanDiego =
      selectedLocation &&
      selectedLocation.lat === SAN_DIEGO.lat &&
      selectedLocation.lng === SAN_DIEGO.lng;

    if (!selectedLocation || isSameAsSanDiego) return base;
    return [...base, { ...selectedLocation, name: selectedLocation.name || 'Selected location' }];
  }, [selectedLocation]);

  // Auto-zoom and auto-scan on initial mount only
  useEffect(() => {
    if (!globeEl.current) return;

    globeEl.current.pointOfView(
      { lat: SAN_DIEGO.lat, lng: SAN_DIEGO.lng, altitude: 0.15 },
      2500,
    );

    const controls = globeEl.current.controls();
    controls.autoRotate = false;
    controls.minDistance = 101;
    controls.maxDistance = 500;

    if (!hasAutoScanned.current) {
      hasAutoScanned.current = true;
      setTimeout(() => runScan(SAN_DIEGO), 2200);
    }
    // We intentionally want this effect to run only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);

  // Species lists by category for the modal
  const highRiskSpecies = useMemo(() => {
    return (riskData?.results ?? []).filter(r => r.risk_label === 'High Risk');
  }, [riskData]);

  const moderateRiskSpecies = useMemo(() => {
    return (riskData?.results ?? []).filter(r => r.risk_label === 'Moderate Risk');
  }, [riskData]);

  const lowRiskSpecies = useMemo(() => {
    return (riskData?.results ?? []).filter(r => r.risk_label === 'Low Risk');
  }, [riskData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <img src="/favicon/favicon-96x96.png" alt="InvasiveWatch" className="w-9 h-9 rounded-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  InvasiveWatch
                </h1>
                <p className="text-xs text-slate-500">Global Species Tracker</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#" className="text-white text-sm font-medium">Dashboard</a>
              <a href="#" className="text-slate-400 text-sm hover:text-white transition-colors">Species</a>
              <a href="#" className="text-slate-400 text-sm hover:text-white transition-colors">Reports</a>
              <Link to="/research" className="text-slate-400 text-sm hover:text-white transition-colors">Why track? · Hawaii</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <Search className="w-5 h-5" />
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => runScan(selectedLocation)}
                disabled={isScanning}
              >
                {isScanning && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {isScanning ? 'Scanning...' : 'Rescan'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-20">
        <div className="h-[calc(100vh-80px)] relative bg-slate-950">
          <Globe
            ref={globeEl}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            waitForGlobeReady={true}

            onGlobeClick={({ lat, lng }) => {
              console.log('GLOBE CLICK', lat, lng);
              handlePickLocation({ lat, lng, name: 'Selected location' });
            }}
            onHeatmapClick={(heatmap, event, coords) => {
              if (!coords) return;
              console.log('HEATMAP CLICK', coords.lat, coords.lng);
              handlePickLocation({ lat: coords.lat, lng: coords.lng, name: 'Selected location' }, { flyTo: false });
            }}

            pointsData={pointsData}

            onPointClick={(point, event, coords) => {
              console.log('POINT CLICK', point, coords);
              handlePickLocation(point);
            }}
            pointLat="lat"
            pointLng="lng"
            pointColor={d => (d?.name === 'San Diego' ? 'rgba(255,255,255,0.85)' : 'rgba(34,211,238,0.95)')}
            pointAltitude={() => 0.025}
            pointRadius={() => 0.35}
            pointLabel={d => {
              const title = d?.name || 'Location';
              const coords = d?.lat != null && d?.lng != null ? formatCoords(d) : '';
              return (
                `<div style="background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px); padding: 12px; border-radius: 8px; border: 1px solid rgba(148, 163, 184, 0.5);">` +
                `<div style="color: white; font-weight: 600; font-size: 14px; margin-bottom: 2px;">${title}</div>` +
                (coords ? `<div style="color: rgba(148, 163, 184, 1); font-size: 12px; margin-bottom: 4px;">${coords}</div>` : '') +
                `<div style="color: rgba(148, 163, 184, 1); font-size: 12px;">Click to scan this location</div></div>`
              );
            }}

            heatmapsData={[heatCloudData]}
            heatmapPoints={d => d}
            heatmapPointLat="lat"
            heatmapPointLng="lng"
            heatmapPointWeight="intensity"
            heatmapBandwidth={1.5}
            heatmapTopAltitude={0.005}
            heatmapsTransitionDuration={500}

            ringsData={riskData ? [{ lat: selectedLocation.lat, lng: selectedLocation.lng }] : []}
            ringLat="lat"
            ringLng="lng"
            ringColor={() => ['rgba(59,130,246,0.6)', 'rgba(59,130,246,0)']}
            ringMaxRadius={3}
            ringPropagationSpeed={2}
            ringRepeatPeriod={1500}

            atmosphereColor="#87ceeb"
            atmosphereAltitude={0.15}
            enablePointerInteraction={true}
          />

          {/* Legend */}
          <div className="absolute bottom-6 left-6">
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">Threat Level</p>
              <div className="flex items-center gap-4">
                {[
                  { color: 'bg-emerald-500', label: 'Low' },
                  { color: 'bg-yellow-500', label: 'Medium' },
                  { color: 'bg-orange-500', label: 'High' },
                  { color: 'bg-red-500', label: 'Critical' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-xs text-slate-300">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scanning indicator */}
          {isScanning && (
            <div className="absolute bottom-6 right-6">
              <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <p className="text-sm text-slate-300">
                  Scanning {selectedLocation?.name || formatCoords(selectedLocation) || 'location'}...
                </p>
              </div>
            </div>
          )}

          {/* Quick stats (top-left, once loaded) */}
          {riskData && !isScanning && (
            <div className="absolute top-6 left-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/50 cursor-pointer hover:border-slate-600/50 transition-colors"
                onClick={() => setShowModal(true)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Bug className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-slate-300">{speciesCount} species</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400 font-semibold">{highRiskCount} high risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-slate-300">{riskData.meta?.biome || "Auto"}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Click to view details</p>
              </motion.div>
            </div>
          )}

          {scanError && (
            <div className="absolute top-6 left-6 bg-red-900/80 backdrop-blur-xl rounded-2xl p-4 border border-red-700/50 max-w-sm">
              <p className="text-sm text-red-300">Scan failed: {scanError}</p>
              <p className="text-xs text-red-400/80 mt-1">Ensure the backend is running and VITE_API_BASE_URL points to it.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-red-600 text-red-200 hover:bg-red-800/50"
                onClick={() => { setScanError(null); runScan(selectedLocation); }}
              >
                Try again
              </Button>
            </div>
          )}

        </div>
      </main>

      {/* Modal overlay */}
      <AnimatePresence>
        {showModal && riskData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            onClick={() => { setShowModal(false); setExpandedCategory(null); }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {(selectedLocation?.name || 'Location')} Risk Analysis
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatCoords(selectedLocation)}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    {riskData.meta?.rainfall_used ? `${Math.round(riskData.meta.rainfall_used)} mm rainfall` : ''} · pH {riskData.meta?.soil_ph_used?.toFixed(1)} · {riskData.meta?.biome || "Auto-detected"} biome
                  </p>
                </div>
                <button onClick={() => { setShowModal(false); setExpandedCategory(null); }} className="text-slate-400 hover:text-white transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Clickable category cards */}
              <div className="grid grid-cols-3 gap-3 p-6 pb-4">
                {[
                  { key: 'high', label: 'High Risk', count: highRiskCount, bg: 'bg-red-500/10', border: 'border-red-500/20', activeBorder: 'border-red-500/60', text: 'text-red-400', subtext: 'text-red-400/80' },
                  { key: 'moderate', label: 'Moderate', count: modRiskCount, bg: 'bg-orange-500/10', border: 'border-orange-500/20', activeBorder: 'border-orange-500/60', text: 'text-orange-400', subtext: 'text-orange-400/80' },
                  { key: 'low', label: 'Low Risk', count: speciesCount - highRiskCount - modRiskCount, bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', activeBorder: 'border-yellow-500/60', text: 'text-yellow-400', subtext: 'text-yellow-400/80' },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setExpandedCategory(expandedCategory === cat.key ? null : cat.key)}
                    className={`${cat.bg} border ${expandedCategory === cat.key ? cat.activeBorder : cat.border} rounded-xl p-4 text-center transition-all hover:scale-105 cursor-pointer`}
                  >
                    <p className={`text-3xl font-bold ${cat.text}`}>{cat.count}</p>
                    <p className={`text-xs ${cat.subtext} mt-1`}>{cat.label}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Click to view</p>
                  </button>
                ))}
              </div>

              {/* Expanded species list */}
              <AnimatePresence mode="wait">
                {expandedCategory && (() => {
                  const categoryMap = {
                    high: { label: 'High Risk', species: highRiskSpecies },
                    moderate: { label: 'Moderate Risk', species: moderateRiskSpecies },
                    low: { label: 'Low Risk', species: lowRiskSpecies },
                  };
                  const { label, species } = categoryMap[expandedCategory];
                  return (
                    <motion.div
                      key={expandedCategory}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-2">
                        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
                          {label} Species ({species.length})
                        </h3>
                      </div>
                      <div className="px-6 pb-6 overflow-y-auto max-h-[35vh] space-y-2">
                        {species.length > 0 ? species.map((s) => (
                          <div
                            key={s.scientific_name}
                            className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium truncate">
                                  {s.common_name !== "Unknown" ? s.common_name : s.scientific_name}
                                </h4>
                                <p className="text-xs text-slate-500 italic truncate">{s.scientific_name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {s.found_in_gbif_radius && (
                                    <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">
                                      Nearby
                                    </Badge>
                                  )}
                                  {s.is_invasive === 1 && (
                                    <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs">
                                      Invasive
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 ml-2">
                                <Badge className={`border-0 ${getRiskBadgeStyle(s.risk_label)}`}>
                                  {s.risk_label}
                                </Badge>
                                <span className="text-xs text-slate-500">
                                  {(s.risk_score * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="p-4 rounded-xl border border-dashed border-slate-700 text-center">
                            <p className="text-sm text-slate-500">No {label.toLowerCase()} species detected</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
