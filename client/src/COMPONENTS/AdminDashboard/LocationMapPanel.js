import React from "react";

export default function LocationMapPanel() {
  const locations = [
    { city: "New York", coords: "40.7589, -73.9851", logins: 15, status: "green" },
    { city: "Los Angeles", coords: "34.0522, -118.2437", logins: 8, status: "green" },
    { city: "Chicago", coords: "41.8781, -87.6298", logins: 3, status: "red" },
    { city: "Houston", coords: "29.7604, -95.3698", logins: 12, status: "green" },
  ];

  const statusColors = {
    green: "bg-green-500",
    red: "bg-red-500",
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow w-full">
      <h2 className="text-lg font-semibold mb-4">Login Location Map</h2>

      {/* Map Placeholder */}
      <div className="mb-6 rounded-xl bg-slate-50 border p-10 flex flex-col items-center justify-center text-slate-500">
        <span className="text-4xl mb-2">🌍</span>
        <p className="font-medium">Interactive World Map</p>
        <p className="text-sm text-slate-400">Real-time login location tracking</p>
      </div>

      {/* Recent Activity */}
      <h3 className="text-md font-semibold mb-3">Recent Activity</h3>
      <div className="space-y-3">
        {locations.map((loc, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${statusColors[loc.status]}`}></span>
              <div>
                <p className="font-medium text-slate-800">{loc.city}</p>
                <p className="text-xs text-slate-500">{loc.coords}</p>
              </div>
            </div>
            <span className="text-sm font-medium text-slate-600">{loc.logins} logins</span>
          </div>
        ))}
      </div>
    </div>
  );
}
