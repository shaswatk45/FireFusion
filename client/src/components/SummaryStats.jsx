import React from "react";

export default function SummaryStats({ incidents }) {
  const stats = {
    total: incidents.length,
    high: incidents.filter(i => i.severity === "High").length,
    medium: incidents.filter(i => i.severity === "Medium").length,
    low: incidents.filter(i => i.severity === "Low").length,
    resolved: incidents.filter(i => i.status === "Resolved").length,
    active: incidents.filter(i => i.status !== "Resolved").length,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-blue-500 text-white p-4 rounded-lg text-center">
        <div className="text-2xl font-bold">{stats.total}</div>
        <div className="text-sm">Total Incidents</div>
      </div>
      <div className="bg-green-500 text-white p-4 rounded-lg text-center">
        <div className="text-2xl font-bold">{stats.resolved}</div>
        <div className="text-sm">Resolved</div>
      </div>
      <div className="bg-yellow-500 text-white p-4 rounded-lg text-center">
        <div className="text-2xl font-bold">{stats.active}</div>
        <div className="text-sm">Active</div>
      </div>
      <div className="bg-red-500 text-white p-4 rounded-lg text-center">
        <div className="text-2xl font-bold">{stats.high}</div>
        <div className="text-sm">High Priority</div>
      </div>
    </div>
  );
}
