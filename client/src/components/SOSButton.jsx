import React, { useState } from 'react';
import { createIncident } from '../services/api';
import { MdEmergencyShare, MdCameraAlt, MdClose } from 'react-icons/md';
import CameraCapture from './CameraCapture';
import { useAuth } from '../context/AuthContext';

export default function SOSButton({ onTrigger }) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, locating, sending, success, error
    const [showCamera, setShowCamera] = useState(false);
    const { user } = useAuth();

    const startSOSProcess = () => {
        if (!confirm('Are you in imminent danger? This will send your location to emergency services immediately.')) {
            return;
        }
        setShowCamera(true);
    };

    const handleSendSOS = (evidenceImage = null) => {
        setShowCamera(false);
        setLoading(true);
        setStatus('locating');

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    console.log(`📍 SOS Location Captured: [${position.coords.latitude}, ${position.coords.longitude}] with accuracy: ${position.coords.accuracy}m`);
                    setStatus('sending');
                    try {
                        const incidentData = {
                            title: `🆘 SOS EMERGENCY - ${user?.name || 'Unknown User'}`,
                            description: `User "${user?.name || 'Unknown'}" (${user?.email || 'No email'}) initiated SOS signal. Immediate assistance required. HIGH PRIORITY.`,
                            severity: 'High',
                            status: 'Reported',
                            location: {
                                type: 'Point',
                                coordinates: [position.coords.longitude, position.coords.latitude]
                            },
                            address: 'Current GPS Location',
                            evidenceImage,
                            reportedBy: user?.name || 'Anonymous'
                        };

                        await createIncident(incidentData);
                        setStatus('success');
                        if (onTrigger) onTrigger();

                        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);

                    } catch (error) {
                        console.error('SOS Failed:', error);
                        setStatus('error');
                    } finally {
                        setLoading(false);
                        setTimeout(() => setStatus('idle'), 5000);
                    }
                },
                (error) => {
                    console.error('Location Error:', error);
                    let msg = 'Could not get your location.';
                    if (error.code === 1) msg = 'Location access denied. Please enable GPS in your browser/settings.';
                    if (error.code === 3) msg = 'Location request timed out. Trying to get a lock...';

                    alert(msg + ' SOS failed.');
                    setStatus('error');
                    setLoading(false);
                },
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
            );
        } else {
            alert('Geolocation is not supported. Cannot send SOS.');
            setLoading(false);
        }
    };

    return (
        <>
            {/* Fixed Floating SOS Button - Bottom Right */}
            <div className="fixed bottom-8 right-8 z-50">
                <div className="relative">
                    {/* Multiple Pulsing Rings */}
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                    <div className="absolute -inset-4 bg-red-400 rounded-full animate-pulse opacity-50"></div>
                    <div className="absolute -inset-8 bg-red-300 rounded-full animate-ping opacity-25" style={{ animationDuration: '2s' }}></div>

                    {/* Main SOS Button */}
                    <button
                        onClick={startSOSProcess}
                        disabled={loading}
                        className={`
                            relative w-32 h-32 sm:w-36 sm:h-36 rounded-full shadow-2xl 
                            transition-all duration-300 transform 
                            hover:scale-110 active:scale-95
                            flex flex-col items-center justify-center
                            border-4 border-white
                            ${status === 'success' ? 'bg-gradient-to-br from-green-500 to-green-700' :
                                status === 'error' ? 'bg-gradient-to-br from-gray-700 to-gray-900' :
                                    loading ? 'bg-gradient-to-br from-orange-500 to-orange-700 animate-pulse' :
                                        'bg-gradient-to-br from-red-500 to-red-700'
                            }
                        `}
                    >
                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-red-300 to-red-500 rounded-full opacity-0 group-hover:opacity-75 blur-2xl transition-opacity duration-300"></div>

                        {/* Icon */}
                        <MdEmergencyShare className={`text-6xl sm:text-7xl text-white mb-2 ${!loading && 'animate-bounce'}`} style={{ animationDuration: '1s' }} />

                        {/* Text */}
                        <span className="text-3xl sm:text-4xl font-black text-white tracking-widest drop-shadow-2xl">
                            SOS
                        </span>

                        {/* Loading Spinner */}
                        {loading && (
                            <div className="absolute inset-0 rounded-full border-t-4 border-white animate-spin"></div>
                        )}
                    </button>

                    {/* Floating Label */}
                    <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        <div className="bg-red-600 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm animate-bounce">
                            {status === 'idle' && '🆘 EMERGENCY'}
                            {status === 'locating' && '📍 LOCATING...'}
                            {status === 'sending' && '📡 SENDING...'}
                            {status === 'success' && '✅ HELP COMING!'}
                            {status === 'error' && '❌ CALL 911'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Camera Modal */}
            {showCamera && (
                <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-bold text-red-600">📸 Add Photo Evidence?</h3>
                            <button
                                onClick={() => setShowCamera(false)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <MdClose className="text-2xl" />
                            </button>
                        </div>

                        <CameraCapture onCapture={(img) => {
                            if (img) handleSendSOS(img);
                        }} />

                        <div className="text-center mt-6 space-y-3">
                            <p className="text-sm text-gray-600">Taking a photo helps emergency responders</p>
                            <button
                                onClick={() => handleSendSOS(null)}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg"
                            >
                                ⚡ Skip & Send SOS Immediately
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
