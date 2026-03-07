import React, { useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import './NZReclamationMap.css';

// ── Sanctuary Data ────────────────────────────────────────────────────────

const sanctuaries = [
  { 
    id: 1, 
    name: 'Zealandia Te Māra a Tāne', 
    lat: -41.303, 
    lng: 174.753, 
    size: '225 Hectares', 
    status: '13 mammalian predator species eradicated.', 
    defense: '8.6km predator-proof fence.' 
  },
  { 
    id: 2, 
    name: 'Sanctuary Mountain Maungatautari', 
    lat: -38.026, 
    lng: 175.568, 
    size: '3,400 Hectares', 
    status: 'All mammalian predators eradicated.', 
    defense: '47km predator-proof fence.' 
  },
  { 
    id: 3, 
    name: 'Brook Waimārama Sanctuary', 
    lat: -41.313, 
    lng: 173.284, 
    size: '715 Hectares', 
    status: 'Free of pest mammals.', 
    defense: '14.4km predator-proof fence.' 
  }
];

// ── Main Component ────────────────────────────────────────────────────────

export default function NZReclamationMap() {
  const [hoveredSanctuary, setHoveredSanctuary] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: 174.0,
    latitude: -41.0,
    zoom: 4.8
  });

  return (
    <section className="px-6 py-16 border-b border-slate-800/30">
      <div className="max-w-6xl mx-auto">
        {/* Title and Context */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">
            The Frontlines of Conservation
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            Interactive map of key mainland sanctuaries. These highly defended, fenced ecological islands are actively pushing back the predator tide. Hover over the glowing green zones to view eradication status.
          </p>
        </div>

        {/* Map Container */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
          <div className="h-[500px] w-full">
            <Map
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
              mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
              style={{ width: '100%', height: '100%' }}
            >
              {/* Dark overlay for moody satellite blend */}
              <div className="pointer-events-none absolute inset-0 bg-slate-950/40 mix-blend-multiply" />
        {/* Sanctuary Markers */}
        {sanctuaries.map((sanctuary) => (
          <Marker
            key={sanctuary.id}
            longitude={sanctuary.lng}
            latitude={sanctuary.lat}
            anchor="center"
          >
            <div
              className="cursor-pointer"
              onMouseEnter={() => setHoveredSanctuary(sanctuary)}
              onMouseLeave={() => setHoveredSanctuary(null)}
            >
              {/* Outer pulsing glow */}
              <div className="w-6 h-6 bg-emerald-500/30 rounded-full animate-pulse flex items-center justify-center">
                {/* Inner dot */}
                <div className="w-3 h-3 bg-emerald-400 rounded-full" />
              </div>
            </div>
          </Marker>
        ))}

        {/* Tooltip Popup */}
        {hoveredSanctuary && (
          <Popup
            longitude={hoveredSanctuary.lng}
            latitude={hoveredSanctuary.lat}
            anchor="bottom"
            closeButton={false}
            closeOnClick={false}
            className="sanctuary-popup"
            offset={15}
          >
            <div className="bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 p-4 rounded-xl shadow-2xl text-sm">
              <h4 className="text-emerald-400 font-bold mb-2">
                {hoveredSanctuary.name}
              </h4>
              <div className="space-y-1 text-slate-300">
                <p><span className="text-slate-400">Size:</span> {hoveredSanctuary.size}</p>
                <p><span className="text-slate-400">Status:</span> {hoveredSanctuary.status}</p>
                <p><span className="text-slate-400">Defense:</span> {hoveredSanctuary.defense}</p>
              </div>
            </div>
          </Popup>
        )}
            </Map>
          </div>
        </div>
      </div>
    </section>
  );
}
