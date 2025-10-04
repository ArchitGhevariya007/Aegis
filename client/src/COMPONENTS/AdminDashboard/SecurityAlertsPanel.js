import React from "react";

export default function SecurityAlertsPanel() {
  const alerts = [
    {
      type: "BRUTE FORCE DETECTED",
      description: "Multiple failed login attempts detected",
      time: "2024-08-29 14:30:22",
      severity: "RED",
      user: "john.doe@example.com",
    },
    {
      type: "IMPOSSIBLE TRAVEL",
      description: "Login from impossible geographic location",
      time: "2024-08-29 13:45:10",
      severity: "ORANGE",
      user: "sarah.smith@example.com",
    },
    {
      type: "LOW PRIORITY ANOMALOUS LOGIN",
      description: "Unusual login pattern detected",
      time: "2024-08-29 12:15:33",
      severity: "YELLOW",
      user: "mike.wilson@example.com",
    },
    {
      type: "UNAUTHORIZED ACCESS ATTEMPT",
      description: "Insider attempted unauthorized data access",
      time: "2024-08-29 11:30:45",
      severity: "RED",
      user: "admin@system.local",
    },
  ];

  const severityColors = {
    RED: "bg-red-100 text-red-600",
    ORANGE: "bg-orange-100 text-orange-600",
    YELLOW: "bg-yellow-100 text-yellow-600",
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow">
      <h2 className="text-lg font-semibold mb-4">Security Alerts Panel</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Alert Type</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">User</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Time</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Severity</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert, idx) => (
              <tr key={idx} className="border-b">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {alert.type}
                  <div className="text-xs text-slate-500">{alert.description}</div>
                </td>
                <td className="px-4 py-3">{alert.user}</td>
                <td className="px-4 py-3">{alert.time}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${severityColors[alert.severity]}`}
                  >
                    {alert.severity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="px-3 py-1 text-xs font-medium border rounded-lg text-indigo-600 border-indigo-300 hover:bg-indigo-50">
                    Investigate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
