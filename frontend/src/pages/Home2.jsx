// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LocationSearchBar } from "@/components/ui/LocationSearchBar";
import {
  Globe2, Bug, AlertTriangle, X, Search, Leaf, Loader2, MapPin
} from 'lucide-react';
import { scanRisk, getSpeciesByLocation, getINatTaxonProfile, getWikipediaSummary, getTrefleTraits } from '@/api/client';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const SAN_DIEGO = { lat: 32.7157, lng: -117.1611, name: "San Diego" };
const HONOLULU = { lat: 21.3069, lng: -157.8583, name: "Honolulu" };
const SEARCH_ITEM_HEIGHT = 92;
const SEARCH_OVERSCAN = 8;

function formatCoords({ lat, lng }) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return '';
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

// --- GBIF heatmap (commented out — GBIF Maps API outage) ---
// async function resolveGbifTaxonKeys(scientificNames) {
//   const results = await Promise.allSettled(
//     scientificNames.map(async (name) => {
//       const res = await fetch(
//         `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}&kingdom=Plantae`
//       );
//       if (!res.ok) return null;
//       const data = await res.json();
//       return data.matchType !== 'NONE' ? data.usageKey : null;
//     })
//   );
//   return results
//     .filter((r) => r.status === 'fulfilled' && r.value != null)
//     .map((r) => r.value);
// }
//
// function buildGbifTileUrl(taxonKeys) {
//   const params = new URLSearchParams({
//     srs: 'EPSG:3857',
//     style: 'fire.point',
//   });
//   taxonKeys.forEach((key) => params.append('taxonKey', String(key)));
//   return `https://api.gbif.org/v2/map/occurrence/adhoc/{z}/{x}/{y}@1x.png?${params}`;
// }

function buildINatHeatmapUrl(lat, lng, radiusKm = 100, taxonIds = []) {
  const params = new URLSearchParams({
    iconic_taxa: 'Plantae',
    lat: String(lat),
    lng: String(lng),
    radius: String(radiusKm),
    introduced: 'true',
    endemic: 'false',
    native: 'false',
    mappable: 'true',
    verifiable: 'true',
  });

  if (Array.isArray(taxonIds) && taxonIds.length > 0) {
    const limitedIds = taxonIds.slice(0, 50);
    params.set('taxon_id', limitedIds.join(','));
  }

  return `https://api.inaturalist.org/v1/heatmap/{z}/{x}/{y}.png?${params}`;
}

const INAT_OBS_URL = 'https://api.inaturalist.org/v1/observations';
const IS_ON_WATER_URL = 'https://is-on-water.balbona.me/api/v1/get';

async function fetchINatObservationCount(lat, lng, radiusKm = 50) {
  const kmToDeg = 1 / 111;
  const d = radiusKm * kmToDeg;
  const params = new URLSearchParams({
    per_page: '1',
    verifiable: 'true',
    swlat: String(lat - d),
    swlng: String(lng - d),
    nelat: String(lat + d),
    nelng: String(lng + d),
  });
  const res = await fetch(`${INAT_OBS_URL}?${params}`);
  if (!res.ok) return 0;
  const data = await res.json();
  return typeof data.total_results === 'number' ? data.total_results : 0;
}

async function isOnWater(lat, lng) {
  try {
    const res = await fetch(`${IS_ON_WATER_URL}/${encodeURIComponent(lat)}/${encodeURIComponent(lng)}`);
    if (!res.ok) return true;
    const data = await res.json();
    return data.isWater === true;
  } catch {
    return false;
  }
}

function randomGaussian(mean, stdDev) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + stdDev * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

