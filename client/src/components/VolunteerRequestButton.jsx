import React, { useState } from 'react';
import { requestVolunteerRole } from '../services/api';

export default function VolunteerRequestButton() {
  const [state, setState] = useState({ requested: false, loading: false, error: null });

  const handleRequest = async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      await requestVolunteerRole();
      setState({ requested: true, loading: false, error: null });
    } catch (error) {
      setState({ ...state, loading: false, error: error.response?.data?.message || "Failed" });
    }
  };

  if (state.requested)
    return (
      <div className="text-green-600 font-semibold">
        Request to become volunteer submitted, awaiting admin approval.
      </div>
    );

  return (
    <div>
      <button
        onClick={handleRequest}
        disabled={state.loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        {state.loading ? "Submitting..." : "Request Volunteer Role"}
      </button>
      {state.error && <div className="text-red-600 mt-2">{state.error}</div>}
    </div>
  );
}
