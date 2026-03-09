import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MdVolunteerActivism, MdEmail, MdWarning, MdLocationOn } from 'react-icons/md';

export default function DonationFeed() {
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token, user } = useAuth();
    const [contactVisible, setContactVisible] = useState({});

    useEffect(() => {
        fetchDonations();
    }, []);

    const fetchDonations = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/damage-assessment/community/donation-feed', {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("Current User:", user);
            console.log("Donations from API:", res.data);

            // Filter out own requests: Show only others' requests
            const othersRequests = res.data.filter(item => {
                // Get Victim ID (Source)
                const itemUserId = item.userId?._id || item.userId?.id || item.userId;

                // Get Current Logged-in User ID
                const currentUserId = user?.id || user?._id;

                // If we can't identify the current user, show everything (safe fallback)
                if (!currentUserId || !itemUserId) return true;

                // FORCE TO STRING and compare - Bulletproof check
                return itemUserId.toString() !== currentUserId.toString();
            });

            console.log("Filtered Donations (Others only):", othersRequests);
            setDonations(othersRequests);
        } catch (error) {
            console.error('Failed to fetch donations:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleContact = (id) => {
        setContactVisible(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const getSeverityColor = (prediction) => {
        switch (prediction) {
            case 'severe': return 'bg-red-100 text-red-800 border-red-200';
            case 'moderate': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'mild': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center md:text-left">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center md:justify-start">
                        <MdVolunteerActivism className="mr-2 text-red-500" />
                        Community Relief Feed
                    </h1>
                    <p className="text-gray-600">
                        Connect directly with verified disaster victims and offer your support.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                    </div>
                ) : donations.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <MdVolunteerActivism size={64} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Active Requests</h3>
                        <p className="text-gray-500">There are currently no open donation requests from other community members.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {donations.map((item) => (
                            <div key={item._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 flex flex-col">
                                {/* Image Overlay with Badge */}
                                <div className="relative h-48">
                                    <img
                                        src={`http://localhost:5000${item.imageUrl}`}
                                        alt="Damage"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold border ${getSeverityColor(item.prediction)} uppercase shadow-sm`}>
                                        {item.prediction} Damage
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                        <p className="text-white font-medium flex items-center">
                                            <MdLocationOn className="mr-1" />
                                            {item.affectedArea} Sq. Ft. Affected
                                        </p>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex-grow">
                                    {/* Cost Info */}
                                    <div className="mb-4">
                                        <p className="text-xs text-uppercase text-gray-500 font-semibold tracking-wider">ESTIMATED REPAIR COST</p>
                                        <p className="text-2xl font-bold text-gray-800">
                                            ₹{item.estimatedCosts.repairCost.toLocaleString('en-IN')}
                                        </p>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                                            <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${Math.min(item.confidence, 100)}%` }}></div>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">AI Confidence: {item.confidence.toFixed(1)}%</p>
                                    </div>

                                    {/* Verified Report Link */}
                                    {item.donation?.reportUrl && (
                                        <div className="mb-4">
                                            <button
                                                onClick={() => window.open(`http://localhost:5000${item.donation.reportUrl}`, '_blank')}
                                                className="w-full flex items-center justify-center space-x-2 bg-green-50 hover:bg-green-100 text-green-700 font-bold py-2 px-4 rounded-lg border border-green-200 transition-all transform hover:scale-[1.02]"
                                            >
                                                <span>📄</span>
                                                <span>View Verified Report</span>
                                            </button>
                                            <p className="text-[10px] text-center text-green-600 mt-1 italic">
                                                * This report is verified by our AI for accuracy
                                            </p>
                                        </div>
                                    )}

                                    {/* User Info & Contact */}
                                    <div className="mt-auto pt-4 border-t border-gray-100">
                                        {!contactVisible[item._id] ? (
                                            <button
                                                onClick={() => toggleContact(item._id)}
                                                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center border border-blue-200"
                                            >
                                                Offer Help
                                            </button>
                                        ) : (
                                            <div className="bg-gray-50 p-3 rounded-lg text-center animate-fadeIn">
                                                <p className="text-xs text-gray-500 mb-1">Contact Victim Directly</p>
                                                <div className="flex items-center justify-center text-gray-800 font-medium">
                                                    <MdEmail className="mr-2 text-blue-600" />
                                                    {item.userId?.email || 'Start Chat'}
                                                </div>
                                                <p className="text-xs text-blue-600 mt-2 cursor-pointer hover:underline" onClick={() => window.location.href = `mailto:${item.userId?.email}`}>
                                                    Click to Email
                                                </p>
                                            </div>
                                        )}
                                        <p className="text-xs text-center text-gray-400 mt-3">
                                            Posted {new Date(item.donation.requestedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
