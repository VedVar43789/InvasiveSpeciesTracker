import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Globe2, Bug, AlertTriangle, X, Search, Leaf, Loader2
} from 'lucide-react';
import { scanRisk } from '@/api/client';

const SAN_DIEGO = { lat: 32.7157, lng: -117.1611, name: "San Diego" };

// Build heatmap data from scan results — single point at SD with
// intensity derived from the ratio of high-risk species found.
function buildHeatmapData(results) {
  if (!results?.length) return [];

  const highCount = results.filter(s => s.risk_label === 'High Risk').length;
  const intensity = Math.min(highCount / results.length + 0.3, 1.0);

  return [{ lat: SAN_DIEGO.lat, lng: SAN_DIEGO.lng, intensity }];
}

function getRiskBadgeStyle(label) {
  if (label === 'High Risk') return 'bg-red-500/20 text-red-400';
  if (label === 'Moderate Risk') return 'bg-orange-500/20 text-orange-400';
  return 'bg-yellow-500/20 text-yellow-400';
}

export default function Home() {
  const globeEl = useRef();
  const hasAutoScanned = useRef(false);

  const [riskData, setRiskData] = useState(null);
  const [heatCloudData, setHeatCloudData] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const highRiskCount = riskData?.results?.filter(r => r.risk_label === 'High Risk').length ?? 0;
  const modRiskCount = riskData?.results?.filter(r => r.risk_label === 'Moderate Risk').length ?? 0;
  const speciesCount = riskData?.results?.length ?? 0;

  const runScan = useCallback(async () => {
    setIsScanning(true);
    setScanError(null);
    setRiskData(null);
    setHeatCloudData([]);

    try {
      const data = await scanRisk({
        lat: SAN_DIEGO.lat,
        lng: SAN_DIEGO.lng,
        radius_km: 50,
      });
      setRiskData(data);
      setHeatCloudData(buildHeatmapData(data.results));
    } catch (err) {
      setScanError(err.message);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Auto-zoom and auto-scan on mount
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
      setTimeout(() => runScan(), 2200);
    }
  }, [runScan]);

  // High risk species list for the modal
  const highRiskSpecies = useMemo(() => {
    return (riskData?.results ?? []).filter(r => r.risk_label === 'High Risk');
  }, [riskData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                <Globe2 className="w-6 h-6 text-white" />
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
              <a href="#" className="text-slate-400 text-sm hover:text-white transition-colors">Research</a>
            </nav>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <Search className="w-5 h-5" />
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={runScan}
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

            pointsData={[SAN_DIEGO]}
            pointLat="lat"
            pointLng="lng"
            pointColor={() => 'rgba(255,255,255,0.85)'}
            pointAltitude={() => 0.025}
            pointRadius={() => 0.35}
            pointLabel={() =>
              `<div style="background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px); padding: 12px; border-radius: 8px; border: 1px solid rgba(148, 163, 184, 0.5);">` +
              `<div style="color: white; font-weight: 600; font-size: 14px; margin-bottom: 4px;">San Diego</div>` +
              `<div style="color: rgba(148, 163, 184, 1); font-size: 12px;">Click to view risk analysis</div></div>`
            }
            onPointClick={() => setShowModal(true)}

            heatmapsData={[heatCloudData]}
            heatmapPoints={d => d}
            heatmapPointLat="lat"
            heatmapPointLng="lng"
            heatmapPointWeight="intensity"
            heatmapBandwidth={1.5}
            heatmapTopAltitude={0.005}
            heatmapsTransitionDuration={500}

            ringsData={riskData ? [{ lat: SAN_DIEGO.lat, lng: SAN_DIEGO.lng }] : []}
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
                <p className="text-sm text-slate-300">Scanning San Diego...</p>
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
            <div className="absolute top-6 left-6 bg-red-900/80 backdrop-blur-xl rounded-2xl p-4 border border-red-700/50">
              <p className="text-sm text-red-300">{scanError}</p>
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
            onClick={() => setShowModal(false)}
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
                  <h2 className="text-xl font-bold text-white">San Diego Risk Analysis</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {riskData.meta?.rainfall_used ? `${Math.round(riskData.meta.rainfall_used)} mm rainfall` : ''} · pH {riskData.meta?.soil_ph_used?.toFixed(1)} · {riskData.meta?.biome || "Auto-detected"} biome
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3 p-6 pb-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-red-400">{highRiskCount}</p>
                  <p className="text-xs text-red-400/80 mt-1">High Risk</p>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-orange-400">{modRiskCount}</p>
                  <p className="text-xs text-orange-400/80 mt-1">Moderate</p>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-cyan-400">{speciesCount}</p>
                  <p className="text-xs text-cyan-400/80 mt-1">Total Species</p>
                </div>
              </div>

              {/* Species list */}
              <div className="px-6 pb-2">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
                  High Risk Species ({highRiskSpecies.length})
                </h3>
              </div>
              <div className="px-6 pb-6 overflow-y-auto max-h-[40vh] space-y-2">
                {highRiskSpecies.length > 0 ? highRiskSpecies.map((species) => (
                  <div
                    key={species.scientific_name}
                    className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">
                          {species.common_name !== "Unknown" ? species.common_name : species.scientific_name}
                        </h4>
                        <p className="text-xs text-slate-500 italic truncate">{species.scientific_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {species.found_in_gbif_radius && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">
                              Nearby
                            </Badge>
                          )}
                          {species.is_invasive === 1 && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs">
                              Invasive
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-2">
                        <Badge className={`border-0 ${getRiskBadgeStyle(species.risk_label)}`}>
                          {species.risk_label}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {(species.risk_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-700 text-center">
                    <p className="text-sm text-slate-500">No high risk species detected</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
