import React, { useState, useEffect, useRef } from 'react';;
import Globe from 'react-globe.gl';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { 
  Globe2, Bug, MapPin, AlertTriangle, TrendingUp, 
  Filter, Info, Layers, ChevronRight, X, Search,
  BarChart3, Leaf, Skull, Satellite, Map as MapIcon,
  Thermometer, Droplets, Mountain, CloudRain, Wind, Sprout
} from 'lucide-react';

// Invasive species data generator
const generateSpeciesData = () => {
  const species = [
    { name: "Asian Tiger Mosquito", type: "insect", severity: "high", origin: "Southeast Asia" },
    { name: "Zebra Mussel", type: "mollusk", severity: "critical", origin: "Caspian Sea" },
    { name: "Japanese Knotweed", type: "plant", severity: "high", origin: "Japan" },
    { name: "Burmese Python", type: "reptile", severity: "critical", origin: "Southeast Asia" },
    { name: "Lionfish", type: "fish", severity: "high", origin: "Indo-Pacific" },
    { name: "Emerald Ash Borer", type: "insect", severity: "critical", origin: "Asia" },
    { name: "Giant Hogweed", type: "plant", severity: "medium", origin: "Caucasus" },
    { name: "Red Imported Fire Ant", type: "insect", severity: "high", origin: "South America" },
    { name: "Cane Toad", type: "amphibian", severity: "critical", origin: "Americas" },
    { name: "Spotted Lanternfly", type: "insect", severity: "high", origin: "China" },
  ];
  return species;
};

// Generate heatmap data points
const generateHeatmapData = () => {
  return [
    { lat: 40.7128, lng: -74.006, intensity: 0.9, name: "New York", species: ["Zebra Mussel", "Spotted Lanternfly"] },
    { lat: 25.7617, lng: -80.1918, intensity: 1.0, name: "Florida", species: ["Burmese Python", "Lionfish"] },
    { lat: 51.5074, lng: -0.1278, intensity: 0.7, name: "London", species: ["Japanese Knotweed", "Giant Hogweed"] },
    { lat: 35.6762, lng: 139.6503, intensity: 0.6, name: "Tokyo", species: ["Asian Tiger Mosquito"] },
    { lat: -33.8688, lng: 151.2093, intensity: 0.95, name: "Sydney", species: ["Cane Toad", "Red Imported Fire Ant"] },
    { lat: 48.8566, lng: 2.3522, intensity: 0.65, name: "Paris", species: ["Asian Tiger Mosquito", "Japanese Knotweed"] },
    { lat: 55.7558, lng: 37.6173, intensity: 0.5, name: "Moscow", species: ["Emerald Ash Borer"] },
    { lat: -22.9068, lng: -43.1729, intensity: 0.8, name: "Rio de Janeiro", species: ["Lionfish"] },
    { lat: 1.3521, lng: 103.8198, intensity: 0.7, name: "Singapore", species: ["Asian Tiger Mosquito"] },
    { lat: 34.0522, lng: -118.2437, intensity: 0.85, name: "Los Angeles", species: ["Spotted Lanternfly", "Red Imported Fire Ant"] },
    { lat: 52.52, lng: 13.405, intensity: 0.6, name: "Berlin", species: ["Asian Tiger Mosquito"] },
    { lat: 19.4326, lng: -99.1332, intensity: 0.75, name: "Mexico City", species: ["Cane Toad"] },
    { lat: -34.6037, lng: -58.3816, intensity: 0.65, name: "Buenos Aires", species: ["Red Imported Fire Ant"] },
    { lat: 28.6139, lng: 77.209, intensity: 0.7, name: "New Delhi", species: ["Asian Tiger Mosquito", "Japanese Knotweed"] },
    { lat: 39.9042, lng: 116.4074, intensity: 0.55, name: "Beijing", species: ["Spotted Lanternfly"] },
  ];
};

// Get color based on intensity with alpha for gradients
const getHexColor = (intensity) => {
  if (intensity > 0.8) return `rgba(239, 68, 68, ${intensity * 0.8})`;
  if (intensity > 0.6) return `rgba(249, 115, 22, ${intensity * 0.8})`;
  if (intensity > 0.4) return `rgba(234, 179, 8, ${intensity * 0.7})`;
  return `rgba(34, 197, 94, ${intensity * 0.6})`;
};

