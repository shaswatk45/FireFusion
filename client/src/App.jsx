import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import VolunteerPortal from "./pages/VolunteerPortal";
import IncidentsPage from "./pages/IncidentsPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DamageAssessment from "./pages/DamageAssessment";
import DonationFeed from "./pages/DonationFeed";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { IncidentProvider } from "./context/IncidentContext"; // Import

export default function App() {
  return (
    <AuthProvider>
      <IncidentProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected dashboard route for all logged-in users */}
            <Route element={<ProtectedRoute roles={["admin", "volunteer", "public", "coordinator"]} />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/damage-assessment" element={<DamageAssessment />} />
              <Route path="/community-donations" element={<DonationFeed />} />
            </Route>

            {/* Incidents - Only for volunteers/coordinators/admins (NOT public users) */}
            <Route element={<ProtectedRoute roles={["volunteer", "coordinator", "admin"]} />}>
              <Route path="/incidents" element={<IncidentsPage />} />
            </Route>

            {/* Admin-only routes */}
            <Route element={<ProtectedRoute roles={["admin", "coordinator"]} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* Volunteer and Admin routes */}
            <Route element={<ProtectedRoute roles={["volunteer", "admin"]} />}>
              <Route path="/volunteer" element={<VolunteerPortal />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </IncidentProvider>
    </AuthProvider>
  );
}

