import React, { useEffect, useState } from 'react';
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getPendingVolunteerRequests,
  updateVolunteerRequestStatus,
  getIncidents,
  assignIncidentToVolunteer,
  broadcastAlert,
  updateIncidentStatus,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import {
  MdMenu, MdClose, MdPerson, MdLogout, MdBarChart, MdSatellite,
  MdAssessment, MdPeople, MdNotifications, MdWarning, MdSettings,
  MdLocalFireDepartment, MdVerifiedUser, MdCheckCircle
} from 'react-icons/md';
import WildfireMonitor from '../components/WildfireMonitor';

const socket = io();

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State management
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [alertMsg, setAlertMsg] = useState('');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedVolunteers, setSelectedVolunteers] = useState([]); // Changed to array for multi-select
  const [volunteerCount, setVolunteerCount] = useState(1); // Number of volunteers needed
  const [lightboxImage, setLightboxImage] = useState(null); // For viewing full images

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'requests') fetchRequests();
    if (activeTab === 'assignments') {
      fetchIncidents();
      fetchUsers(); // Also fetch users to populate volunteer dropdown
    }
    if (activeTab === 'verify') fetchIncidents();
    if (activeTab === 'overview') fetchOverviewData();
  }, [activeTab]);

  // Real-time incident alerts for coordinators
  useEffect(() => {
    // Listen for new incidents
    socket.on('newIncident', (incident) => {
      console.log('🆘 New incident received:', incident);

      // Show popup alert
      const severity = incident.severity === 'High' ? '🔴 HIGH PRIORITY' : incident.severity === 'Medium' ? '🟡 MEDIUM' : '🟢 LOW';
      const alertMessage = `${severity}\n\n${incident.title}\n\n${incident.description || 'No description'}\n\nClick OK to view assignments.`;

      if (window.confirm(alertMessage)) {
        setActiveTab('assignments');
        fetchIncidents();
      }
    });

    // Listen for incident updates
    socket.on('incidentUpdated', (incident) => {
      console.log('📝 Incident updated:', incident);

      // Show notification
      alert(`Incident Updated!\n\nTitle: ${incident.title}\nStatus: ${incident.status}\nSeverity: ${incident.severity}`);

      // Refresh data if on relevant tabs
      if (activeTab === 'assignments' || activeTab === 'overview') {
        fetchIncidents();
        fetchOverviewData();
      }
    });

    return () => {
      socket.off('newIncident');
      socket.off('incidentUpdated');
    };
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await getPendingVolunteerRequests();
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIncidents = async () => {
    try {
      const res = await getIncidents();
      setIncidents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOverviewData = async () => {
    try {
      const res = await getIncidents();
      const incidents = res.data;
      setStats({
        total: incidents.length,
        pending: incidents.filter(i => i.status === 'Reported').length,
        resolved: incidents.filter(i => i.status === 'Resolved').length
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (id) => {
    try {
      await updateVolunteerRequestStatus(id, 'approved');
      alert('Request approved!');
      fetchRequests();
    } catch (err) {
      alert('Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await updateVolunteerRequestStatus(id, 'rejected');
      alert('Request rejected');
      fetchRequests();
    } catch (err) {
      alert('Failed to reject');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      alert('Role updated!');
      fetchUsers();
    } catch (err) {
      alert('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user?')) return;
    try {
      await deleteUser(userId);
      alert('User deleted');
      fetchUsers();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const handleAssign = async () => {
    if (!selectedIncident || selectedVolunteers.length === 0) {
      alert('Select an incident and at least one volunteer');
      return;
    }
    try {
      // Assign all selected volunteers to the incident in one call
      await assignIncidentToVolunteer(selectedIncident, selectedVolunteers);
      alert(`Incident assigned to ${selectedVolunteers.length} volunteer(s)!`);
      fetchIncidents();
      setSelectedIncident(null);
      setSelectedVolunteers([]);
    } catch (err) {
      alert('Failed to assign');
    }
  };

  // Toggle volunteer selection for multi-select
  const toggleVolunteerSelection = (volunteerId) => {
    setSelectedVolunteers(prev => {
      if (prev.includes(volunteerId)) {
        return prev.filter(id => id !== volunteerId);
      } else {
        return [...prev, volunteerId];
      }
    });
  };

  const handleBroadcast = async () => {
    if (!alertMsg.trim()) {
      alert('Enter alert message');
      return;
    }
    try {
      await broadcastAlert(alertMsg, 'high');
      alert('Alert broadcasted!');
      setAlertMsg('');
    } catch (err) {
      alert('Failed to broadcast alert');
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: MdBarChart },
    { id: 'wildfires', label: 'Wildfire Monitor', icon: MdSatellite },
    { id: 'verify', label: 'Verify Proofs', icon: MdVerifiedUser },
    { id: 'requests', label: 'Volunteer Requests', icon: MdPeople },
    { id: 'alerts', label: 'Broadcast Alert', icon: MdNotifications },
    { id: 'assignments', label: 'Incident Assignments', icon: MdWarning },
    { id: 'users', label: 'User Management', icon: MdSettings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
      {/* Top Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Hamburger Menu */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-lg"
          >
            {sidebarOpen ? <MdClose className="text-2xl" /> : <MdMenu className="text-2xl" />}
          </button>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🛡️ Command Center
          </h1>

          {/* Quick Action */}
          <a
            href="/dashboard"
            className="hidden sm:flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-lg"
          >
            <MdLocalFireDepartment className="text-xl" />
            <span className="hidden md:inline">Public View</span>
          </a>
        </div>
      </header>

      {/* Left Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Command Center</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <MdClose className="text-2xl" />
              </button>
            </div>

            {/* User Info */}
            {user && (
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <MdPerson className="text-3xl" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{user.name}</p>
                    <p className="text-sm opacity-90 capitalize">{user.role}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg transition-all ${activeTab === item.id
                    ? 'bg-blue-100 text-blue-700 font-semibold shadow-md'
                    : 'hover:bg-gray-100 text-gray-700'
                    }`}
                >
                  <Icon className="text-2xl" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
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

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
              <h2 className="text-3xl font-bold mb-2">📊 Dashboard Overview</h2>
              <p className="opacity-90">System-wide statistics and insights</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="text-5xl font-bold text-blue-600 mb-2">{stats.total}</div>
                <div className="text-gray-600">Total Incidents</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="text-5xl font-bold text-orange-600 mb-2">{stats.pending}</div>
                <div className="text-gray-600">Pending</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="text-5xl font-bold text-green-600 mb-2">{stats.resolved}</div>
                <div className="text-gray-600">Resolved</div>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
              <h3 className="font-bold text-blue-900 mb-2">Welcome to Command Center</h3>
              <p className="text-blue-800">
                Use the menu (☰) to access wildfire monitoring, damage assessment, volunteer management, and more.
              </p>
            </div>
          </div>
        )}

        {/* Wildfire Monitor Tab */}
        {activeTab === 'wildfires' && <WildfireMonitor />}

        {/* Verify Proofs Tab */}
        {activeTab === 'verify' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-lg shadow-lg">
              <h2 className="text-3xl font-bold mb-2">✅ Verify Completion Proofs</h2>
              <p className="opacity-90">Review volunteer-submitted evidence before marking incidents as resolved</p>
            </div>

            {(() => {
              const pendingIncidents = incidents.filter(i => i.status === 'Pending Verification');

              if (pendingIncidents.length === 0) {
                return (
                  <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                    <MdVerifiedUser className="text-8xl text-green-500 mx-auto mb-4" />
                    <p className="text-2xl font-bold text-gray-700 mb-2">All Clear!</p>
                    <p className="text-gray-500">No proofs pending verification</p>
                  </div>
                );
              }

              return pendingIncidents.map(incident => (
                <div key={incident._id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{incident.title}</h3>
                      <p className="text-gray-600 mb-2">{incident.description}</p>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${incident.severity === 'High' ? 'bg-red-100 text-red-700' :
                        incident.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                        {incident.severity} Severity
                      </span>
                    </div>
                    <span className="px-4 py-2 rounded-full text-sm font-bold bg-orange-100 text-orange-700">
                      ⏳ Pending Verification
                    </span>
                  </div>

                  {/* Assigned Team */}
                  {incident.assignedTo && incident.assignedTo.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <span className="font-bold text-blue-800">Assigned Team: </span>
                      {incident.assignedTo.map((v, idx) => (
                        <span key={v._id || idx} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm mr-2">
                          {v.name || v.email || 'Unknown'}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Submitted Proofs */}
                  <div className="mb-4">
                    <h4 className="font-bold text-lg mb-3">📸 Submitted Proofs ({incident.completionProofs?.length || 0})</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {incident.completionProofs?.map((proof, idx) => (
                        <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                          <img
                            src={proof.imageUrl}
                            alt={`Proof ${idx + 1}`}
                            className="w-full h-64 object-cover rounded-lg mb-3 cursor-pointer hover:opacity-90 hover:shadow-lg transition-all"
                            onClick={() => setLightboxImage(proof.imageUrl)}
                          />
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold">{proof.volunteerName || 'Unknown'}</span>
                            <span className="text-gray-500">
                              {new Date(proof.submittedAt).toLocaleString()}
                            </span>
                          </div>
                          {proof.notes && (
                            <p className="text-gray-600 text-sm mt-2 italic">"{proof.notes}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={async () => {
                        if (confirm('Mark this incident as RESOLVED? This confirms the work is complete.')) {
                          try {
                            await updateIncidentStatus(incident._id, 'Resolved');
                            alert('Incident marked as Resolved!');
                            fetchIncidents();
                          } catch (err) {
                            alert('Failed to update status');
                          }
                        }
                      }}
                      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg"
                    >
                      ✅ Approve & Resolve
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('Reject proof and send back to volunteers?')) {
                          try {
                            await updateIncidentStatus(incident._id, 'In Progress');
                            alert('Proof rejected. Incident sent back to volunteers.');
                            fetchIncidents();
                          } catch (err) {
                            alert('Failed to update status');
                          }
                        }
                      }}
                      className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg"
                    >
                      ❌ Reject & Return
                    </button>
                  </div>
                </div>
              ));
            })()}

            {/* Resolved Incidents History */}
            <div className="mt-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <MdCheckCircle className="text-green-500" />
                Resolved Incidents History
              </h3>
              {(() => {
                const resolvedIncidents = incidents.filter(i =>
                  i.status === 'Resolved' && i.completionProofs && i.completionProofs.length > 0
                );

                if (resolvedIncidents.length === 0) {
                  return (
                    <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-500">
                      No resolved incidents with proofs yet
                    </div>
                  );
                }

                return (
                  <div className="grid gap-4">
                    {resolvedIncidents.map(incident => (
                      <div key={incident._id} className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="text-xl font-bold">{incident.title}</h4>
                            <p className="text-gray-600 text-sm">{incident.description}</p>
                          </div>
                          <span className="px-4 py-2 rounded-full text-sm font-bold bg-green-100 text-green-700">
                            ✅ Resolved
                          </span>
                        </div>

                        {/* Assigned Team */}
                        {incident.assignedTo && incident.assignedTo.length > 0 && (
                          <div className="mb-3 text-sm">
                            <span className="font-semibold">Team: </span>
                            {incident.assignedTo.map((v, idx) => (
                              <span key={v._id || idx} className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs mr-1">
                                {v.name || v.email || 'Unknown'}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Proof Photos */}
                        <div className="flex gap-3 overflow-x-auto pb-2">
                          {incident.completionProofs?.map((proof, idx) => (
                            <img
                              key={idx}
                              src={proof.imageUrl}
                              alt={`Proof ${idx + 1}`}
                              className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 hover:shadow-lg flex-shrink-0 transition-all"
                              onClick={() => setLightboxImage(proof.imageUrl)}
                              title={`By ${proof.volunteerName} - ${new Date(proof.submittedAt).toLocaleString()}`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Volunteer Requests Tab */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">👥 Volunteer Role Requests</h2>
            {requests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending requests</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(req => (
                      <tr key={req._id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{req.userId?.name}</td>
                        <td className="p-3">{req.userId?.email}</td>
                        <td className="p-3">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                            {req.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleApprove(req._id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(req._id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Broadcast Alert Tab */}
        {activeTab === 'alerts' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">🚨 Broadcast Emergency Alert</h2>
            <div className="max-w-2xl">
              <label className="block mb-2 font-semibold">Alert Message</label>
              <textarea
                value={alertMsg}
                onChange={(e) => setAlertMsg(e.target.value)}
                className="w-full border rounded-lg p-4 mb-4 h-32"
                placeholder="Enter emergency alert message..."
              />
              <button
                onClick={handleBroadcast}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg"
              >
                📢 Broadcast Alert
              </button>
            </div>
          </div>
        )}

        {/* Incident Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">🛠️ Assign Incidents to Volunteers</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-semibold">Select Incident</label>
                <select
                  value={selectedIncident || ''}
                  onChange={(e) => setSelectedIncident(e.target.value)}
                  className="w-full border rounded-lg p-3"
                >
                  <option value="">-- Select Incident --</option>
                  {incidents.filter(i => !i.assignedTo || i.assignedTo.length === 0).map(inc => (
                    <option key={inc._id} value={inc._id}>
                      {inc.severity === 'High' ? '🔴 ' : inc.severity === 'Medium' ? '🟡 ' : '🟢 '}
                      {inc.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-semibold">
                  Select Volunteers ({selectedVolunteers.length} selected)
                </label>
                <div className="border rounded-lg p-3 max-h-64 overflow-y-auto bg-gray-50">
                  {(() => {
                    // Get IDs of volunteers who are already assigned to active (non-resolved) incidents
                    const busyVolunteerIds = incidents
                      .filter(inc => inc.assignedTo && inc.assignedTo.length > 0 && inc.status !== 'Resolved')
                      .flatMap(inc => inc.assignedTo.map(v => v._id || v));

                    // Filter out busy volunteers
                    const availableVolunteers = users.filter(u =>
                      u.role === 'volunteer' && !busyVolunteerIds.includes(u._id)
                    );

                    if (availableVolunteers.length === 0) {
                      return (
                        <p className="text-gray-500 text-center py-4">
                          No available volunteers (all are assigned to active incidents)
                        </p>
                      );
                    }

                    return availableVolunteers.map(vol => (
                      <label
                        key={vol._id}
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-blue-50 transition-colors ${selectedVolunteers.includes(vol._id) ? 'bg-blue-100 border border-blue-300' : ''
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedVolunteers.includes(vol._id)}
                          onChange={() => toggleVolunteerSelection(vol._id)}
                          className="w-5 h-5 accent-blue-600"
                        />
                        <span className="font-medium">{vol.name}</span>
                        <span className="text-sm text-gray-500">({vol.email})</span>
                      </label>
                    ));
                  })()}
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={handleAssign}
                disabled={!selectedIncident || selectedVolunteers.length === 0}
                className={`px-8 py-3 rounded-lg font-bold shadow-lg transition-colors ${!selectedIncident || selectedVolunteers.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
              >
                ✅ Assign {selectedVolunteers.length > 0 ? `${selectedVolunteers.length} Volunteer(s)` : 'Incident'}
              </button>
              {selectedVolunteers.length > 0 && (
                <button
                  onClick={() => setSelectedVolunteers([])}
                  className="text-red-600 hover:text-red-700 font-semibold"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">⚙️ User Management</h2>
            {users.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No users found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Role</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{u.name}</td>
                        <td className="p-3">{u.email}</td>
                        <td className="p-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            className="border rounded px-2 py-1 capitalize"
                          >
                            <option value="public">Public</option>
                            <option value="volunteer">Volunteer</option>
                            <option value="coordinator">Coordinator</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
            onClick={() => setLightboxImage(null)}
          >
            ✕
          </button>
          <img
            src={lightboxImage}
            alt="Full size proof"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 text-white text-center">Click anywhere to close</p>
        </div>
      )}
    </div>
  );
}
