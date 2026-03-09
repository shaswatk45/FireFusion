import React, { useState, useEffect } from 'react';
import { getWildfires, getWildfireStats, updateWildfireStatus } from '../services/api';
import { MdSatellite, MdLocalFireDepartment, MdWarning, MdCheckCircle } from 'react-icons/md';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom wildfire marker icon
const wildfireIcon = L.divIcon({
    className: 'custom-wildfire-marker',
    html: `<div style="background-color: #ff4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid #ff8800; box-shadow: 0 0 10px rgba(255, 68, 68, 0.6); display: flex; align-items: center; justify-content: center; color: white; font-size: 16px;">🔥</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

export default function WildfireMonitor() {
    const [wildfires, setWildfires] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all'); // all, detected, incident_created

    useEffect(() => {
        fetchData();
        // Refresh every 5 minutes
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [filter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = filter !== 'all' ? { status: filter } : {};
            const [wildfiresRes, statsRes] = await Promise.all([
                getWildfires(params),
                getWildfireStats()
            ]);
            setWildfires(wildfiresRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching wildfire data:', error);
        }
        setLoading(false);
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await updateWildfireStatus(id, newStatus);
            fetchData();
            alert('Wildfire status updated!');
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const defaultPosition = [20.5937, 78.9629]; // Center of India

    return (
        <div className="space-y-8">
            {/* Statistics Cards - Matching Dashboard SummaryStats style */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-xl text-center border-l-4 border-blue-500">
                        <div className="text-4xl font-bold text-blue-600 mb-1">{stats.total}</div>
                        <div className="text-sm font-medium text-gray-600">Total Detected</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-xl text-center border-l-4 border-orange-500">
                        <div className="text-4xl font-bold text-orange-600 mb-1">{stats.last24h}</div>
                        <div className="text-sm font-medium text-gray-600">Last 24 Hours</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-xl text-center border-l-4 border-yellow-500">
                        <div className="text-4xl font-bold text-yellow-600 mb-1">{stats.detected}</div>
                        <div className="text-sm font-medium text-gray-600">Monitoring</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-xl text-center border-l-4 border-red-500">
                        <div className="text-4xl font-bold text-red-600 mb-1">{stats.withIncidents}</div>
                        <div className="text-sm font-medium text-gray-600">Incidents Created</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-xl text-center border-l-4 border-green-500">
                        <div className="text-4xl font-bold text-green-600 mb-1">{stats.resolved}</div>
                        <div className="text-sm font-medium text-gray-600">Resolved</div>
                    </div>
                </div>
            )}

            {/* Filter - Matching Dashboard card style */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <MdSatellite className="text-2xl" />
                        🛰️ Wildfire Filter
                    </h3>
                </div>
                <div className="flex flex-wrap gap-2 p-4">
                    {[
                        { id: 'all', label: 'All Fires', icon: '🔥' },
                        { id: 'detected', label: 'Detected', icon: '🛰️' },
                        { id: 'incident_created', label: 'Active Incidents', icon: '🚨' },
                        { id: 'resolved', label: 'Resolved', icon: '✅' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${filter === f.id
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg transform scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow'
                                }`}
                        >
                            {f.icon} {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Map View - Matching Dashboard IncidentMap card style */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 px-6 py-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <MdLocalFireDepartment className="text-2xl" />
                        🔥 Wildfire Heat Map
                    </h2>
                </div>
                <MapContainer
                    center={defaultPosition}
                    zoom={5}
                    style={{ height: "500px", width: "100%" }}
                    className="z-0"
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {wildfires.map((fire) => (
                        <React.Fragment key={fire._id}>
                            <Marker
                                position={[fire.location.coordinates[1], fire.location.coordinates[0]]}
                                icon={wildfireIcon}
                            >
                                <Popup>
                                    <div className="text-sm max-w-xs">
                                        <strong className="text-lg text-orange-600">🔥 Wildfire Detected</strong><br />
                                        <div className="mt-2 space-y-1">
                                            <div><strong>Satellite:</strong> {fire.satellite}</div>
                                            <div><strong>Confidence:</strong>
                                                <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${fire.confidence === 'High' ? 'bg-red-100 text-red-700' :
                                                    fire.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                    {fire.confidence}
                                                </span>
                                            </div>
                                            <div><strong>FRP:</strong> {fire.frp.toFixed(2)} MW</div>
                                            <div><strong>Brightness:</strong> {fire.brightness.toFixed(1)} K</div>
                                            <div><strong>Detected:</strong> {new Date(fire.detectedAt).toLocaleString()}</div>
                                            <div><strong>Status:</strong>
                                                <span className={`ml-2 px-2 py-1 rounded text-xs ${fire.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                                    fire.status === 'incident_created' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {fire.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                            {/* Heat circle based on FRP */}
                            <Circle
                                center={[fire.location.coordinates[1], fire.location.coordinates[0]]}
                                radius={fire.frp * 100} // Radius based on Fire Radiative Power
                                pathOptions={{
                                    color: 'red',
                                    fillColor: 'orange',
                                    fillOpacity: 0.2
                                }}
                            />
                        </React.Fragment>
                    ))}
                </MapContainer>
            </div>

            {/* Wildfire List - Matching Dashboard card style */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span>📋</span> Detected Wildfires
                    </h3>
                </div>
                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                            <p className="text-gray-500 font-medium">Loading wildfire data...</p>
                        </div>
                    ) : wildfires.length === 0 ? (
                        <div className="text-center py-12">
                            <MdCheckCircle className="text-7xl mx-auto mb-4 text-green-500" />
                            <p className="text-xl font-semibold text-gray-700">No active wildfires detected! 🎉</p>
                            <p className="text-gray-500 mt-2">All areas are currently safe</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {wildfires.map((fire) => (
                                <div key={fire._id} className="bg-gray-50 border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <MdSatellite className="text-blue-600 text-xl" />
                                                <span className="font-bold text-gray-800">{fire.satellite} Satellite Detection</span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${fire.confidence === 'High' ? 'bg-red-100 text-red-700' :
                                                    fire.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                    {fire.confidence} Confidence
                                                </span>
                                            </div>

                                            <div className="text-sm text-gray-600 space-y-2">
                                                <div className="font-medium">📍 {fire.address}</div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-lg">
                                                    <div>🔥 <strong>FRP:</strong> {fire.frp.toFixed(2)} MW</div>
                                                    <div>🌡️ <strong>Brightness:</strong> {fire.brightness.toFixed(1)} K</div>
                                                    <div>📅 {new Date(fire.acqDate).toLocaleDateString()}</div>
                                                    <div>⏰ {fire.acqTime}</div>
                                                </div>
                                                {fire.incidentId && (
                                                    <div className="mt-3 text-blue-600 font-medium">
                                                        🚨 Incident Created: #{fire.incidentId._id?.slice(-6)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 ml-4">
                                            <span className={`px-4 py-2 rounded-lg text-xs font-bold text-center ${fire.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                                fire.status === 'incident_created' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {fire.status.replace('_', ' ').toUpperCase()}
                                            </span>

                                            {fire.status !== 'resolved' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(fire._id, 'resolved')}
                                                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg"
                                                >
                                                    ✅ Mark Resolved
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Info Panel - Matching Dashboard style */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-2xl shadow-lg">
                <div className="flex items-start gap-4">
                    <MdWarning className="text-blue-600 text-3xl flex-shrink-0 mt-1" />
                    <div>
                        <strong className="text-blue-900 text-lg">About Wildfire Monitoring:</strong>
                        <p className="text-blue-800 mt-2 leading-relaxed">
                            🛰️ This system uses NASA FIRMS (Fire Information for Resource Management System) satellite data
                            to detect active fires in near real-time. Data is collected from VIIRS and MODIS satellites.
                            High-confidence detections automatically create incidents and alert coordinators.
                            The system checks for new fires every 60 minutes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
