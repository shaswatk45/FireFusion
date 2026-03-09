import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker colors based on severity
const getMarkerIcon = (severity) => {
  const colors = {
    Low: '#10B981',    // Green
    Medium: '#F59E0B', // Yellow  
    High: '#EF4444'    // Red
  };

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${colors[severity]}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

export default function IncidentMap({ incidents }) {
  const defaultPosition = [20.5937, 78.9629]; // Center of India

  return (
    <div className="mb-6 rounded-lg shadow-lg overflow-hidden border">
      <MapContainer
        center={defaultPosition}
        zoom={5}
        style={{ height: "400px", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {incidents.map((incident) => (
          <Marker
            key={incident._id}
            position={[incident.location.coordinates[1], incident.location.coordinates[0]]} // [lat, lng]
            icon={getMarkerIcon(incident.severity)}
          >
            <Popup>
              <div className="text-sm">
                <strong className="text-lg">{incident.title}</strong><br />
                <p className="my-2">{incident.description}</p>
                <span className={`px-2 py-1 rounded text-xs font-bold ${incident.severity === 'High' ? 'bg-red-100 text-red-700' :
                  incident.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                  {incident.severity} Priority
                </span>
                <br />
                <span className="text-gray-500 text-xs">
                  Status: {incident.status}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
