import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { MdClose, MdWarning, MdInfo, MdError } from 'react-icons/md';
import VerifiedFireAlert from './VerifiedFireAlert';

const socket = io();

export default function AlertNotification() {
  const [alerts, setAlerts] = useState([]);
  const [verifiedFireAlert, setVerifiedFireAlert] = useState(null);

  useEffect(() => {
    // Regular emergency alerts - show to everyone
    socket.on('emergencyAlert', (alert) => {
      setAlerts(prev => [alert, ...prev]);

      // Auto-remove alert after 10 seconds for non-critical alerts
      if (alert.severity !== 'high') {
        setTimeout(() => {
          setAlerts(prev => prev.filter(a => a.id !== alert.id));
        }, 10000);
      }
    });

    // Wildfire alerts - show to ALL users for safety awareness
    socket.on('wildfire-alert', (alert) => {
      console.log('🔥 Wildfire alert received:', alert);

      // Only show modal for verified fires
      if (alert.verified) {
        console.log('✅ Showing verified fire modal');
        setVerifiedFireAlert(alert);
      } else {
        // For unverified fires, just add to regular alerts
        console.log('⏭️ Unverified fire - showing as regular alert');
        setAlerts(prev => [{
          id: `wildfire-${Date.now()}`,
          severity: 'high',
          message: alert.message || 'Wildfire detected by satellite',
          timestamp: alert.timestamp || new Date()
        }, ...prev]);
      }
    });

    return () => {
      socket.off('emergencyAlert');
      socket.off('wildfire-alert');
    };
  }, []);

  const removeAlert = (alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'high': return <MdError className="text-red-500" />;
      case 'medium': return <MdWarning className="text-yellow-500" />;
      default: return <MdInfo className="text-blue-500" />;
    }
  };

  const getAlertStyles = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-200 text-red-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  if (alerts.length === 0) return null;

  return (
    <>
      {/* Verified Fire Alert Modal */}
      {verifiedFireAlert && (
        <VerifiedFireAlert
          alert={verifiedFireAlert}
          onClose={() => setVerifiedFireAlert(null)}
        />
      )}

      {/* Regular Alert Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`border-l-4 p-4 rounded-lg shadow-lg ${getAlertStyles(alert.severity)} animate-slide-in`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 text-xl">
                  {getAlertIcon(alert.severity)}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">
                    {alert.severity === 'high' ? '🚨 EMERGENCY ALERT' :
                      alert.severity === 'medium' ? '⚠️ WARNING' : 'ℹ️ NOTICE'}
                  </h3>
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs opacity-75 mt-2">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeAlert(alert.id)}
                className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
              >
                <MdClose />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
