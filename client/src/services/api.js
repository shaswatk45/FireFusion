import axios from 'axios';

const API_URL = '/api';

// Set up axios interceptor to add auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);

    // Handle unauthorized errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Auth APIs
export const loginUser = (credentials) =>
  axios.post(`${API_URL}/auth/login`, credentials);
export const registerUser = (userData) =>
  axios.post(`${API_URL}/auth/register`, userData);

// Incident APIs
export const getIncidents = () => axios.get(`${API_URL}/incidents`);
export const createIncident = (data) => axios.post(`${API_URL}/incidents`, data);
export const updateIncidentStatus = (id, status) =>
  axios.patch(`${API_URL}/incidents/${id}/status`, { status });
export const deleteIncident = (id) =>
  axios.delete(`${API_URL}/incidents/${id}`);

// User Management APIs (Admin only)
export const getAllUsers = () => axios.get(`${API_URL}/users`);
export const updateUserRole = (id, role) =>
  axios.patch(`${API_URL}/users/${id}/role`, { role });
export const deleteUser = (id) =>
  axios.delete(`${API_URL}/users/${id}`);
export const getUserProfile = () =>
  axios.get(`${API_URL}/users/profile`);

// Alert APIs (Admin only)
export const broadcastAlert = (message, severity = 'high') =>
  axios.post(`${API_URL}/alerts/broadcast`, { message, severity });
export const getRecentAlerts = () =>
  axios.get(`${API_URL}/alerts/recent`);
export const getAssignedIncidents = () =>
  axios.get(`${API_URL}/incidents/assigned`);

export const requestVolunteerRole = () =>
  axios.post(`${API_URL}/users/request-volunteer`);
// Admin: Get/review/approve volunteer requests
export const getPendingVolunteerRequests = () =>
  axios.get(`${API_URL}/users/volunteer-requests`);
export const updateVolunteerRequestStatus = (id, status) =>
  axios.patch(`${API_URL}/users/volunteer-requests/${id}`, { status });
export const assignIncidentToVolunteer = (incidentId, volunteerIds) =>
  axios.patch(`${API_URL}/incidents/${incidentId}/assign`, { volunteerIds });

// Completion proof APIs
export const submitCompletionProof = (incidentId, imageUrl, notes) =>
  axios.post(`${API_URL}/incidents/${incidentId}/submit-proof`, { imageUrl, notes });
export const getIncidentProofs = (incidentId) =>
  axios.get(`${API_URL}/incidents/${incidentId}/proofs`);

//For volunteer portal
export const requestIncidentAssignment = (incidentId) =>
  axios.post(`${API_URL}/incidents/${incidentId}/request-assignment`);
export const getInventoryItems = () =>
  axios.get(`${API_URL}/inventory`);

export const updateInventoryItem = (id, quantity) =>
  axios.patch(`${API_URL}/inventory/${id}`, { quantity });

export const createInventoryRequest = (data) =>
  axios.post(`${API_URL}/inventory-requests`, data);

export const getVolunteerInventoryRequests = () =>
  axios.get(`${API_URL}/inventory-requests`);

export const getAllInventoryRequests = () =>
  axios.get(`${API_URL}/inventory-requests/all`);

export const updateInventoryRequestStatus = (id, status) =>
  axios.patch(`${API_URL}/inventory-requests/${id}`, { status });

// Wildfire APIs
export const getWildfires = (params) =>
  axios.get(`${API_URL}/wildfires`, { params });
export const getWildfireStats = () =>
  axios.get(`${API_URL}/wildfires/stats`);
export const getWildfireById = (id) =>
  axios.get(`${API_URL}/wildfires/${id}`);
export const updateWildfireStatus = (id, status) =>
  axios.patch(`${API_URL}/wildfires/${id}`, { status });
