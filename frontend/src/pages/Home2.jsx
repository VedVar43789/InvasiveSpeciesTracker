// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Globe2, Bug, AlertTriangle, X, Search, Leaf, Loader2, ArrowRight, MapPin
} from 'lucide-react';
import { scanRisk } from '@/api/client';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const SAN_DIEGO = { lat: 32.7157, lng: -117.1611, name: "San Diego" };

function formatCoords({ lat, lng }) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return '';
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function buildHeatmapGeoJSON(results, location) {
  if (!results?.length || !location) return { type: 'FeatureCollection', features: [] };

  return {
    type: 'FeatureCollection',
    features: results.map((species) => {
      const severity =
        species.risk_label === 'High Risk' ? 1.0 :
        species.risk_label === 'Moderate Risk' ? 0.6 : 0.3;
      const jitter = () => (Math.random() - 0.5) * 0.4;
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [location.lng + jitter(), location.lat + jitter()],
        },
        properties: {
          severity,
          risk_score: species.risk_score,
          risk_label: species.risk_label,
          name: species.scientific_name,
        },
      };
    }),
  };
}

function getRiskBadgeStyle(label) {
  if (label === 'High Risk') return 'bg-red-500/20 text-red-400';
  if (label === 'Moderate Risk') return 'bg-orange-500/20 text-orange-400';
  return 'bg-yellow-500/20 text-yellow-400';
}

