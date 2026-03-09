import React, { useState } from 'react';
import { createIncident } from '../services/api';
import { MdAddAlert, MdLocationOn } from 'react-icons/md';
import CameraCapture from './CameraCapture';

export default function IncidentForm({ onAdd }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    severity: 'Low',
    location: { type: 'Point', coordinates: [77.1025, 28.7041] }, // Default: Delhi
    address: '',
    evidenceImage: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageCapture = (imageData) => {
    setForm(prev => ({ ...prev, evidenceImage: imageData }));
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    if (name === 'latitude' || name === 'longitude') {
      const newCoordinates = [...form.location.coordinates];
      if (name === 'longitude') newCoordinates[0] = parseFloat(value) || 0;
      if (name === 'latitude') newCoordinates[1] = parseFloat(value) || 0;
      setForm({
        ...form,
        location: { ...form.location, coordinates: newCoordinates }
      });
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log(`📍 Form Location Captured: Accuracy ${position.coords.accuracy}m`);
          setForm({
            ...form,
            location: {
              type: 'Point',
              coordinates: [position.coords.longitude, position.coords.latitude]
            }
          });
          setIsLocating(false);
        },
        (error) => {
          console.error("Location error:", error);
          alert("Could not get accurate location. Please ensure GPS is on.");
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createIncident(form);
      onAdd();
      setForm({
        title: '',
        description: '',
        severity: 'Low',
        location: { type: 'Point', coordinates: [77.1025, 28.7041] },
        address: '',
        evidenceImage: null
      });
    } catch (error) {
      console.error('Error creating incident:', error);
      alert('Failed to create incident. Please try again.');
    }
    setIsSubmitting(false);
  };

  return (
    <form className="bg-white shadow-lg rounded-lg p-6 border" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-4 text-orange-700 flex items-center">
        <MdAddAlert className="mr-2" />
        Report Fire / Emergency
      </h2>

      {/* Live Camera Feed Section */}
      <div className="mb-6 border-b pb-6">
        <h3 className="block text-sm font-bold text-gray-700 mb-2">📸 Live Evidence (Optional)</h3>
        <p className="text-xs text-gray-500 mb-2">Click below to start camera. Validates the incident.</p>
        <CameraCapture onCapture={handleImageCapture} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Incident Type (e.g., Wildfire, Structural Fire, Hazmat)"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            required
          />
        </div>

        <div className="md:col-span-2">
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Detailed description of the incident..."
            rows="3"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            required
          />
        </div>

        <div>
          <select
            name="severity"
            value={form.severity}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="Low">🟢 Low Priority</option>
            <option value="Medium">🟡 Medium Priority</option>
            <option value="High">🔴 High Priority</option>
          </select>
        </div>

        <div>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Address or Location Description"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
          <input
            type="number"
            name="longitude"
            value={form.location.coordinates[0]}
            onChange={handleLocationChange}
            step="any"
            placeholder="77.1025"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
          <input
            type="number"
            name="latitude"
            value={form.location.coordinates[1]}
            onChange={handleLocationChange}
            step="any"
            placeholder="28.7041"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLocating}
          className={`${isLocating ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors duration-200`}
        >
          <MdLocationOn />
          {isLocating ? '📡 Locating...' : 'Use My Location'}
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors duration-200"
        >
          <MdAddAlert />
          {isSubmitting ? 'Reporting...' : 'Report Incident'}
        </button>
      </div>
    </form>
  );
}
