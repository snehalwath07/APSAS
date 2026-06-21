import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker paths
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom DOM elements for markers
const createHtmlIcon = (color, animate = false) => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        ${animate ? `<div class="absolute inset-0 rounded-full animate-ping opacity-60" style="background-color: ${color}"></div>` : ''}
        <div class="w-4 h-4 rounded-full border-2 border-slate-900 shadow-md" style="background-color: ${color}"></div>
      </div>
    `,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createTeamIcon = (type) => {
  const emoji = type === 'fire' ? '🔥' : type === 'medical' ? '🚑' : type === 'security' ? '🚓' : '🚒';
  return L.divIcon({
    html: `
      <div class="flex items-center justify-center w-8 h-8 bg-emerald-500 border border-emerald-300 rounded-lg shadow-lg text-xs transform hover:scale-110 transition duration-150">
        <span>${emoji}</span>
      </div>
    `,
    className: 'custom-team-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const InteractiveMap = ({ zones = [], incidents = [], sosRequests = [], teams = [], layers = { zones: true, incidents: true, sos: true, teams: true } }) => {
  const center = [24.580, 78.910]; // Sector 7 Center
  
  const getZoneColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#6366F1';
      case 'low': return '#10B981';
      default: return '#6366F1';
    }
  };

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-border shadow-inner">
      <MapContainer center={center} zoom={14} className="h-full w-full">
        {/* Futuristic dark style tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 1. Risk Zones Layer */}
        {layers.zones && zones.map((zone) => {
          try {
            const coords = JSON.parse(zone.polygon_coords_json);
            return (
              <Polygon
                key={zone.id}
                positions={coords}
                pathOptions={{
                  fillColor: getZoneColor(zone.risk_level),
                  fillOpacity: 0.18,
                  color: getZoneColor(zone.risk_level),
                  weight: 2,
                  dashArray: '3'
                }}
              >
                <Popup>
                  <div className="text-slate-900 p-1">
                    <h4 className="font-bold text-sm">{zone.name}</h4>
                    <p className="text-xs mt-1">Risk Score: <span className="font-semibold">{zone.risk_score}%</span></p>
                    <p className="text-xs">Rating: <span className="font-semibold text-red-500 uppercase">{zone.risk_level}</span></p>
                    <p className="text-xs">Active Incidents: {zone.active_incidents_count}</p>
                  </div>
                </Popup>
              </Polygon>
            );
          } catch (e) {
            console.error('Failed to parse polygon coordinates', e);
            return null;
          }
        })}

        {/* 2. Incidents Layer */}
        {layers.incidents && incidents.filter(i => i.status !== 'resolved').map((inc) => (
          <Marker
            key={`inc-${inc.id}`}
            position={[inc.location_lat, inc.location_lng]}
            icon={createHtmlIcon(getZoneColor(inc.severity), true)}
          >
            <Popup>
              <div className="text-slate-900 p-1">
                <h4 className="font-bold text-sm">🚨 INC-{inc.id}: {inc.type}</h4>
                <p className="text-xs mt-1">{inc.description}</p>
                <p className="text-xs font-semibold mt-1">Severity: <span className="text-red-500">{inc.severity.toUpperCase()}</span></p>
                <p className="text-xs">Status: <span className="text-amber-500">{inc.status.toUpperCase()}</span></p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 3. SOS Requests Layer */}
        {layers.sos && sosRequests.filter(s => s.status !== 'resolved').map((sos) => (
          <Marker
            key={`sos-${sos.id}`}
            position={[sos.location_lat, sos.location_lng]}
            icon={createHtmlIcon('#EF4444', true)}
          >
            <Popup>
              <div className="text-slate-900 p-1">
                <h4 className="font-bold text-sm text-red-600">🆘 SOS-{sos.id} DISTRESS</h4>
                <p className="text-xs mt-1">Status: PENDING EMERGENCY RESPONSE</p>
                <p className="text-xs font-semibold text-rose-500">Immediate team deployment active.</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 4. Response Teams Layer */}
        {layers.teams && teams.map((team) => (
          <Marker
            key={`team-${team.id}`}
            position={[team.current_lat, team.current_lng]}
            icon={createTeamIcon(team.type)}
          >
            <Popup>
              <div className="text-slate-900 p-1">
                <h4 className="font-bold text-sm">🛡️ {team.name}</h4>
                <p className="text-xs">Type: {team.type.toUpperCase()}</p>
                <p className="text-xs font-semibold">Status: <span className={team.status === 'ready' ? 'text-green-600' : 'text-amber-600'}>{team.status.toUpperCase()}</span></p>
                <p className="text-xs">Contact: {team.contact_phone}</p>
              </div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>
      
      {/* Absolute overlay indicators */}
      <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md border border-border px-3 py-1.5 rounded-lg text-xs font-mono text-text-dim z-[1000]">
        24.6° N, 78.9° E · Live Feeds
      </div>
    </div>
  );
};

export default InteractiveMap;