// Stats card component
function StatCard({ icon: Icon, label, value, trend, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/50"
    >
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-0">
            <TrendingUp className="w-3 h-3 mr-1" />
            {trend}
          </Badge>
        )}
      </div>
      <p className="text-3xl font-bold text-white mt-4">{value}</p>
      <p className="text-slate-400 text-sm mt-1">{label}</p>
    </motion.div>
  );
}

export default function Home() {
  const globeEl = useRef();
  const [heatmapData] = useState(() => generateHeatmapData());
  const [speciesData] = useState(() => generateSpeciesData());
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [intensityRange, setIntensityRange] = useState([0]);
  const [showPanel, setShowPanel] = useState(true);
  const [showLayerSelector, setShowLayerSelector] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    temperature: true,
    humidity: false,
    elevation: false,
    precipitation: false,
    soilMoisture: false,
    windPatterns: false,
  });
  
  useEffect(() => {
    if (globeEl.current) {
      const controls = globeEl.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
    }
  }, []);
  
  const filteredData = heatmapData.filter(point => {
    if (intensityRange[0] > 0 && point.intensity < intensityRange[0] / 100) return false;
    return true;
  });
  

  
  const severityCounts = {
    critical: speciesData.filter(s => s.severity === 'critical').length,
    high: speciesData.filter(s => s.severity === 'high').length,
    medium: speciesData.filter(s => s.severity === 'medium').length,
  };
  
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
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Report Sighting
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="pt-20 flex">
        {/* Globe container */}
          <div className="flex-1 h-[calc(100vh-80px)] relative bg-slate-950">
            <Globe
              ref={globeEl}
              globeImageUrl="https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg"
              bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
              backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"

              // Subtle points for click interactivity
              pointsData={filteredData}
              pointLat="lat"
              pointLng="lng"
              pointColor={() => 'rgba(255,255,255,0.5)'}
              pointAltitude={0.025}
              pointRadius={0.25}
              pointLabel={d => `<div style="background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px); padding: 12px; border-radius: 8px; border: 1px solid rgba(148, 163, 184, 0.5);"><div style="color: white; font-weight: 600; font-size: 14px; margin-bottom: 4px;">${d.name}</div><div style="color: rgba(148, 163, 184, 1); font-size: 12px;">${d.species.length} species detected</div><div style="color: rgba(148, 163, 184, 1); font-size: 12px; margin-top: 4px;">Threat: ${Math.round(d.intensity * 100)}%</div></div>`}
              onPointClick={point => setSelectedPoint(point)}

              // Heatmap layer
              heatmapsData={[filteredData]}
              heatmapPoints={d => d}
              heatmapPointLat="lat"
              heatmapPointLng="lng"
              heatmapPointWeight="intensity"
              heatmapBandwidth={5}
              heatmapTopAltitude={0.005}
              heatmapsTransitionDuration={500}

              atmosphereColor="#87ceeb"
              atmosphereAltitude={0.15}
              enablePointerInteraction={true}


            />

          

          
          {/* Legend and Layer Controls */}
          <div className="absolute bottom-6 left-6 space-y-3">
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
            
            <Button 
              onClick={() => setShowLayerSelector(!showLayerSelector)}
              className="w-full bg-slate-900/90 backdrop-blur-xl hover:bg-slate-800/90 border border-slate-700/50 text-white"
            >
              <Layers className="w-4 h-4 mr-2" />
              Environmental Layers
            </Button>
          </div>
          
          {/* Layer Selector Popup */}
          <AnimatePresence>
            {showLayerSelector && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-32 left-6 w-80 bg-slate-900/95 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/50 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Data Layers</h3>
                  <button 
                    onClick={() => setShowLayerSelector(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {[
                    { id: 'temperature', label: 'Temperature', icon: Thermometer, color: 'text-red-400' },
                    { id: 'humidity', label: 'Humidity', icon: Droplets, color: 'text-blue-400' },
                    { id: 'elevation', label: 'Elevation', icon: Mountain, color: 'text-amber-400' },
                    { id: 'precipitation', label: 'Precipitation', icon: CloudRain, color: 'text-cyan-400' },
                    { id: 'soilMoisture', label: 'Soil Moisture', icon: Sprout, color: 'text-green-400' },
                    { id: 'windPatterns', label: 'Wind Patterns', icon: Wind, color: 'text-slate-400' },
                  ].map((layer) => {
                    const Icon = layer.icon;
                    return (
                      <label
                        key={layer.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition-colors border border-slate-700/50"
                      >
                        <input
                          type="checkbox"
                          checked={activeLayers[layer.id]}
                          onChange={(e) => setActiveLayers({ ...activeLayers, [layer.id]: e.target.checked })}
                          className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                        />
                        <Icon className={`w-4 h-4 ${layer.color}`} />
                        <span className="text-sm text-slate-200 flex-1">{layer.label}</span>
                        {activeLayers[layer.id] && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">
                            Active
                          </Badge>
                        )}
                      </label>
                    );
                  })}
                </div>
                
                {Object.values(activeLayers).some(v => v) && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <p className="text-xs text-slate-400 text-center">
                      {Object.values(activeLayers).filter(v => v).length} layer(s) active
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Stats overlay */}
          <div className="absolute top-6 left-6 right-6 md:right-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                icon={Bug} 
                label="Tracked Species" 
                value={speciesData.length}
                color="bg-gradient-to-br from-blue-500 to-blue-600"
              />
              <StatCard 
                icon={MapPin} 
                label="Active Hotspots" 
                value={heatmapData.length}
                trend="+12%"
                color="bg-gradient-to-br from-amber-500 to-orange-600"
              />
              <StatCard 
                icon={AlertTriangle} 
                label="Critical Alerts" 
                value={severityCounts.critical}
                color="bg-gradient-to-br from-red-500 to-red-600"
              />
              <StatCard 
                icon={Leaf} 
                label="Regions Monitored" 
                value="127"
                color="bg-gradient-to-br from-emerald-500 to-emerald-600"
              />
            </div>
          </div>
          
          {/* Toggle panel button */}
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-slate-800/90 backdrop-blur-xl p-2 rounded-l-xl border border-r-0 border-slate-700/50 md:hidden"
          >
            <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${showPanel ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {/* Side panel */}
        <AnimatePresence>
          {showPanel && (
            <motion.aside
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="w-96 h-[calc(100vh-80px)] bg-slate-900/95 backdrop-blur-xl border-l border-slate-800/50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Filters */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Filters</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-500 mb-2 block">Species Type</label>
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="insect">Insects</SelectItem>
                          <SelectItem value="plant">Plants</SelectItem>
                          <SelectItem value="fish">Fish</SelectItem>
                          <SelectItem value="reptile">Reptiles</SelectItem>
                          <SelectItem value="mollusk">Mollusks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-xs text-slate-500 mb-3 block">
                        Minimum Threat Level: {intensityRange[0]}%
                      </label>
                      <Slider
                        value={intensityRange}
                        onValueChange={setIntensityRange}
                        max={100}
                        step={10}
                        className="py-2"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Selected location */}
                {selectedPoint ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Selected Location</h3>
                      </div>
                      <button onClick={() => setSelectedPoint(null)} className="text-slate-500 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <Card className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 border-slate-700/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-white flex items-center gap-2">
                          {selectedPoint.name}
                          <Badge className={`${selectedPoint.intensity > 0.8 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'} border-0`}>
                            {selectedPoint.intensity > 0.8 ? 'Critical' : 'High'}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Threat Level</span>
                            <span className="text-white font-medium">{Math.round(selectedPoint.intensity * 100)}%</span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                selectedPoint.intensity > 0.8 ? 'bg-red-500' : 
                                selectedPoint.intensity > 0.6 ? 'bg-orange-500' : 'bg-yellow-500'
                              }`}
                              style={{ width: `${selectedPoint.intensity * 100}%` }}
                            />
                          </div>
                          <div className="pt-2">
                            <p className="text-xs text-slate-500 mb-2">Detected Species:</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedPoint.species.map((species) => (
                                <Badge key={species} variant="outline" className="border-slate-600 text-slate-300">
                                  {species}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <div className="mb-8 p-4 rounded-xl border border-dashed border-slate-700 text-center">
                    <Info className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Click a hotspot on the globe to view details</p>
                  </div>
                )}
                
                {/* Species list */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Tracked Species</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {speciesData
                      .filter(s => filterType === 'all' || s.type === filterType)
                      .map((species) => (
                        <motion.div
                          key={species.name}
                          whileHover={{ scale: 1.02 }}
                          className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 cursor-pointer hover:border-slate-600/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-white font-medium">{species.name}</h4>
                              <p className="text-xs text-slate-500 capitalize">{species.type} • {species.origin}</p>
                            </div>
                            <Badge 
                              className={`border-0 ${
                                species.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                species.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}
                            >
                              {species.severity}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}