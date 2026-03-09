import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { MdCameraAlt, MdCheck, MdRefresh, MdClose } from 'react-icons/md';

export default function CameraCapture({ onCapture }) {
    const webcamRef = useRef(null);
    const [facingMode, setFacingMode] = useState('user');
    const [image, setImage] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [error, setError] = useState(null);

    const videoConstraints = {
        facingMode: facingMode
    };

    const handleCapture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                setImage(imageSrc);
                onCapture(imageSrc);
                setIsCameraOpen(false);
                setError(null);
            }
        }
    }, [webcamRef, onCapture]);

    const handleRetake = () => {
        setImage(null);
        onCapture(null);
        setIsCameraOpen(true);
        setError(null);
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    const handleUserMediaError = (err) => {
        console.error("Webcam Error:", err);
        setError("Could not access camera. Please check browser permissions.");
    };

    return (
        <div className="w-full mb-4">
            {error && <div className="text-red-500 mb-2 font-bold text-center bg-red-50 p-2 rounded">{error}</div>}

            {!isCameraOpen && !image && (
                <button
                    type="button"
                    onClick={() => { setError(null); setIsCameraOpen(true); }}
                    className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors w-full justify-center border-2 border-dashed border-gray-400"
                >
                    <MdCameraAlt className="text-xl" />
                    Take Photo Evidence
                </button>
            )}

            {isCameraOpen && (
                <div className="relative bg-black rounded-lg overflow-hidden flex items-center justify-center">
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        onUserMedia={() => setError(null)}
                        onUserMediaError={handleUserMediaError}
                        className="w-full h-64 object-cover"
                        // Force internal video to play inline
                        playsInline={true}
                    />

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-10">
                        <button
                            type="button"
                            onClick={toggleCamera}
                            className="bg-gray-800/80 text-white rounded-full p-3 absolute left-4 bottom-2 backdrop-blur-sm"
                            title="Flip Camera"
                        >
                            <MdRefresh className="text-xl" />
                        </button>

                        <button
                            type="button"
                            onClick={handleCapture}
                            className="bg-white rounded-full p-4 shadow-lg hover:scale-110 transition-transform border-4 border-gray-200"
                        >
                            <div className="w-4 h-4 bg-red-600 rounded-full" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsCameraOpen(false)}
                            className="bg-gray-800/80 text-white rounded-full p-2 absolute right-4 bottom-2 backdrop-blur-sm"
                        >
                            <MdClose />
                        </button>
                    </div>
                </div>
            )}

            {image && !isCameraOpen && (
                <div className="relative">
                    <img src={image} alt="Evidence" className="w-full h-64 object-cover rounded-lg" />
                    <div className="absolute bottom-2 right-2 flex gap-2">
                        <button
                            type="button"
                            onClick={handleRetake}
                            className="bg-white text-gray-800 px-3 py-1 rounded shadow text-sm flex items-center gap-1"
                        >
                            <MdRefresh /> Retake
                        </button>
                        <div className="bg-green-500 text-white px-3 py-1 rounded shadow text-sm flex items-center gap-1">
                            <MdCheck /> Photo Added
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