async function generateSyntheticObservations(lat, lng, radiusKm = 50, targetCount = 140) {
  const spreadKm = radiusKm * 3;
  const kmToDegLat = 1 / 111;
  const kmToDegLng = 1 / (111 * Math.cos((lat * Math.PI) / 180));

  // One primary hotspot (click) + several smaller secondary clusters + faint diffuse background
  const keyPoints = [{ lat, lng, sigma: 28 }];
  for (let k = 0; k < 4; k++) {
    const r = 0.2 * spreadKm + Math.random() * 0.8 * spreadKm;
    const theta = Math.random() * 2 * Math.PI;
    keyPoints.push({
      lat: lat + (r * Math.cos(theta)) * kmToDegLat,
      lng: lng + (r * Math.sin(theta)) * kmToDegLng,
      sigma: 14 + Math.random() * 6,
    });
  }

  // Primary ~38%, secondaries ~12% each, ~10% diffuse (wide, low weight)
  const keyProbs = [0.38, 0.13, 0.13, 0.13, 0.13];
  const diffuseProb = 0.1;
  const candidates = [];
  for (let i = 0; i < targetCount * 4; i++) {
    const u = Math.random();
    if (u < diffuseProb) {
      const r = Math.sqrt(Math.random()) * spreadKm;
      const theta = Math.random() * 2 * Math.PI;
      const dLat = (r * Math.cos(theta)) * kmToDegLat;
      const dLng = (r * Math.sin(theta)) * kmToDegLng;
      candidates.push({ lat: lat + dLat, lng: lng + dLng, r: r * 0.5, sigma: 40, weight: 0.2 + Math.random() * 0.15 });
    } else {
      let acc = u - diffuseProb;
      let keyIdx = 0;
      for (let k = 0; k < keyProbs.length; k++) {
        acc -= keyProbs[k];
        if (acc <= 0) { keyIdx = k; break; }
      }
      const center = keyPoints[keyIdx];
      const sigma = center.sigma;
      const r = Math.min(Math.abs(randomGaussian(0, sigma)), spreadKm * 0.5);
      const theta = Math.random() * 2 * Math.PI;
      const dLat = (r * Math.cos(theta)) * kmToDegLat;
      const dLng = (r * Math.sin(theta)) * kmToDegLng;
      const raw = keyIdx === 0
        ? Math.max(0.3, 1 - (r / sigma) * 0.6)
        : Math.max(0.25, 1 - (r / sigma) * 0.75);
      const weight = raw * 0.55;
      candidates.push({
        lat: center.lat + dLat,
        lng: center.lng + dLng,
        r,
        sigma,
        weight,
      });
    }
  }

  const BATCH = 8;
  const features = [];
  for (let i = 0; i < candidates.length && features.length < targetCount; i += BATCH) {
    const batch = candidates.slice(i, i + BATCH);
    const results = await Promise.all(batch.map((p) => isOnWater(p.lat, p.lng)));
    results.forEach((onWater, j) => {
      if (!onWater && features.length < targetCount) {
        const p = batch[j];
        const w = p.weight !== undefined ? p.weight : Math.max(0.25, 1 - (p.r / (p.sigma || 22)) * 0.7) * 0.55;
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
          properties: { weight: w },
        });
      }
    });
  }

  return { type: 'FeatureCollection', features };
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
  const hiMarkerRef = useRef(null);
  const isScanningRef = useRef(false);
  const searchResultsRef = useRef(null);
  const speciesStaticCacheRef = useRef(new Map());
  const speciesEnrichmentCacheRef = useRef(new Map());
  const speciesTrefleCacheRef = useRef(new Map());

  const [selectedLocation, setSelectedLocation] = useState(SAN_DIEGO);
  const [riskData, setRiskData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchPending, setIsSearchPending] = useState(false);
  const [searchScrollTop, setSearchScrollTop] = useState(0);
  const [searchViewportHeight, setSearchViewportHeight] = useState(480);
  const [targetSpecies, setTargetSpecies] = useState(null);
  const [speciesSearchResult, setSpeciesSearchResult] = useState(null);
  const [selectedSpeciesDetail, setSelectedSpeciesDetail] = useState(null);
  const [loadingSpeciesDetail, setLoadingSpeciesDetail] = useState(false);
  const [loadingEnrichment, setLoadingEnrichment] = useState(false);
  const [loadingTrefle, setLoadingTrefle] = useState(false);
  const [visibleCounts, setVisibleCounts] = useState({ high: 100, moderate: 100, low: 100 });

  const highRiskCount = riskData?.results?.filter(r => r.risk_label === 'High Risk').length ?? 0;
  const modRiskCount = riskData?.results?.filter(r => r.risk_label === 'Moderate Risk').length ?? 0;
  const speciesCount = riskData?.results?.length ?? 0;

  const removeHeatmapLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.getSource('inat-heatmap')) {
      map.removeLayer('inat-heat');
      map.removeSource('inat-heatmap');
    }
    if (map.getSource('inat-synthetic')) {
      map.removeLayer('inat-synthetic-heat');
      map.removeSource('inat-synthetic');
    }
  }, []);

  const loadHeatmap = useCallback((location, taxonIds = [], syntheticGeoJSON = null) => {
    const map = mapRef.current;
    if (!map) return;

    const addLayer = () => {
      removeHeatmapLayers();

      if (syntheticGeoJSON && syntheticGeoJSON.features?.length > 0) {
        map.addSource('inat-synthetic', {
          type: 'geojson',
          data: syntheticGeoJSON,
        });
        map.addLayer({
          id: 'inat-synthetic-heat',
          type: 'heatmap',
          source: 'inat-synthetic',
          paint: {
            'heatmap-weight': ['coalesce', ['get', 'weight'], 0.5],
            'heatmap-intensity': 0.72,
            'heatmap-radius': 20,
            'heatmap-opacity': 0.78,
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(0,0,0,0)',
              0.2, 'rgba(34,197,94,0.5)',
              0.5, 'rgba(250,204,21,0.7)',
              0.8, 'rgba(234,88,12,0.85)',
              1, 'rgba(220,38,38,0.95)',
            ],
          },
        });
      } else {
        const tileUrl = buildINatHeatmapUrl(location.lat, location.lng, 100, taxonIds || []);
        map.addSource('inat-heatmap', {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256,
          attribution: '© <a href="https://www.inaturalist.org">iNaturalist</a>',
        });
        map.addLayer({
          id: 'inat-heat',
          type: 'raster',
          source: 'inat-heatmap',
          slot: 'middle',
          paint: { 'raster-opacity': 0.8 },
        });
      }
    };

    if (map.isStyleLoaded()) {
      addLayer();
    } else {
      map.once('idle', addLayer);
    }
  }, [removeHeatmapLayers]);

  const runScan = useCallback(async (location, speciesName = null) => {
    if (!location) return;
    isScanningRef.current = true;
    setIsScanning(true);
    setScanError(null);
    setRiskData(null);
    setSpeciesSearchResult(null);

    try {
      const data = await scanRisk({
        lat: location.lat,
        lng: location.lng,
        radius_km: 50,
      });
      setRiskData(data);
      setVisibleCounts({ high: 100, moderate: 100, low: 100 });
      const taxonIds = data?.meta?.inat_taxon_ids_for_heatmap || [];

      const obsCount = await fetchINatObservationCount(location.lat, location.lng, 50);
      if (obsCount < 20) {
        const synthetic = await generateSyntheticObservations(location.lat, location.lng, 50, 55);
        loadHeatmap(location, null, synthetic);
      } else {
        loadHeatmap(location, taxonIds, null);
      }

      // If species was specified, search for it in results
      if (speciesName) {
        const normalizedQuery = speciesName.toLowerCase().trim();
        const found = data?.results?.find(r => 
          r.scientific_name?.toLowerCase()?.includes(normalizedQuery) ||
          r.common_name?.toLowerCase()?.includes(normalizedQuery)
        );
        
        if (found) {
          const displayName =
            typeof found.common_name === 'string' &&
            found.common_name.trim() !== '' &&
            found.common_name !== 'Unknown'
              ? found.common_name
              : (found.scientific_name || 'Unknown species');

          setSpeciesSearchResult({
            found: true,
            species: found,
            message: `Found: ${displayName}`,
          });
          // Auto-open that species detail
          setTimeout(() => handleSpeciesClick(found), 500);
        } else {
          setSpeciesSearchResult({
            found: false,
            message: `"${speciesName}" not found in risk results for this location`,
          });
        }
      }
    } catch (err) {
      setScanError(err.message);
    } finally {
      isScanningRef.current = false;
      setIsScanning(false);
    }
  }, [loadHeatmap]);

  const handlePickLocation = useCallback(async (location, { flyTo = true, speciesName = null } = {}) => {
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') return;
    if (isScanningRef.current) return;

    setExpandedCategory(null);
    setSelectedLocation(location);
    setTargetSpecies(speciesName);
    updateSelectedMarker(location);

    if (flyTo && mapRef.current) {
      mapRef.current.flyTo({
        center: [location.lng, location.lat],
        zoom: 8,
        duration: 1200,
      });
    }

    await runScan(location, speciesName);
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
      maxZoom: 8, // max zoom before heatmap starts to degrade
      pitch: 45 // remove if you want to see the globe
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
      if (isScanningRef.current) return;
      handlePickLocationRef.current(SAN_DIEGO);
    });

    // Honolulu permanent marker
    const hiEl = document.createElement('div');
    hiEl.style.cssText = 'width:16px;height:16px;background:white;border-radius:50%;border:2px solid rgba(234,179,8,0.8);box-shadow:0 0 8px rgba(234,179,8,0.5);cursor:pointer;';
    hiMarkerRef.current = new mapboxgl.Marker({ element: hiEl })
      .setLngLat([HONOLULU.lng, HONOLULU.lat])
      .setPopup(new mapboxgl.Popup({ offset: 12, closeButton: false }).setHTML(
        '<div style="font-size:13px;font-weight:600;">Honolulu</div>' +
        '<div style="font-size:11px;color:#94a3b8;">Click to scan</div>'
      ))
      .addTo(map);

    hiEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isScanningRef.current) return;
      handlePickLocationRef.current(HONOLULU);
    });

    // Selected-location marker (cyan, starts hidden)
    const selEl = document.createElement('div');
    selEl.style.cssText = 'width:14px;height:14px;background:rgb(34,211,238);border-radius:50%;border:2px solid rgba(34,211,238,0.4);box-shadow:0 0 10px rgba(34,211,238,0.6);display:none;';
    markerRef.current = new mapboxgl.Marker({ element: selEl })
      .setLngLat([HONOLULU.lng, HONOLULU.lat])
      .addTo(map);

    map.on('load', () => {
      map.flyTo({ center: [HONOLULU.lng, HONOLULU.lat], zoom: 7, duration: 2500 });
    });

    map.on('click', async (e) => {
      if (isScanningRef.current) return;

      const { lng, lat } = e.lngLat;

      // Check if user clicked on water using Mapbox Tilequery API
      const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
      if (!mapboxToken) {
        // Skip Tilequery when token is not configured; continue as if on land
        console.warn('Mapbox Tilequery skipped: VITE_MAPBOX_TOKEN is not set.');
      } else {
        try {
          const tileQueryResponse = await fetch(
            `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${lng},${lat}.json?access_token=${mapboxToken}`
          );

          if (!tileQueryResponse.ok) {
            console.error(
              `Mapbox Tilequery request failed with status ${tileQueryResponse.status} ${tileQueryResponse.statusText}.`
            );
          } else {
            const tileQueryData = await tileQueryResponse.json();

            // Check if water features are at this location
            const isWaterClick =
              Array.isArray(tileQueryData.features) &&
              tileQueryData.features.some((feature) => {
                const layerName = feature.properties?.tilequery?.layer || '';
                return layerName.toLowerCase() === 'water';
              });

            if (isWaterClick) {
              setScanError('🌊 You clicked on water! Please select a landmass.');
              return;
            }
          }
        } catch (err) {
          // Continue anyway if tilequery fails, but log for easier debugging
          console.error('Mapbox Tilequery request encountered an error:', err);
        }
      }

      // Clear any previous error
      setScanError(null);

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

  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);

  const highRiskSpecies = useMemo(() => {
    return (riskData?.results ?? []).filter(r => r.risk_label === 'High Risk');
  }, [riskData]);

  const moderateRiskSpecies = useMemo(() => {
    return (riskData?.results ?? []).filter(r => r.risk_label === 'Moderate Risk');
  }, [riskData]);

  const lowRiskSpecies = useMemo(() => {
    return (riskData?.results ?? []).filter(r => r.risk_label === 'Low Risk');
  }, [riskData]);

  // Filter all species by search query
  const allSpecies = useMemo(() => {
    return riskData?.results ?? [];
  }, [riskData]);

  const filteredSpecies = useMemo(() => {
    if (!searchQuery.trim()) return allSpecies;
    const query = searchQuery.toLowerCase();
    return allSpecies.filter(s => 
      s.common_name?.toLowerCase().includes(query) || 
      s.scientific_name?.toLowerCase().includes(query)
    );
  }, [allSpecies, searchQuery]);

  const searchStartIndex = useMemo(() => {
    return Math.max(0, Math.floor(searchScrollTop / SEARCH_ITEM_HEIGHT) - SEARCH_OVERSCAN);
  }, [searchScrollTop]);

  const searchEndIndex = useMemo(() => {
    const visibleCount = Math.ceil(searchViewportHeight / SEARCH_ITEM_HEIGHT) + SEARCH_OVERSCAN * 2;
    return Math.min(filteredSpecies.length, searchStartIndex + visibleCount);
  }, [filteredSpecies.length, searchStartIndex, searchViewportHeight]);

  const displayedFilteredSpecies = useMemo(() => {
    return filteredSpecies.slice(searchStartIndex, searchEndIndex);
  }, [filteredSpecies, searchStartIndex, searchEndIndex]);

  const searchTopSpacerHeight = searchStartIndex * SEARCH_ITEM_HEIGHT;
  const searchBottomSpacerHeight = Math.max(0, (filteredSpecies.length - searchEndIndex) * SEARCH_ITEM_HEIGHT);

  // Debounce search to keep typing responsive with large result sets
  useEffect(() => {
    if (searchInput === searchQuery) return;

    setIsSearchPending(true);
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setIsSearchPending(false);
    }, 180);

    return () => clearTimeout(timer);
  }, [searchInput, searchQuery]);

  // Measure search results viewport for virtualization
  useEffect(() => {
    if (!showModal || selectedSpeciesDetail || !searchQuery.trim()) {
      setSearchScrollTop(0);
      return;
    }

    const measure = () => {
      if (searchResultsRef.current) {
        const nextHeight = searchResultsRef.current.clientHeight;
        if (nextHeight > 0) setSearchViewportHeight(nextHeight);
      }
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [showModal, selectedSpeciesDetail, searchQuery]);

  // Fetch detailed species info from catalog
  const handleSpeciesClick = useCallback(async (species) => {
    setLoadingSpeciesDetail(true);
    // Reset enrichment/traits loading flags when starting a new selection
    setLoadingEnrichment(false);
    setLoadingTrefle(false);

    const speciesKey = species.scientific_name;
    const dynamicRisk = {
      risk_score: species.risk_score,
      risk_label: species.risk_label,
      found_in_gbif_radius: species.found_in_gbif_radius,
    };

    try {
      const cachedStatic = speciesStaticCacheRef.current.get(speciesKey);
      const catalogData = cachedStatic || await getSpeciesByLocation({ scientific_name: species.scientific_name });
      if (!cachedStatic) {
        speciesStaticCacheRef.current.set(speciesKey, catalogData);
      }

      const cachedEnrichment = speciesEnrichmentCacheRef.current.get(speciesKey) || null;

      setSelectedSpeciesDetail({
        species: catalogData,
        dynamic_risk: dynamicRisk,
        enrichment: cachedEnrichment,
        trefle: null,
      });
      setLoadingSpeciesDetail(false);

      if (!cachedEnrichment) {
        setLoadingEnrichment(true);
        const inatProfile = await getINatTaxonProfile(catalogData?.inat_taxon_id);
        const fallbackWiki = inatProfile ? null : await getWikipediaSummary(catalogData?.scientific_name || species.scientific_name);
        const enrichment = inatProfile || fallbackWiki || null;

        speciesEnrichmentCacheRef.current.set(speciesKey, enrichment);

        setSelectedSpeciesDetail((prev) => {
          if (!prev?.species || prev.species.scientific_name !== speciesKey) return prev;
          return { ...prev, enrichment };
        });
      }

      // Fetch Trefle data for accurate pH and native regions
      const cachedTrefle = speciesTrefleCacheRef.current.get(speciesKey);
      if (!cachedTrefle) {
        setLoadingTrefle(true);
        const trefleData = await getTrefleTraits(catalogData?.scientific_name || species.scientific_name);
        if (trefleData) {
          speciesTrefleCacheRef.current.set(speciesKey, trefleData);
          setSelectedSpeciesDetail((prev) => {
            if (!prev?.species || prev.species.scientific_name !== speciesKey) return prev;
            return { ...prev, trefle: trefleData };
          });
        }
        setLoadingTrefle(false);
      } else {
        setSelectedSpeciesDetail((prev) => {
          if (!prev?.species || prev.species.scientific_name !== speciesKey) return prev;
          return { ...prev, trefle: cachedTrefle };
        });
      }

      setLoadingEnrichment(false);
    } catch (err) {
      console.error('Failed to fetch species detail:', err);
      setLoadingSpeciesDetail(false);
      setLoadingEnrichment(false);
      setLoadingTrefle(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white font-body overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                <Globe2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-display font-semibold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  InvasiveWatch
                </h1>
                <p className="text-[11px] text-slate-500 tracking-wide">Global Species Tracker</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-slate-400 text-sm hover:text-white transition-colors">Home</Link>
              <span className="text-white text-sm font-medium relative">
                Dashboard
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-cyan-500 to-blue-500" />
              </span>
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
              <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">Introduced plant observations</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500">Sparse</span>
                <div className="flex h-2.5 rounded-full overflow-hidden flex-1" style={{
                  background: 'linear-gradient(to right, rgba(34,197,94,0.9), rgba(250,204,21,0.9), rgba(234,88,12,0.9), rgba(220,38,38,0.95))'
                }} />
                <span className="text-[10px] text-slate-500">Dense</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">iNaturalist observations · Click anywhere</p>
            </div>
          </div>

          {/* Scanning indicator with globe */}
          {isScanning && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 flex flex-col items-center gap-5 shadow-2xl pointer-events-auto">
                <div className="relative w-24 h-24 flex items-center justify-center" style={{ perspective: '280px' }}>
                  <div className="animate-globe-spin w-20 h-20 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
                    <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.4)) drop-shadow(0 0 16px rgba(59,130,246,0.25))' }}>
                      <defs>
                        {/* 3D sphere: highlight top-left, dark rim */}
                        <radialGradient id="earth-sphere" cx="35%" cy="30%" r="65%" fx="32%" fy="28%">
                          <stop offset="0%" stopColor="#93c5fd" />
                          <stop offset="25%" stopColor="#60a5fa" />
                          <stop offset="50%" stopColor="#3b82f6" />
                          <stop offset="75%" stopColor="#2563eb" />
                          <stop offset="100%" stopColor="#1e3a5f" />
                        </radialGradient>
                        {/* Subtle atmosphere rim */}
                        <radialGradient id="earth-atmosphere" cx="50%" cy="50%" r="50%">
                          <stop offset="85%" stopColor="transparent" />
                          <stop offset="98%" stopColor="#bfdbfe" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.2" />
                        </radialGradient>
                        <linearGradient id="globe-line" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.4" />
                          <stop offset="50%" stopColor="#93c5fd" stopOpacity="0.85" />
                          <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.4" />
                        </linearGradient>
                        <radialGradient id="earth-land" cx="40%" cy="35%" r="60%">
                          <stop offset="0%" stopColor="#4ade80" />
                          <stop offset="100%" stopColor="#166534" />
                        </radialGradient>
                        <clipPath id="globe-clip">
                          <circle cx="50" cy="50" r="46" />
                        </clipPath>
                      </defs>
                      <circle cx="50" cy="50" r="46" fill="url(#earth-sphere)" />
                      {/* Continents: single path with connected landmasses (islands as separate subpaths) */}
                      <g clipPath="url(#globe-clip)" fill="url(#earth-land)" fillOpacity="0.92" stroke="#14532d" strokeWidth="0.35" strokeOpacity="0.6">
                        <path d="
                          M 8 16 L 12 14 L 16 15 L 18 18 L 20 16 L 22 18 L 22 22 L 20 24 L 20 28 L 18 26 L 16 28 L 16 32 L 18 34 L 20 36 L 20 38 L 18 40 L 20 42 L 22 44 L 24 44 L 26 42 L 28 44 L 28 40 L 30 38 L 32 36 L 34 36 L 34 38 L 32 40 L 30 42 L 30 46 L 28 46 L 26 42 L 24 40 L 24 36 L 26 34 L 28 32 L 30 28 L 32 26 L 32 22 L 30 20 L 28 20 L 26 18 L 24 20 L 22 20 L 20 18 L 16 20 L 12 18 Z
                          M 26 10 L 30 10 L 32 12 L 32 16 L 30 18 L 26 18 L 24 16 L 24 12 Z
                          M 24 48 L 26 46 L 28 48 L 30 50 L 32 50 L 34 52 L 34 56 L 32 58 L 32 62 L 30 64 L 28 68 L 26 72 L 24 76 L 22 76 L 20 72 L 20 66 L 22 62 L 22 58 L 24 56 L 24 52 Z
                          M 40 32 L 42 30 L 46 28 L 50 28 L 52 30 L 52 32 L 50 34 L 48 36 L 48 40 L 46 42 L 44 40 L 44 36 L 42 36 L 40 38 L 40 42 L 42 44 L 44 44 L 46 42 L 48 44 L 46 46 L 42 46 L 40 44 L 38 40 L 38 36 L 40 34 Z M 44 28 L 46 26 L 48 28 L 46 30 Z
                          M 40 42 L 42 40 L 46 40 L 48 42 L 50 44 L 52 48 L 52 54 L 50 58 L 48 62 L 46 64 L 44 64 L 42 62 L 42 58 L 40 54 L 40 50 L 38 46 Z M 54 56 L 56 56 L 56 60 L 54 62 L 52 60 Z
                          M 50 22 L 56 20 L 64 22 L 72 24 L 78 26 L 84 30 L 86 34 L 86 38 L 84 42 L 80 44 L 76 44 L 72 42 L 68 44 L 64 46 L 60 46 L 56 44 L 54 40 L 54 36 L 56 34 L 60 34 L 62 38 L 66 38 L 68 36 L 66 32 L 62 30 L 58 28 L 54 26 Z
                          M 80 32 L 82 32 L 84 34 L 84 36 L 82 38 L 80 36 L 78 34 Z
                          M 68 56 L 72 56 L 76 58 L 80 60 L 82 62 L 82 66 L 80 68 L 76 70 L 72 70 L 68 68 L 66 64 L 66 60 Z
                          M 74 52 L 78 52 L 80 54 L 78 56 L 76 56 Z M 66 58 L 68 58 L 68 60 L 66 60 Z
                        " />
                      </g>
                      <circle cx="50" cy="50" r="46" fill="url(#earth-atmosphere)" />
                      <circle cx="50" cy="50" r="46" fill="none" stroke="#1e40af" strokeWidth="0.6" opacity="0.5" />
                      {/* Latitude lines */}
                      <ellipse cx="50" cy="50" rx="46" ry="12" fill="none" stroke="url(#globe-line)" strokeWidth="0.7" opacity="0.85" />
                      <ellipse cx="50" cy="50" rx="46" ry="26" fill="none" stroke="url(#globe-line)" strokeWidth="0.55" opacity="0.65" />
                      <ellipse cx="50" cy="50" rx="46" ry="38" fill="none" stroke="url(#globe-line)" strokeWidth="0.45" opacity="0.45" />
                      {/* Longitude lines */}
                      <path d="M 50 4 A 46 46 0 0 1 50 96 A 46 46 0 0 1 50 4" fill="none" stroke="url(#globe-line)" strokeWidth="0.65" opacity="0.8" />
                      <path d="M 50 4 A 46 46 0 0 0 50 96 A 46 46 0 0 0 50 4" fill="none" stroke="url(#globe-line)" strokeWidth="0.5" opacity="0.55" />
                      <ellipse cx="50" cy="50" rx="12" ry="46" fill="none" stroke="url(#globe-line)" strokeWidth="0.55" opacity="0.65" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-200">
                  Scanning {selectedLocation?.name || formatCoords(selectedLocation) || 'location'}...
                </p>
                <p className="text-xs text-slate-500">Analyzing species & observations</p>
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

          {/* Location Search Bar - positioned below stats when they exist */}
          <div className={`absolute left-6 z-10 w-80 transition-all duration-300 ${
            riskData && !isScanning ? 'top-[140px]' : 'top-6'
          }`}>
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
              <LocationSearchBar
                onLocationFound={(lat, lng, speciesName, placeName) => {
                  handlePickLocation(
                    { lat, lng, name: placeName || 'Selected location' },
                    { flyTo: true, speciesName }
                  );
                }}
                isLoading={isScanning}
              />
            </div>
          </div>

          {scanError && (
            <div className="absolute top-6 left-6 z-10 bg-red-900/80 backdrop-blur-xl rounded-2xl p-4 border border-red-700/50 max-w-sm">
              <p className="text-sm text-red-300">{scanError}</p>
              {!scanError.includes('water') && (
                <>
                  <p className="text-xs text-red-400/80 mt-1">Ensure the backend is running and VITE_API_BASE_URL points to it.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 border-red-600 text-red-200 hover:bg-red-800/50"
                    onClick={() => { setScanError(null); runScan(selectedLocation); }}
                  >
                    Try again
                  </Button>
                </>
              )}
              {scanError.includes('water') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-red-600 text-red-200 hover:bg-red-800/50"
                  onClick={() => setScanError(null)}
                >
                  Dismiss
                </Button>
              )}
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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-display font-semibold tracking-tight text-white">
                    {(selectedLocation?.name || 'Location')} Risk Analysis
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatCoords(selectedLocation)}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    {riskData.meta?.rainfall_used ? `${Math.round(riskData.meta.rainfall_used)} mm rainfall` : ''} · pH {riskData.meta?.soil_ph_used?.toFixed(1)} · {riskData.meta?.biome || "Auto-detected"} biome
                  </p>
                </div>
                <button onClick={() => { setShowModal(false); setExpandedCategory(null); setSearchInput(''); setSearchQuery(''); setIsSearchPending(false); setSearchScrollTop(0); setSelectedSpeciesDetail(null); }} className="text-slate-400 hover:text-white transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search input */}
              {!selectedSpeciesDetail && (
                <div className="px-6 py-4 border-b border-slate-800">
                  {/* Species Search Result Banner */}
                  {speciesSearchResult && (
                    <div className={`mb-3 rounded-lg p-3 border ${
                      speciesSearchResult.found 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-amber-500/10 border-amber-500/30'
                    }`}>
                      <p className={`text-sm font-medium ${
                        speciesSearchResult.found ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {speciesSearchResult.message}
                      </p>
                      {speciesSearchResult.found && speciesSearchResult.species && (
                        <div className="mt-2 flex items-center gap-2">
                          <Badge className={`border-0 ${getRiskBadgeStyle(speciesSearchResult.species.risk_label)}`}>
                            {speciesSearchResult.species.risk_label}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            Risk Score: {(speciesSearchResult.species.risk_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search species by common or scientific name..."
                      value={searchInput}
                      onChange={(e) => { setSearchInput(e.target.value); setExpandedCategory(null); }}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                  {isSearchPending && (
                    <div className="mt-3">
                      <div className="h-1 w-full bg-slate-800/80 rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-blue-500 rounded-full animate-pulse" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Searching...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Category cards OR search results OR species detail */}
              {selectedSpeciesDetail ? (
                // Species detail view
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-280px)]"
                >
                  <button
                    onClick={() => setSelectedSpeciesDetail(null)}
                    className="text-xs text-slate-400 hover:text-white mb-4 flex items-center gap-1 transition-colors"
                  >
                    ← Back to results
                  </button>
                  
                  <div className="space-y-4">
                    {/* Species name */}
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {selectedSpeciesDetail.enrichment?.preferred_common_name || selectedSpeciesDetail.species?.common_name || selectedSpeciesDetail.species?.scientific_name}
                      </h3>
                      {selectedSpeciesDetail.enrichment?.subtitle && (
                        <p className="text-xs text-slate-500 mt-1">{selectedSpeciesDetail.enrichment.subtitle}</p>
                      )}
                      <p className="text-sm text-slate-400 italic">{selectedSpeciesDetail.species?.scientific_name}</p>
                    </div>

                    {/* Hero image */}
                    {loadingEnrichment ? (
                      <div className="rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900/40 h-48 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                          <p className="text-xs text-slate-500">Loading image...</p>
                        </div>
                      </div>
                    ) : selectedSpeciesDetail.enrichment?.hero_image_url ? (
                      <div className="rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900/40">
                        <img
                          src={selectedSpeciesDetail.enrichment.hero_image_url}
                          alt={selectedSpeciesDetail.species?.scientific_name || 'Plant image'}
                          className="w-full h-48 object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : null}

                    {/* Story */}
                    {loadingEnrichment ? (
                      <div className="bg-slate-800/30 rounded-lg p-4 space-y-2">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Story</p>
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-700/50 rounded w-full animate-pulse" />
                          <div className="h-4 bg-slate-700/50 rounded w-5/6 animate-pulse" />
                          <div className="h-4 bg-slate-700/50 rounded w-4/5 animate-pulse" />
                        </div>
                      </div>
                    ) : selectedSpeciesDetail.enrichment?.story ? (
                      <div className="bg-slate-800/30 rounded-lg p-4 space-y-2">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Story</p>
                        <p className="text-sm text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedSpeciesDetail.enrichment.story }} />
                      </div>
                    ) : null}

                    {/* Risk info for this location */}
                    {selectedSpeciesDetail.dynamic_risk && (
                      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Risk at this location</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Badge className={`border-0 ${getRiskBadgeStyle(selectedSpeciesDetail.dynamic_risk.risk_label)}`}>
                              {selectedSpeciesDetail.dynamic_risk.risk_label || 'Unknown'}
                            </Badge>
                            <p className="text-2xl font-bold text-white mt-2">
                              {selectedSpeciesDetail.dynamic_risk.risk_score !== null 
                                ? `${(selectedSpeciesDetail.dynamic_risk.risk_score * 100).toFixed(0)}%`
                                : 'N/A'
                              }
                            </p>
                          </div>
                          <div className="text-sm text-slate-300 space-y-1">
                            {selectedSpeciesDetail.dynamic_risk.found_in_gbif_radius && <p>✓ Observed nearby</p>}
                            {selectedSpeciesDetail.species?.is_invasive && <p>✓ Listed invasive</p>}
                            {selectedSpeciesDetail.enrichment?.introduced === true && <p>✓ Non-native (introduced)</p>}
                            {selectedSpeciesDetail.enrichment?.native === true && <p>✓ Native species</p>}
                            {selectedSpeciesDetail.enrichment?.threatened === true && <p>⚠ Threatened status</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Community rarity */}
                    {typeof selectedSpeciesDetail.enrichment?.observations_count === 'number' && (
                      <div className="bg-slate-800/30 rounded-lg p-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Community Rarity</p>
                        <p className="text-sm text-slate-300 font-medium">
                          {selectedSpeciesDetail.enrichment.observations_count.toLocaleString()} observations
                        </p>
                      </div>
                    )}

                    {/* Characteristics - Use clean decoded fields from backend */}
                    {selectedSpeciesDetail.species && (() => {
                      const species = selectedSpeciesDetail.species;
                      
                      return (
                        <div className="space-y-4">
                          {/* Growth characteristics - only show if has data */}
                          {(species.habit && species.habit !== "Unknown" || 
                            species.growth_rate && species.growth_rate !== "Unknown" || 
                            species.spreads_vegetatively || 
                            species.animal_dispersal) && (
                          <div className="bg-slate-800/30 rounded-lg p-4 space-y-3">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Growth Characteristics</p>
                            {species.habit && species.habit !== "Unknown" && (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Growth Habit</span>
                                <span className="text-sm text-slate-300 font-medium">{species.habit}</span>
                              </div>
                            )}
                            {species.growth_rate && species.growth_rate !== "Unknown" && (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Growth Rate</span>
                                <span className="text-sm text-slate-300 font-medium">{species.growth_rate}</span>
                              </div>
                            )}
                            {species.spreads_vegetatively && (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Spreads Vegetatively</span>
                                <span className="text-sm text-slate-300 font-medium">✓ Yes</span>
                              </div>
                            )}
                            {species.animal_dispersal && (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Animal Dispersal</span>
                                <span className="text-sm text-slate-300 font-medium">✓ Yes</span>
                              </div>
                            )}
                          </div>
                          )}

                          {/* Environmental tolerances */}
                          {loadingTrefle ? (
                            <div className="bg-slate-800/30 rounded-lg p-4 space-y-3">
                              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Environmental Tolerances</p>
                              <div className="space-y-2">
                                <div className="h-4 bg-slate-700/50 rounded w-full animate-pulse" />
                                <div className="h-4 bg-slate-700/50 rounded w-4/5 animate-pulse" />
                              </div>
                            </div>
                          ) : (
                            // Only show if has environmental data
                            (species.ph_minimum !== undefined && species.ph_minimum !== null && !selectedSpeciesDetail.trefle?.phMin ||
                             species.ph_maximum !== undefined && species.ph_maximum !== null && !selectedSpeciesDetail.trefle?.phMax ||
                             species.light_level && species.light_level !== "Unknown" ||
                             selectedSpeciesDetail.trefle?.phMin !== null && selectedSpeciesDetail.trefle?.phMin !== undefined) && (
                            <div className="bg-slate-800/30 rounded-lg p-4 space-y-3">
                              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Environmental Tolerances</p>
                          {species.ph_minimum !== undefined && species.ph_minimum !== null && !selectedSpeciesDetail.trefle?.phMin && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-500">pH Range Min</span>
                              <span className="text-sm text-slate-300 font-medium">{(parseFloat(species.ph_minimum) * 14).toFixed(1)}</span>
                            </div>
                          )}
                          {species.ph_maximum !== undefined && species.ph_maximum !== null && !selectedSpeciesDetail.trefle?.phMax && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-500">pH Range Max</span>
                              <span className="text-sm text-slate-300 font-medium">{(parseFloat(species.ph_maximum) * 14).toFixed(1)}</span>
                              </div>
                            )}
                            {species.light_level && species.light_level !== "Unknown" && (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Light Requirement</span>
                                <span className="text-sm text-slate-300 font-medium">{species.light_level}</span>
                              </div>
                            )}
                            
                            {/* Trefle pH if available */}
                            {selectedSpeciesDetail.trefle?.phMin !== null && selectedSpeciesDetail.trefle?.phMin !== undefined && (
                              <div className="flex justify-between items-center border-t border-slate-700/50 pt-3 mt-3">
                                <span className="text-xs text-slate-500">pH Range</span>
                                <span className="text-sm text-slate-300 font-medium">
                                  {selectedSpeciesDetail.trefle.phMin} - {selectedSpeciesDetail.trefle.phMax}
                                </span>
                              </div>
                            )}
                            </div>
                            )
                          )}

                          {/* Geographic info */}
                          {loadingTrefle ? (
                            <div className="bg-slate-800/30 rounded-lg p-4">
                              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Native Regions</p>
                              <div className="h-4 bg-slate-700/50 rounded w-full animate-pulse" />
                            </div>
                          ) : (
                            <>
                              {species.native_region_count !== undefined && species.native_region_count !== null && !selectedSpeciesDetail.trefle?.nativeRegions && (
                                <div className="bg-slate-800/30 rounded-lg p-4">
                                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Native Regions</p>
                                  <p className="text-sm text-slate-300 font-medium">{Math.round(species.native_region_count)} regions</p>
                                </div>
                              )}
                              
                              {/* Trefle native regions if available */}
                              {selectedSpeciesDetail.trefle?.nativeRegions && selectedSpeciesDetail.trefle.nativeRegions !== "Unknown" && (
                                <div className="bg-slate-800/30 rounded-lg p-4">
                                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Native Regions</p>
                                  <p className="text-sm text-slate-300 font-medium">{selectedSpeciesDetail.trefle.nativeRegions}</p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              ) : searchQuery.trim() ? (
                // Search results
                <motion.div
                  ref={searchResultsRef}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-280px)]"
                  onScroll={(e) => setSearchScrollTop(e.currentTarget.scrollTop)}
                >
                  <p className="text-sm text-slate-400 mb-4">
                    Found <span className="font-semibold text-white">{filteredSpecies.length}</span> species
                  </p>
                  {isSearchPending && (
                    <div className="mb-3">
                      <div className="h-1 w-full bg-slate-800/80 rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-blue-500 rounded-full animate-pulse" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Searching...</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {displayedFilteredSpecies.length > 0 ? (
                      <>
                        {searchTopSpacerHeight > 0 && <div style={{ height: searchTopSpacerHeight }} />}
                        {displayedFilteredSpecies.map((s) => (
                        <button
                          key={s.scientific_name}
                          onClick={() => handleSpeciesClick(s)}
                          disabled={loadingSpeciesDetail}
                          className="w-full h-[84px] bg-slate-800/50 hover:bg-slate-800/80 disabled:opacity-50 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-all text-left"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-white font-medium truncate">
                                {s.common_name !== "Unknown" ? s.common_name : s.scientific_name}
                              </h4>
                              <p className="text-xs text-slate-500 italic truncate">{s.scientific_name}</p>
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
                        </button>
                        ))}
                        {searchBottomSpacerHeight > 0 && <div style={{ height: searchBottomSpacerHeight }} />}
                      </>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-slate-700 text-center">
                        <p className="text-sm text-slate-500">No species found matching "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                // Category view (default)
                <>
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
                      <div className="px-6 pb-6 overflow-y-auto max-h-[35vh]">
                        <div className="space-y-2">
                          {species.slice(0, visibleCounts[expandedCategory]).map((s) => (
                            <button
                              key={s.scientific_name}
                              onClick={() => handleSpeciesClick(s)}
                              disabled={loadingSpeciesDetail}
                              className="w-full bg-slate-800/50 hover:bg-slate-800/80 disabled:opacity-50 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-all text-left"
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
                            </button>
                          ))}
                          {visibleCounts[expandedCategory] < species.length && (
                            <button
                              onClick={() => setVisibleCounts(prev => ({ ...prev, [expandedCategory]: prev[expandedCategory] + 100 }))}
                              className="w-full py-3 rounded-xl border border-dashed border-slate-700 hover:border-slate-500 text-center transition-colors group"
                            >
                              <p className="text-sm text-slate-400 group-hover:text-white transition-colors">
                                Load 100 more
                              </p>
                              <p className="text-xs text-slate-600 mt-0.5">
                                Showing {Math.min(visibleCounts[expandedCategory], species.length).toLocaleString()} of {species.length.toLocaleString()}
                              </p>
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
