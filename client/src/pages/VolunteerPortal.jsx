import React, { useState, useEffect, useRef } from 'react';
import { getIncidents, updateIncidentStatus, getAssignedIncidents, submitCompletionProof } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  MdMenu, MdClose, MdPerson, MdLogout, MdAssignment, MdLocationOn,
  MdUpdate, MdLocalFireDepartment, MdCheckCircle, MdCameraAlt, MdUpload, MdSend
} from 'react-icons/md';
import AlertNotification from '../components/AlertNotification';

export default function VolunteerPortal() {
  const [activeTab, setActiveTab] = useState('assigned');
  const [assignedIncidents, setAssignedIncidents] = useState([]);
  const [availableIncidents, setAvailableIncidents] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  // Proof submission state
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedIncidentForProof, setSelectedIncidentForProof] = useState(null);
  const [proofImage, setProofImage] = useState(null);
  const [proofNotes, setProofNotes] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignedRes, allRes] = await Promise.all([
        getAssignedIncidents(),
        getIncidents()
      ]);
      setAssignedIncidents(assignedRes.data);
      setAvailableIncidents(allRes.data.filter(i => (!i.assignedTo || i.assignedTo.length === 0) && i.status !== 'Resolved'));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleStatusUpdate = async (incidentId, newStatus) => {
    try {
      await updateIncidentStatus(incidentId, newStatus);
      alert('Status updated successfully!');
      fetchData();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  // Open proof submission modal
  const openProofModal = (incident) => {
    setSelectedIncidentForProof(incident);
    setShowProofModal(true);
    setProofImage(null);
    setProofNotes('');
  };

  // Handle file upload
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Capture photo from camera
  const startCamera = async () => {
    setShowCamera(true);
    // Use timeout to ensure video element is rendered
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera access error:', err);
        alert('Could not access camera. Please ensure you are on HTTPS and have granted permissions.');
        setShowCamera(false);
      }
    }, 100);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setProofImage(imageData);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  // Submit proof
  const handleSubmitProof = async () => {
    if (!proofImage) {
      alert('Please capture or upload a photo');
      return;
    }
    setSubmittingProof(true);
    try {
      await submitCompletionProof(selectedIncidentForProof._id, proofImage, proofNotes);
      alert('Proof submitted successfully! Coordinator will review and verify.');
      setShowProofModal(false);
      setSelectedIncidentForProof(null);
      setProofImage(null);
      setProofNotes('');
      fetchData();
    } catch (error) {
      alert('Failed to submit proof: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmittingProof(false);
    }
  };

  const getDirections = (incident) => {
    console.log('📍 Full incident data:', JSON.stringify(incident, null, 2));

    // Extract destination coordinates
    let destLat, destLng;
    if (incident.location?.coordinates && Array.isArray(incident.location.coordinates)) {
      destLng = parseFloat(incident.location.coordinates[0]);
      destLat = parseFloat(incident.location.coordinates[1]);
    } else if (incident.coordinates) {
      destLng = parseFloat(incident.coordinates[0]);
      destLat = parseFloat(incident.coordinates[1]);
    } else if (incident.latitude) {
      destLat = parseFloat(incident.latitude);
      destLng = parseFloat(incident.longitude);
    } else {
      alert('Location coordinates not available for this incident.');
      return;
    }

    setIsLocating(true);

    // FETCH MANUAL GPS ORIGIN FOR 100% ACCURACY
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const originLat = position.coords.latitude;
          const originLng = position.coords.longitude;
          console.log(`✅ Exact origin fetched: ${originLat}, ${originLng}`);

          const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
          window.open(mapsUrl, '_blank');
          setIsLocating(false);
        },
        (error) => {
          console.warn('⚠️ Manual GPS failed, falling back to auto:', error);
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
          window.open(mapsUrl, '_blank');
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
      window.open(mapsUrl, '_blank');
      setIsLocating(false);
    }
  };

  const menuItems = [
    { id: 'assigned', label: 'My Assignments', icon: MdAssignment },
    { id: 'available', label: 'Available Tasks', icon: MdLocationOn },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
      <AlertNotification />

      {/* Top Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Hamburger Menu */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white transition-colors shadow-lg"
          >
            {sidebarOpen ? <MdClose className="text-2xl" /> : <MdMenu className="text-2xl" />}
          </button>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            👨‍🚒 Volunteer Portal
          </h1>

          {/* Quick Action */}
          <a
            href="/dashboard"
            className="hidden sm:flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-lg"
          >
            <MdLocalFireDepartment className="text-xl" />
            <span className="hidden md:inline">Dashboard</span>
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
          <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Volunteer Menu</h2>
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
                    <p className="text-sm opacity-90">Volunteer</p>
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
                    ? 'bg-yellow-100 text-yellow-700 font-semibold shadow-md'
                    : 'hover:bg-gray-100 text-gray-700'
                    }`}
                >
                  <Icon className="text-2xl" />
                  <span>{item.label}</span>
                  {item.id === 'assigned' && assignedIncidents.length > 0 && (
                    <span className="ml-auto bg-red-500 text-white rounded-full px-2 py-1 text-xs font-bold">
                      {assignedIncidents.length}
                    </span>
                  )}
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

        {/* My Assignments Tab */}
        {activeTab === 'assigned' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-6 rounded-lg shadow-lg">
              <h2 className="text-3xl font-bold mb-2">👨‍🚒 My Assigned Tasks</h2>
              <p className="opacity-90">Tasks assigned to you by coordinators</p>
            </div>

            {assignedIncidents.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <MdCheckCircle className="text-8xl text-green-500 mx-auto mb-4" />
                <p className="text-2xl font-bold text-gray-700 mb-2">No Active Assignments</p>
                <p className="text-gray-500">Check back later for new tasks</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {assignedIncidents.map((incident) => (
                  <div key={incident._id} className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-2">{incident.title}</h3>
                        <p className="text-gray-600 mb-4">{incident.description}</p>

                        <div className="grid md:grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <MdLocationOn className="text-red-500" />
                            <span>{incident.address || 'Location unknown'}</span>
                          </div>
                          <div>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${incident.severity === 'High' ? 'bg-red-100 text-red-700' :
                              incident.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                              {incident.severity} Severity
                            </span>
                          </div>
                        </div>

                        {/* Team Members Section */}
                        {incident.assignedTo && incident.assignedTo.length > 1 && (
                          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <MdPerson className="text-blue-600 text-xl" />
                              <span className="font-bold text-blue-800">Team Members ({incident.assignedTo.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {incident.assignedTo.map((volunteer, idx) => (
                                <span
                                  key={volunteer._id || idx}
                                  className={`px-3 py-1 rounded-full text-sm font-semibold ${volunteer._id === user?.id
                                    ? 'bg-green-500 text-white'
                                    : 'bg-blue-100 text-blue-800'
                                    }`}
                                >
                                  {volunteer.name || volunteer.email || 'Unknown'}
                                  {volunteer._id === user?.id && ' (You)'}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-blue-600 mt-2">💡 Coordinate with your team members for this incident</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => getDirections(incident)}
                            disabled={isLocating}
                            className={`flex items-center gap-2 ${isLocating ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg`}
                          >
                            <MdLocationOn />
                            {isLocating ? '📡 Locating...' : 'Get Directions'}
                          </button>

                          {incident.status === 'Reported' && (
                            <button
                              onClick={() => handleStatusUpdate(incident._id, 'In Progress')}
                              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg"
                            >
                              <MdUpdate />
                              Start Task
                            </button>
                          )}

                          {incident.status === 'In Progress' && (
                            <button
                              onClick={() => openProofModal(incident)}
                              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg"
                            >
                              <MdCameraAlt />
                              Submit Completion Proof
                            </button>
                          )}

                          {incident.status === 'Pending Verification' && (
                            <span className="flex items-center gap-2 bg-orange-100 text-orange-700 px-6 py-3 rounded-lg font-bold">
                              ⏳ Awaiting Coordinator Verification
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="ml-4">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${incident.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                          incident.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                          {incident.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Available Tasks Tab */}
        {activeTab === 'available' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
              <h2 className="text-3xl font-bold mb-2">📍 Available Tasks</h2>
              <p className="opacity-90">Unassigned incidents that need attention</p>
            </div>

            {availableIncidents.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <MdCheckCircle className="text-8xl text-green-500 mx-auto mb-4" />
                <p className="text-2xl font-bold text-gray-700 mb-2">No Available Tasks</p>
                <p className="text-gray-500">All incidents are currently assigned</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {availableIncidents.map((incident) => (
                  <div key={incident._id} className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-bold mb-2">{incident.title}</h3>
                    <p className="text-gray-600 mb-3">{incident.description}</p>
                    <div className="flex items-center gap-4 text-sm mb-3">
                      <MdLocationOn className="text-red-500" />
                      <span>{incident.address || 'Location data'}</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${incident.severity === 'High' ? 'bg-red-100 text-red-700' :
                        incident.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                        {incident.severity} Severity
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 italic">
                      Contact coordinator to get assigned to this task
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Proof Submission Modal */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-xl">
              <h3 className="text-2xl font-bold">📸 Submit Completion Proof</h3>
              <p className="opacity-90">Provide photo evidence that the work is completed</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Incident Info */}
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="font-bold text-lg">{selectedIncidentForProof?.title}</p>
                <p className="text-gray-600 text-sm">{selectedIncidentForProof?.description}</p>
              </div>

              {/* Camera/Upload Options */}
              {!proofImage && !showCamera && (
                <div className="flex gap-4">
                  <button
                    onClick={startCamera}
                    className="flex-1 flex flex-col items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 p-6 rounded-lg transition-colors border-2 border-blue-200"
                  >
                    <MdCameraAlt className="text-4xl" />
                    <span className="font-bold">Take Photo</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex flex-col items-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 p-6 rounded-lg transition-colors border-2 border-green-200"
                  >
                    <MdUpload className="text-4xl" />
                    <span className="font-bold">Upload File</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}

              {/* Camera Preview */}
              {showCamera && (
                <div className="space-y-4">
                  <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-black" />
                  <div className="flex gap-4">
                    <button
                      onClick={capturePhoto}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold"
                    >
                      📷 Capture
                    </button>
                    <button
                      onClick={stopCamera}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Image Preview */}
              {proofImage && (
                <div className="space-y-4">
                  <img src={proofImage} alt="Proof" className="w-full rounded-lg shadow-lg" />
                  <button
                    onClick={() => setProofImage(null)}
                    className="text-red-600 hover:text-red-700 font-semibold"
                  >
                    ❌ Remove & Retake
                  </button>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block font-semibold mb-2">Notes (optional)</label>
                <textarea
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  placeholder="Describe what was done..."
                  className="w-full border rounded-lg p-3 h-24"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={handleSubmitProof}
                  disabled={!proofImage || submittingProof}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold transition-colors ${!proofImage || submittingProof
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                >
                  <MdSend />
                  {submittingProof ? 'Submitting...' : 'Submit Proof'}
                </button>
                <button
                  onClick={() => {
                    setShowProofModal(false);
                    stopCamera();
                  }}
                  className="px-6 py-3 rounded-lg font-bold bg-gray-200 hover:bg-gray-300 text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
