import React, { useState, useEffect } from 'react';
import { MdClose, MdFireExtinguisher } from 'react-icons/md';

export default function VerifiedFireAlert({ alert, onClose }) {
    const [show, setShow] = useState(false);
    const [audio] = useState(new Audio('/sounds/fire-alert.mp3'));

    useEffect(() => {
        if (alert) {
            // Show modal
            setShow(true);

            // Play alert sound
            audio.play().catch(err => console.log('Audio play failed:', err));

            // Auto-dismiss after 10 seconds
            const timer = setTimeout(() => {
                handleClose();
            }, 10000);

            return () => {
                clearTimeout(timer);
                audio.pause();
                audio.currentTime = 0;
            };
        }
    }, [alert, audio]);

    const handleClose = () => {
        setShow(false);
        setTimeout(() => {
            onClose();
        }, 300); // Wait for animation to complete
    };

    if (!alert || !show) return null;

    const { incident, wildfire, verification } = alert;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-gradient-to-br from-red-600 via-orange-600 to-red-700 rounded-3xl shadow-2xl max-w-2xl w-full mx-4 animate-scaleIn border-4 border-yellow-400">
                {/* Animated fire effect background */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl opacity-20">
                    <div className="absolute  w-full h-full bg-gradient-to-t from-transparent via-orange-500/30 to-yellow-500/30 animate-pulse" />
                </div>

                {/* Content */}
                <div className="relative p-8">
                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
                    >
                        <MdClose className="text-2xl" />
                    </button>

                    {/* Fire Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-yellow-400/50 blur-2xl rounded-full animate-pulse" />
                            <div className="relative text-9xl animate-bounce">🔥</div>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl sm:text-5xl font-black text-white text-center mb-4 drop-shadow-lg">
                        ACTIVE WILDFIRE
                        <br />
                        <span className="text-yellow-300">CONFIRMED</span>
                    </h1>

                    {/* Verification Badge */}
                    <div className="bg-green-500/90 backdrop-blur-sm rounded-2xl p-4 mb-6 border-2 border-green-300">
                        <div className="flex items-center justify-center gap-3 text-white">
                            <span className="text-4xl">🛰️</span>
                            <div className="text-left">
                                <p className="font-bold text-lg">VERIFIED via Satellite Thermal Scan</p>
                                <p className="text-sm text-green-100">Sentinel-2 SWIR Band 12 Analysis</p>
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 space-y-4 text-white">
                        {/* Location */}
                        <div>
                            <p className="text-sm text-yellow-200 font-semibold mb-1">LOCATION</p>
                            <p className="text-lg font-bold">{incident?.address || 'Unknown Location'}</p>
                            <p className="text-sm opacity-90">
                                {incident?.location?.coordinates[1].toFixed(4)}°N,{' '}
                                {incident?.location?.coordinates[0].toFixed(4)}°E
                            </p>
                        </div>

                        {/* Intensity */}
                        {verification?.intensity && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-yellow-200 font-semibold mb-1">INTENSITY</p>
                                    <p className={`text-2xl font-black ${verification.intensity === 'Severe' ? 'text-red-300' :
                                            verification.intensity === 'Medium' ? 'text-orange-300' :
                                                'text-yellow-300'
                                        }`}>
                                        {verification.intensity}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-yellow-200 font-semibold mb-1">CONFIDENCE</p>
                                    <p className="text-2xl font-black text-green-300">{verification.confidence}</p>
                                </div>
                            </div>
                        )}

                        {/* Satellite Data */}
                        <div className="pt-4 border-t border-white/20">
                            <p className="text-sm text-yellow-200 font-semibold mb-2">SATELLITE DATA</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="opacity-75">Source:</span>{' '}
                                    <span className="font-bold">{wildfire?.satellite || 'NASA FIRMS'}</span>
                                </div>
                                <div>
                                    <span className="opacity-75">FRP:</span>{' '}
                                    <span className="font-bold">{wildfire?.frp?.toFixed(1) || 'N/A'} MW</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={() => window.open('/incidents', '_blank')}
                            className="flex-1 bg-white hover:bg-gray-100 text-red-600 font-black py-4 rounded-xl text-lg transition-colors shadow-lg flex items-center justify-center gap-2"
                        >
                            <MdFireExtinguisher className="text-2xl" />
                            View Incident Details
                        </button>
                        <button
                            onClick={handleClose}
                            className="bg-white/20 hover:bg-white/30 text-white font-bold px-6 py-4 rounded-xl transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>

                    {/* Auto-dismiss indicator */}
                    <p className="text-center text-white/60 text-sm mt-4">
                        Auto-dismiss in 10 seconds
                    </p>
                </div>
            </div>

            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}