export default function Home2() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const sdMarkerRef = useRef(null);
  const hasAutoScanned = useRef(false);

  const [selectedLocation, setSelectedLocation] = useState(SAN_DIEGO);
  const [riskData, setRiskData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);

  const highRiskCount = riskData?.results?.filter(r => r.risk_label === 'High Risk').length ?? 0;
  const modRiskCount = riskData?.results?.filter(r => r.risk_label === 'Moderate Risk').length ?? 0;
  const speciesCount = riskData?.results?.length ?? 0;

  const runScan = useCallback(async (location) => {
    if (!location) return;
    setIsScanning(true);
    setScanError(null);
    setRiskData(null);

    try {
      const data = await scanRisk({
        lat: location.lat,
        lng: location.lng,
        radius_km: 50,
      });
      setRiskData(data);
      updateHeatmap(data.results, location);
    } catch (err) {
      setScanError(err.message);
    } finally {
      setIsScanning(false);
    }
  }, []);

  const updateHeatmap = useCallback((results, location) => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const geojson = buildHeatmapGeoJSON(results, location);

    if (map.getSource('scan-results')) {
      map.getSource('scan-results').setData(geojson);
    }
  }, []);

  const handlePickLocation = useCallback(async (location, { flyTo = true } = {}) => {
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') return;

    setExpandedCategory(null);
    setSelectedLocation(location);
    updateSelectedMarker(location);

    if (flyTo && mapRef.current) {
      mapRef.current.flyTo({
        center: [location.lng, location.lat],
        zoom: 8,
        duration: 1200,
      });
    }

    await runScan(location);
    setShowModal(true);
  }, [runScan]);

  const updateSelectedMarker = useCallback((location) => {
    if (markerRef.current) {
      markerRef.current.setLngLat([location.lng, location.lat]);
    }
  }, []);

  // Initialize map once
  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      projection: 'globe',
      config: {
        basemap: {
          theme: 'default',
          lightPreset: 'dusk',
        },
      },
      center: [SAN_DIEGO.lng, SAN_DIEGO.lat],
      zoom: 3,
      pitch: 0 // remove if you want to see the globe
    });

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    mapRef.current = map;

    // San Diego permanent marker
    const sdEl = document.createElement('div');
    sdEl.style.cssText = 'width:16px;height:16px;background:white;border-radius:50%;border:2px solid rgba(59,130,246,0.8);box-shadow:0 0 8px rgba(59,130,246,0.5);cursor:pointer;';
    sdMarkerRef.current = new mapboxgl.Marker({ element: sdEl })
      .setLngLat([SAN_DIEGO.lng, SAN_DIEGO.lat])
      .setPopup(new mapboxgl.Popup({ offset: 12, closeButton: false }).setHTML(
        '<div style="font-size:13px;font-weight:600;">San Diego</div>' +
        '<div style="font-size:11px;color:#94a3b8;">Click to scan</div>'
      ))
      .addTo(map);

    sdEl.addEventListener('click', (e) => {
      e.stopPropagation();
      handlePickLocationRef.current(SAN_DIEGO);
    });

    // Selected-location marker (cyan, starts hidden at SD)
    const selEl = document.createElement('div');
    selEl.style.cssText = 'width:14px;height:14px;background:rgb(34,211,238);border-radius:50%;border:2px solid rgba(34,211,238,0.4);box-shadow:0 0 10px rgba(34,211,238,0.6);display:none;';
    markerRef.current = new mapboxgl.Marker({ element: selEl })
      .setLngLat([SAN_DIEGO.lng, SAN_DIEGO.lat])
      .addTo(map);

    map.on('load', () => {
      // Empty heatmap source
      map.addSource('scan-results', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'risk-heat',
        type: 'heatmap',
        source: 'scan-results',
        paint: {
          'heatmap-weight': ['get', 'severity'],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 0.6, 9, 3],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.15, 'rgba(253,224,71,0.4)',
            0.4, 'rgba(251,146,60,0.6)',
            0.65, 'rgba(239,68,68,0.75)',
            1, 'rgba(220,38,38,0.9)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 4, 6, 30, 12, 60],
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.85, 14, 0.3],
        },
      });

      // Fly to San Diego and auto-scan
      map.flyTo({ center: [SAN_DIEGO.lng, SAN_DIEGO.lat], zoom: 7, duration: 2500 });

      if (!hasAutoScanned.current) {
        hasAutoScanned.current = true;
        setTimeout(() => handlePickLocationRef.current(SAN_DIEGO, { flyTo: false }), 2800);
      }
    });

    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      // Show the selected marker
      if (markerRef.current) {
        markerRef.current.getElement().style.display = 'block';
        markerRef.current.setLngLat([lng, lat]);
      }
      handlePickLocationRef.current({ lat, lng, name: 'Selected location' }, { flyTo: false });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stable ref so map callbacks always see the latest handlePickLocation
  const handlePickLocationRef = useRef(handlePickLocation);
  useEffect(() => {
    handlePickLocationRef.current = handlePickLocation;
  }, [handlePickLocation]);

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
              <Link to="/" className="text-slate-400 text-sm hover:text-white transition-colors">Globe View</Link>
              <a href="#" className="text-white text-sm font-medium">Map View</a>
              <a href="#" className="text-slate-400 text-sm hover:text-white transition-colors">Reports</a>
              <Link to="/hawaii" className="text-slate-400 text-sm hover:text-white transition-colors">Research</Link>
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

      {/* Map */}
      <main className="pt-20">
        <div className="h-[calc(100vh-80px)] relative bg-slate-950">
          <div ref={mapContainerRef} className="absolute inset-0" />

          {/* Coordinates display */}
          {selectedLocation && (
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl px-3 py-2 border border-slate-700/50 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs text-slate-300 font-mono">
                  {formatCoords(selectedLocation)}
                </span>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-6 left-6 z-10">
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">Threat Level</p>
              <div className="flex items-center gap-4">
                {[
                  { color: 'bg-yellow-400', label: 'Low' },
                  { color: 'bg-orange-500', label: 'Medium' },
                  { color: 'bg-red-500', label: 'High' },
                  { color: 'bg-red-700', label: 'Critical' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-xs text-slate-300">{item.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Click anywhere on the map to scan</p>
            </div>
          </div>

          {/* Scanning indicator */}
          {isScanning && (
            <div className="absolute bottom-6 right-6 z-10">
              <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <p className="text-sm text-slate-300">
                  Scanning {selectedLocation?.name || formatCoords(selectedLocation) || 'location'}...
                </p>
              </div>
            </div>
          )}

          {/* Quick stats */}
          {riskData && !isScanning && (
            <div className="absolute top-6 left-6 z-10">
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
            <div className="absolute top-6 left-6 z-10 bg-red-900/80 backdrop-blur-xl rounded-2xl p-4 border border-red-700/50 max-w-sm">
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

          {/* Case study nudge */}
          <Link to="/hawaii" className="absolute bottom-6 right-6 group z-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4, duration: 1 }}
              className="bg-slate-900/80 backdrop-blur-xl rounded-2xl px-5 py-3 border border-slate-700/50 hover:border-slate-500/50 transition-all cursor-pointer"
            >
              <p className="text-sm text-slate-300 group-hover:text-white transition-colors flex items-center gap-2">
                Why track invasive species?
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
              </p>
              <p className="text-xs text-slate-600 mt-0.5">A look at what happened to Hawaii</p>
            </motion.div>
          </Link>
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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

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

              {/* Category cards */}
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
