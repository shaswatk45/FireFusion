import React from 'react';
import { useIncident } from '../context/IncidentContext';
import IncidentCard from '../components/IncidentCard';
import { useAuth } from '../context/AuthContext';
import { MdClose } from 'react-icons/md';

export default function IncidentsPage() {
    const { incidents, resolveIncident, removeIncident, loading } = useIncident();
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white shadow-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        📋 All Incidents
                    </h1>
                    <button
                        onClick={() => window.close()}
                        className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
                        title="Close Window"
                    >
                        <MdClose className="text-2xl" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <div className="text-4xl font-bold text-blue-600 mb-2">{incidents.length}</div>
                        <div className="text-gray-600">Total Incidents</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <div className="text-4xl font-bold text-orange-600 mb-2">
                            {incidents.filter(i => i.status === 'Reported').length}
                        </div>
                        <div className="text-gray-600">Pending</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <div className="text-4xl font-bold text-purple-600 mb-2">
                            {incidents.filter(i => i.status === 'In Progress').length}
                        </div>
                        <div className="text-gray-600">In Progress</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <div className="text-4xl font-bold text-green-600 mb-2">
                            {incidents.filter(i => i.status === 'Resolved').length}
                        </div>
                        <div className="text-gray-600">Resolved</div>
                    </div>
                </div>

                {/* Incidents List */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                        <span>📋</span> All Incidents
                    </h2>

                    {incidents.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-8xl mb-4">🟢</div>
                            <p className="text-2xl font-bold text-gray-700 mb-2">All Clear!</p>
                            <p className="text-gray-500">No incidents reported</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {incidents.map((incident) => (
                                <IncidentCard
                                    key={incident._id}
                                    incident={incident}
                                    userRole={user?.role}
                                    onResolve={resolveIncident}
                                    onDelete={removeIncident}
                                    disabled={loading}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
