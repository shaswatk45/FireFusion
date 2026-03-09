import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getIncidents,
  updateIncidentStatus,
  deleteIncident
} from '../services/api';
import { io } from 'socket.io-client';

const IncidentContext = createContext();
const socket = io();

export function IncidentProvider({ children }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await getIncidents();
      setIncidents(res.data);
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
    }
    setLoading(false);
  };

  const resolveIncident = async (incidentId) => {
    if (!window.confirm('Mark this incident as resolved?')) return;
    setLoading(true);
    try {
      const res = await updateIncidentStatus(incidentId, 'Resolved');
      setIncidents(prev =>
        prev.map(incident =>
          incident._id === incidentId ? res.data : incident
        )
      );
      alert('Incident resolved successfully!');
    } catch (error) {
      console.error('Error resolving incident:', error);
      alert(
        `Failed to resolve incident: ${error.response?.data?.message || error.message}`
      );
    }
    setLoading(false);
  };

  const removeIncident = async (incidentId) => {
    if (!window.confirm('Are you sure you want to permanently delete this incident?')) return;
    setLoading(true);
    try {
      await deleteIncident(incidentId);
      setIncidents(prev => prev.filter(incident => incident._id !== incidentId));
      alert('Incident deleted successfully!');
    } catch (error) {
      console.error('Error deleting incident:', error);
      alert(
        `Failed to delete incident: ${error.response?.data?.message || error.message}`
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIncidents();

    // Real-time updates
    socket.on('newIncident', (incident) => {
      setIncidents(prev => [incident, ...prev]);
    });
    socket.on('incidentUpdated', (updatedIncident) => {
      setIncidents(prev =>
        prev.map(incident =>
          incident._id === updatedIncident._id ? updatedIncident : incident
        )
      );
    });
    socket.on('incidentDeleted', (deletedId) => {
      setIncidents(prev => prev.filter(incident => incident._id !== deletedId));
    });

    return () => {
      socket.off('newIncident');
      socket.off('incidentUpdated');
      socket.off('incidentDeleted');
    };
  }, []);

  return (
    <IncidentContext.Provider
      value={{
        incidents,
        loading,
        fetchIncidents,
        resolveIncident,
        removeIncident
      }}
    >
      {children}
    </IncidentContext.Provider>
  );
}

export function useIncident() {
  return useContext(IncidentContext);
}

