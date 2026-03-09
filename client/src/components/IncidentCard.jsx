import React from 'react';
import { formatDate } from '../utils/formatDate';
import { MdWarning, MdCheckCircle, MdError, MdReport, MdDelete, MdDone, MdLocationOn } from 'react-icons/md';

const severityIcons = {
  Low: <MdCheckCircle className="text-green-500 inline mr-1" />,
  Medium: <MdWarning className="text-yellow-500 inline mr-1" />,
  High: <MdError className="text-red-500 inline mr-1" />,
};

const statusColors = {
  Reported: 'bg-blue-100 text-blue-700 border-blue-200',
  'In Progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Resolved: 'bg-green-100 text-green-700 border-green-200',
};

const severityColors = {
  Low: 'border-green-400',
  Medium: 'border-yellow-400',
  High: 'border-red-400'
};

export default function IncidentCard({ incident, userRole, onResolve, onDelete, disabled }) {
  return (
    <div className={`bg-white shadow-lg rounded-lg p-6 border-l-4 ${severityColors[incident.severity]} hover:shadow-2xl transition-shadow duration-300`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-xl font-semibold flex items-center mb-2">
            {severityIcons[incident.severity]}
            {incident.title}
          </h3>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${statusColors[incident.status]}`}>
            <MdReport className="inline mr-1" />
            {incident.status}
          </span>
        </div>

        {/* Role-based action buttons */}
        {(userRole === 'admin' || userRole === 'coordinator') && (
          <div className="flex gap-3 flex-wrap">
            {/* View Location Button */}
            <a
              href={`https://www.google.com/maps?q=${incident.location.coordinates[1]},${incident.location.coordinates[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg text-base font-semibold flex items-center gap-2 transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <MdLocationOn className="text-lg" /> View Location
            </a>
            {incident.status !== 'Resolved' && (
              <button
                onClick={() => onResolve(incident._id)}
                disabled={disabled}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-lg text-base font-semibold flex items-center gap-2 transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <MdDone className="text-lg" /> Resolve
              </button>
            )}
            {userRole === 'admin' && (
              <button
                onClick={() => onDelete(incident._id)}
                disabled={disabled}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-lg text-base font-semibold flex items-center gap-2 transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <MdDelete className="text-lg" /> Delete
              </button>
            )}
          </div>
        )}
      </div>

      <p className="text-gray-700 mb-4">{incident.description}</p>

      {incident.evidenceImage && (
        <div className="mb-4">
          <img
            src={incident.evidenceImage}
            alt="Incident Evidence"
            className="w-full max-h-96 object-contain rounded-md border bg-gray-100"
          />
        </div>
      )}

      {/* Location info */}
      {incident.address && (
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <MdLocationOn className="mr-1" />
          {incident.address}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Reported {formatDate(incident.reportedAt)}</span>
        <span className="font-semibold text-gray-600">Priority: {incident.severity}</span>
      </div>

      {/* Coordinates for debugging */}
      <div className="text-xs text-gray-400 mt-2">
        Location: {incident.location.coordinates[1].toFixed(4)}, {incident.location.coordinates[0].toFixed(4)}
      </div>
    </div>
  );
}
