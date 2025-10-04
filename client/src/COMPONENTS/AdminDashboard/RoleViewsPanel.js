import React, { useState } from "react";

export default function RoleViewsPanel() {
  const [selectedRole, setSelectedRole] = useState("Full Administrator");

  const roleData = {
    "Full Administrator": [
      "All User Data",
      "System Controls",
      "Audit Logs",
      "Security Settings",
    ],
    "Auditor": ["Audit Logs", "Reports", "Security Alerts"],
    "Support Staff": ["User Data (Limited)", "Access Logs"],
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow">
      <h2 className="text-lg font-semibold mb-4">Role-Based Dashboard View</h2>
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-slate-600">
          Select Role View:
        </label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
        >
          {Object.keys(roleData).map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      <div className="p-4 rounded-lg bg-green-50 border border-green-200">
        <h3 className="font-semibold text-green-700 mb-2">Accessible Data</h3>
        <ul className="list-disc list-inside text-sm text-slate-700">
          {roleData[selectedRole].map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
