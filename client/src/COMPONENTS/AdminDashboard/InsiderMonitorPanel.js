import React from "react";

export default function InsiderMonitorPanel() {
  const insiderLogs = [
    {
      user: "admin.jones@system.local",
      action: "Attempted to disable audit logs",
      time: "2024-08-29 14:15:22",
      status: "Blocked",
      risk: "High",
    },
    {
      user: "operator.smith@system.local",
      action: "Multiple restricted record access attempts",
      time: "2024-08-29 13:30:10",
      status: "Flagged",
      risk: "Medium",
    },
    {
      user: "supervisor.brown@system.local",
      action: "Logs viewing disabled for 5 minutes",
      time: "2024-08-29 12:45:33",
      status: "Alerted",
      risk: "High",
    },
  ];

  const riskColors = {
    High: "bg-red-500 text-white",
    Medium: "bg-yellow-400 text-black",
    Low: "bg-green-500 text-white",
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow w-full">
      <h2 className="text-lg font-semibold mb-4">Insider Activity Monitoring</h2>
      <p className="text-slate-500 text-sm mb-6">
        Monitoring system administrators and privileged users for unauthorized activities.
      </p>

      <div className="overflow-x-auto">
        <table className="min-w-full border rounded-xl">
          <thead>
            <tr className="bg-slate-100 text-left text-sm font-medium text-slate-600">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {insiderLogs.map((log, idx) => (
              <tr key={idx} className="border-t hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-800">{log.user}</td>
                <td className="px-4 py-3 text-slate-600">{log.action}</td>
                <td className="px-4 py-3 text-slate-500">{log.time}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs rounded-full bg-slate-200 text-slate-700">
                    {log.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${riskColors[log.risk]}`}
                  >
                    {log.risk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
