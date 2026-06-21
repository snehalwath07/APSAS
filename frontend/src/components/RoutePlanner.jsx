import React, { useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Sample paths for routing visualization
// Safest Route (long loop avoiding high risk areas)
const SAFEST_PATH = [
  [24.582, 78.921], // Source
  [24.578, 78.925],
  [24.570, 78.922],
  [24.568, 78.910],
  [24.571, 78.898],
  [24.578, 78.895], // Destination
];

// Fastest Route (direct path crossing near the critical risk zone)
const FASTEST_PATH = [
  [24.582, 78.921], // Source
  [24.584, 78.911], // Directly through high density zone
  [24.578, 78.895], // Destination
];

const startIcon = L.divIcon({
  html: `<div class="flex items-center justify-center w-6 h-6 bg-indigo-500 border border-white rounded-full text-white text-xs font-bold shadow-md">S</div>`,
  className: 'custom-route-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const endIcon = L.divIcon({
  html: `<div class="flex items-center justify-center w-6 h-6 bg-emerald-500 border border-white rounded-full text-white text-xs font-bold shadow-md">D</div>`,
  className: 'custom-route-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const RoutePlanner = () => {
  const [source, setSource] = useState('Central Bus Terminal, Sector 4');
  const [destination, setDestination] = useState('Riverside Tech Park, Sector 9');
  const [selectedRoute, setSelectedRoute] = useState('safest'); // safest or fastest
  const [calculating, setCalculating] = useState(false);
  const [calculated, setCalculated] = useState(true);

  const handleCalculate = () => {
    setCalculating(true);
    setTimeout(() => {
      setCalculating(false);
      setCalculated(true);
    }, 800);
  };

  const getActivePath = () => {
    return selectedRoute === 'safest' ? SAFEST_PATH : FASTEST_PATH;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Route Parameters Panel */}
      <div className="bg-card border border-border p-6 rounded-2xl flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold mb-4 text-text">Route Planner</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-dim mb-2 uppercase tracking-wide">Source Geolocation</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-3 text-text text-sm outline-none focus:border-indigo"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-dim mb-2 uppercase tracking-wide">Destination Target</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-3 text-text text-sm outline-none focus:border-indigo"
              />
            </div>
          </div>
          <button
            onClick={handleCalculate}
            disabled={calculating}
            className="btn btn-primary w-full mt-6 py-3 font-semibold text-sm rounded-xl text-white transition duration-200"
          >
            {calculating ? 'Running routing algorithms...' : 'Calculate Safest Route →'}
          </button>
        </div>

        {calculated && (
          <div className="mt-8">
            <h4 className="text-xs font-bold text-indigo uppercase tracking-wider mb-3">AI Engine Route Comparison</h4>
            <div className="space-y-3">
              {/* Safest Option */}
              <div
                onClick={() => setSelectedRoute('safest')}
                className={`flex justify-between items-center p-4 rounded-xl border cursor-pointer transition ${
                  selectedRoute === 'safest'
                    ? 'border-indigo bg-indigo-soft'
                    : 'border-border hover:bg-slate-800/20'
                }`}
              >
                <div>
                  <div className="font-semibold text-sm text-text flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald"></span>
                    Safest Route
                  </div>
                  <div className="flex gap-4 mt-1.5 text-xs text-text-dim">
                    <span>📏 6.8 km</span>
                    <span>⏱ 22 min</span>
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald font-mono">94</div>
              </div>

              {/* Fastest Option */}
              <div
                onClick={() => setSelectedRoute('fastest')}
                className={`flex justify-between items-center p-4 rounded-xl border cursor-pointer transition ${
                  selectedRoute === 'fastest'
                    ? 'border-indigo bg-indigo-soft'
                    : 'border-border hover:bg-slate-800/20'
                }`}
              >
                <div>
                  <div className="font-semibold text-sm text-text flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber"></span>
                    Fastest Route
                  </div>
                  <div className="flex gap-4 mt-1.5 text-xs text-text-dim">
                    <span>📏 4.9 km</span>
                    <span>⏱ 12 min</span>
                  </div>
                </div>
                <div className="text-2xl font-black text-amber font-mono">61</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Preview Panel */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden min-h-[400px] h-full flex flex-col">
        <div className="p-4 border-b border-border bg-slate-900/40">
          <h3 className="text-sm font-semibold text-text">Route Polyline Preview</h3>
        </div>
        <div className="flex-1 w-full relative">
          <MapContainer center={[24.575, 78.910]} zoom={14} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {calculated && (
              <>
                <Polyline
                  positions={getActivePath()}
                  pathOptions={{
                    color: selectedRoute === 'safest' ? '#10B981' : '#F59E0B',
                    weight: 5,
                    opacity: 0.85
                  }}
                />
                <Marker position={getActivePath()[0]} icon={startIcon}>
                  <Popup><span className="text-slate-900 font-semibold text-xs">SOURCE START</span></Popup>
                </Marker>
                <Marker position={getActivePath()[getActivePath().length - 1]} icon={endIcon}>
                  <Popup><span className="text-slate-900 font-semibold text-xs">DESTINATION END</span></Popup>
                </Marker>
              </>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default RoutePlanner;
