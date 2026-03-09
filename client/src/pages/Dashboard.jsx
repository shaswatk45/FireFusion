import React, { useState, useEffect } from "react";
import { useIncident } from "../context/IncidentContext";
import IncidentForm from "../components/IncidentForm";
import IncidentMap from "../components/IncidentMap";
import SummaryStats from "../components/SummaryStats";
import AlertNotification from "../components/AlertNotification";
import VolunteerRequestButton from "../components/VolunteerRequestButton";
import SOSButton from "../components/SOSButton";
import { useAuth } from "../context/AuthContext";
import { MdMenu, MdClose, MdPerson, MdLogout, MdAdminPanelSettings, MdFireTruck, MdSatellite } from 'react-icons/md';
import { getWildfires } from "../services/api";

export default function Dashboard() {
  const {
    incidents,
    fetchIncidents,
    loading
  } = useIncident();
  const [showForm, setShowForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  // State for wildfire data
  const [wildfires, setWildfires] = useState([]);
  const [wildfiresLoading, setWildfiresLoading] = useState(false);

  // Fetch wildfires on mount and every 5 minutes
  useEffect(() => {
    const fetchWildfires = async () => {
      setWildfiresLoading(true);
      try {
        const res = await getWildfires({});
        setWildfires(res.data || []);
      } catch (error) {
        console.error('Error fetching wildfires:', error);
      }
      setWildfiresLoading(false);
    };

    fetchWildfires();
    const interval = setInterval(fetchWildfires, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
      <AlertNotification />

      {/* Top Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors shadow-lg"
          >
            {sidebarOpen ? <MdClose className="text-2xl" /> : <MdMenu className="text-2xl" />}
          </button>

          <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            🔥 FireSync
          </h1>

          <div className="flex items-center gap-2">
            {(user?.role === "admin" || user?.role === "coordinator") && (
              <a
                href="/admin"
                className="hidden sm:flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-lg"
              >
                <MdAdminPanelSettings className="text-xl" />
                <span className="hidden md:inline">Command Center</span>
              </a>
            )}
            {user?.role === "volunteer" && (
              <a
                href="/volunteer"
                className="hidden sm:flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-lg"
              >
                <MdFireTruck className="text-xl" />
                <span className="hidden md:inline">Volunteer Portal</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Left Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="h-full flex flex-col">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <MdClose className="text-2xl" />
              </button>
            </div>

            {user && (
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <MdPerson className="text-3xl" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{user.name}</p>
                    <p className="text-sm opacity-90 capitalize">{user.role} User</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <nav className="flex-1 p-6 space-y-2">
            <a
              href="/damage-assessment"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 p-4 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
            >
              <span className="text-2xl">🔥</span>
              <span className="font-semibold text-gray-800">Assess Fire Damage</span>
            </a>

            {(user?.role === "volunteer" || user?.role === "coordinator" || user?.role === "admin") && (
              <a
                href="/incidents"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 p-4 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors"
              >
                <span className="text-2xl">📋</span>
                <span className="font-semibold text-gray-800">View Incidents</span>
              </a>
            )}

            <a
              href="/community-donations"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 p-4 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
            >
              <span className="text-2xl">🤝</span>
              <span className="font-semibold text-gray-800">Community Donations</span>
            </a>

            {(user?.role === "admin" || user?.role === "coordinator") && (
              <a
                href="/admin"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 p-4 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <MdAdminPanelSettings className="text-2xl text-gray-700" />
                <span className="font-semibold text-gray-800">Command Center</span>
              </a>
            )}

            {user?.role === "volunteer" && (
              <a
                href="/volunteer"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors"
              >
                <MdFireTruck className="text-2xl text-yellow-600" />
                <span className="font-semibold text-gray-800">Volunteer Portal</span>
              </a>
            )}

            {user?.role === "public" && (
              <div className="p-4">
                <VolunteerRequestButton />
              </div>
            )}
          </nav>

          <div className="p-6 border-t border-gray-200">
            <button
              onClick={() => {
                logout();
                setSidebarOpen(false);
              }}
              className="w-full flex items-center justify-center gap-3 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg"
            >
              <MdLogout className="text-xl" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

        {/* SOS Button - Fixed Position (Only for public/user role, not volunteers) */}
        {user?.role !== "volunteer" && user?.role !== "coordinator" && user?.role !== "admin" && (
          <SOSButton onTrigger={fetchIncidents} />
        )}

        {/* Stats - Only for volunteers/coordinators/admins */}
        {(user?.role === "volunteer" || user?.role === "coordinator" || user?.role === "admin") && (
          <div className="mb-8">
            <SummaryStats incidents={incidents} />
          </div>
        )}

        {/* Full Incident Map - Only for volunteers/coordinators/admins */}
        {(user?.role === "volunteer" || user?.role === "coordinator" || user?.role === "admin") && (
          <div className="mb-8 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>📍</span> Incident Locations
              </h2>
            </div>
            <div className="p-4">
              <IncidentMap
                incidents={(incidents || []).filter(inc =>
                  // Show manually reported incidents (source != 'Satellite')
                  // OR show Satellite incidents ONLY if severity is 'High'
                  inc.source !== 'Satellite' || inc.severity === 'High'
                )}
              />
            </div>
          </div>
        )}

        {/* Satellite Wildfire Alerts - Only for volunteers/coordinators/admins */}
        {(user?.role === "volunteer" || user?.role === "coordinator" || user?.role === "admin") && (
          <div className="mb-8 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-500 px-6 py-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <MdSatellite className="text-2xl" />
                🛰️ Satellite Wildfire Alerts
              </h2>
            </div>
            <div className="p-6">
              {wildfiresLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto mb-3"></div>
                  <p className="text-gray-500">Loading wildfire alerts...</p>
                </div>
              ) : wildfires.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-3">✅</div>
                  <p className="text-xl font-semibold text-green-600">No active wildfires detected!</p>
                  <p className="text-gray-500 mt-1">All monitored areas are currently safe</p>
                </div>
              ) : (
                <>
                  {/* Wildfire Map */}
                  <IncidentMap
                    incidents={wildfires.map(fire => ({
                      _id: fire._id,
                      title: `🔥 Wildfire - ${fire.satellite}`,
                      description: `FRP: ${fire.frp?.toFixed(1) || 0} MW | ${fire.address || 'Unknown location'}`,
                      location: fire.location,
                      severity: fire.confidence === 'High' ? 'High' : fire.confidence === 'Medium' ? 'Medium' : 'Low',
                      status: fire.status || 'detected'
                    }))}
                  />

                  {/* Wildfire Alert Cards */}
                  <div className="mt-4 space-y-4">
                    {wildfires.map((fire) => (
                      <div key={fire._id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <span className="text-xl">🔥</span>
                              <span className="font-bold text-gray-800">{fire.satellite} Detection</span>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${fire.confidence === 'High' ? 'bg-red-100 text-red-700' :
                                  fire.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                }`}>
                                {fire.confidence}
                              </span>
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                                {fire.frp?.toFixed(1) || 0} MW
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <div className="font-medium mb-1">📍 {fire.address || 'Location pending...'}</div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                <div>🌡️ Brightness: {fire.brightness?.toFixed(1) || 0} K</div>
                                <div>📅 {fire.acqDate ? new Date(fire.acqDate).toLocaleDateString() : 'Today'}</div>
                                <div>⏰ {fire.acqTime || 'N/A'}</div>
                              </div>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${fire.status === 'resolved' ? 'bg-green-100 text-green-700' :
                              fire.status === 'incident_created' ? 'bg-red-100 text-red-700' :
                                'bg-blue-100 text-blue-700'
                            }`}>
                            {(fire.status || 'detected').replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="bg-orange-50 px-6 py-3 text-center">
              <p className="text-orange-700 text-sm font-medium">
                🛰️ Real-time monitoring via NASA FIRMS satellite data
              </p>
            </div>
          </div>
        )}

        {/* Wildfire Alerts - Only for regular users (public) */}
        {user?.role !== "volunteer" && user?.role !== "coordinator" && user?.role !== "admin" && (
          <div className="mb-8 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-500 px-6 py-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <MdSatellite className="text-2xl" />
                🔥 Wildfire Alerts Near You
              </h2>
            </div>
            <div className="p-6">
              {wildfiresLoading ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-500 font-medium">Checking for wildfires...</p>
                </div>
              ) : wildfires.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-7xl mb-4">✅</div>
                  <p className="text-2xl font-bold text-green-600">All Clear!</p>
                  <p className="text-gray-500 mt-2">No active wildfires detected in your area</p>
                  <p className="text-gray-400 text-sm mt-4">🛰️ Monitored by NASA FIRMS satellite system</p>
                </div>
              ) : (
                <>
                  {/* Map showing wildfire locations */}
                  <IncidentMap
                    incidents={wildfires.map(fire => ({
                      _id: fire._id,
                      title: `🔥 Wildfire - ${fire.satellite}`,
                      description: `FRP: ${fire.frp?.toFixed(1) || 0} MW | ${fire.address || 'Unknown location'}`,
                      location: fire.location,
                      severity: fire.confidence === 'High' ? 'High' : fire.confidence === 'Medium' ? 'Medium' : 'Low',
                      status: fire.status || 'detected'
                    }))}
                  />

                  {/* Wildfire Alert Cards */}
                  <div className="mt-4 space-y-3">
                    {wildfires.map((fire) => (
                      <div key={fire._id} className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">🔥</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-bold text-red-700">Active Wildfire</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${fire.confidence === 'High' ? 'bg-red-600 text-white' :
                                fire.confidence === 'Medium' ? 'bg-yellow-500 text-white' :
                                  'bg-green-500 text-white'
                                }`}>
                                {fire.confidence}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                                {fire.frp?.toFixed(1) || 0} MW
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm">📍 {fire.address || 'Location pending...'}</p>
                            <p className="text-gray-500 text-xs mt-1">
                              {fire.satellite} • {fire.acqDate ? new Date(fire.acqDate).toLocaleDateString() : 'Today'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="bg-orange-50 px-6 py-3 text-center">
              <p className="text-orange-700 text-sm font-medium">
                🛰️ Real-time wildfire monitoring for your safety
              </p>
            </div>
          </div>
        )}

        {/* Report Incident Button/Form (Only for public/user role, not volunteers/coordinators) */}
        {user?.role !== "volunteer" && user?.role !== "coordinator" && user?.role !== "admin" && (
          <div className="mb-8">
            {!showForm ? (
              <div className="text-center">
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-10 py-4 rounded-2xl font-black text-lg transition-all duration-200 shadow-2xl hover:shadow-red-500/50 transform hover:scale-105"
                >
                  🔥 Report Fire / Incident
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">📝 Report New Incident</h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <MdClose className="text-2xl" />
                  </button>
                </div>
                <IncidentForm
                  onAdd={() => {
                    fetchIncidents();
                    setShowForm(false);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Info - View Incidents (Only for volunteers/coordinators/admins) */}
        {(user?.role === "volunteer" || user?.role === "coordinator" || user?.role === "admin") && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg text-center">
            <p className="text-blue-800 font-semibold mb-2">
              📋 Want to see all incidents?
            </p>
            <a
              href="/incidents"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg"
            >
              View All Incidents →
            </a>
          </div>
        )}

      </main>
    </div>
  );
}
