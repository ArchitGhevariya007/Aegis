import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import SecurityAlertsPanel from "./AdminDashboard/SecurityAlertsPanel";
import RoleViewsPanel from "./AdminDashboard/RoleViewsPanel";
import EmergencyPanel from "./AdminDashboard/EmergencyPanel";
import LocationMapPanel from "./AdminDashboard/LocationMapPanel";
import InsiderMonitorPanel from "./AdminDashboard/InsiderMonitorPanel";


// Example icon for Admin
const AdminIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 11c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7-8-3.134-8-7zM5 20h14a2 2 0 012 2v0a2 2 0 01-2 2H5a2 2 0 01-2-2v0a2 2 0 012-2z"
        />
    </svg>
);

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate("/login");
    };

    const tabs = [
        { key: "overview", label: "Overview" },
        { key: "location", label: "Location Map" },
        { key: "alerts", label: "Security Alerts" },
        { key: "roles", label: "Role Views" },
        { key: "emergency", label: "Emergency" },
        { key: "insider", label: "Insider Monitor" },
    ];

    return (
        <>
            {/* Top Nav */}
            <div className="w-full border-b bg-white sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-4 lg:px-6">
                    <div className="flex items-center gap-4 lg:gap-6">
                        <span className="font-semibold text-slate-800 text-sm lg:text-base">
                            Digital ID System
                        </span>

                        {/* Admin Navigation */}
                        {/* <div className="hidden sm:flex items-center gap-2">
                            <button
                                className={`inline-flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg font-medium text-xs lg:text-sm bg-indigo-600 text-white`}
                            >
                                <AdminIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                                User Panel
                            </button>
                        </div> */}
                    </div>

                    <div className="flex items-center gap-2 lg:gap-3">
                        <span className="hidden sm:block text-xs lg:text-sm text-slate-500">
                            Role: <span className="font-medium text-slate-700">Administrator</span>
                        </span>
                        <button
                            onClick={handleLogout}
                            className="px-2 lg:px-3 py-1 text-xs lg:text-sm text-slate-700 border rounded-full hover:bg-slate-100"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="max-w-7xl mx-auto py-6 lg:py-10 px-4 lg:px-6">
                <div className="mb-6 lg:mb-8">
                    <h1 className="text-xl lg:text-2xl xl:text-3xl font-semibold mb-2">
                        Administrative Dashboard
                    </h1>
                    <p className="text-slate-600 text-sm lg:text-base">
                        Monitor system security and manage digital identity infrastructure
                    </p>
                </div>

                {/* Tabs */}
                <div className="mb-6 lg:mb-8">
                    <div className="hidden lg:flex gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === tab.key
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Mobile Dropdown */}
                    <div className="lg:hidden">
                        <select
                            value={activeTab}
                            onChange={(e) => setActiveTab(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {tabs.map((tab) => (
                                <option key={tab.key} value={tab.key}>
                                    {tab.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                        {/* Left: Login Location Map */}
                        <div className="p-6 bg-white rounded-2xl shadow">
                            <h2 className="text-lg font-semibold mb-4">Login Location Map</h2>
                            <div className="bg-indigo-50 border rounded-xl p-10 text-center text-slate-500 mb-6">
                                <p className="text-2xl">🌍</p>
                                <p className="font-medium">Interactive World Map</p>
                                <p className="text-sm text-slate-500">
                                    Real-time login location tracking
                                </p>
                            </div>

                            {/* Recent Activity */}
                            <h3 className="font-semibold mb-3">Recent Activity</h3>
                            <ul className="space-y-3">
                                <li className="flex items-center justify-between p-3 border rounded-xl">
                                    <span className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                                        New York <span className="text-xs text-slate-500">(40.7589, -73.9851)</span>
                                    </span>
                                    <span className="text-xs text-slate-600">15 logins</span>
                                </li>
                                <li className="flex items-center justify-between p-3 border rounded-xl">
                                    <span className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                                        Los Angeles{" "}
                                        <span className="text-xs text-slate-500">(34.0522, -118.2437)</span>
                                    </span>
                                    <span className="text-xs text-slate-600">8 logins</span>
                                </li>
                                <li className="flex items-center justify-between p-3 border rounded-xl">
                                    <span className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                                        Chicago{" "}
                                        <span className="text-xs text-slate-500">(41.8781, -87.6298)</span>
                                    </span>
                                    <span className="text-xs text-slate-600">3 logins</span>
                                </li>
                                <li className="flex items-center justify-between p-3 border rounded-xl">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                                    Houston <span className="text-xs text-slate-500">(29.7604, -95.3698)</span>
                                    <span className="text-xs text-slate-600 ml-auto">12 logins</span>
                                </li>
                            </ul>
                        </div>

                        {/* Right: Emergency Controls */}
                        <div className="p-6 bg-white rounded-2xl shadow">
                            <h2 className="text-lg font-semibold mb-4">Emergency Controls</h2>

                            <div className="p-4 mb-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                                ⚠️ Emergency controls allow immediate system lockdown in case of security breach or compromise.
                            </div>

                            {/* Master Switch */}
                            <div className="flex items-center justify-between p-4 border rounded-xl mb-4">
                                <div>
                                    <p className="font-medium">Master Emergency Switch</p>
                                    <p className="text-sm text-slate-500">
                                        Immediately pause all smart contract functions
                                    </p>
                                </div>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-red-600 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                                </label>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3">
                                <button className="flex-1 border border-red-400 text-red-600 py-2 rounded-xl hover:bg-red-50">
                                    ⚠️ Security Incident
                                </button>
                                <button className="flex-1 border border-indigo-400 text-indigo-600 py-2 rounded-xl hover:bg-indigo-50">
                                    📄 Generate Report
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Placeholders for other sections */}
                {activeTab === "alerts" && <SecurityAlertsPanel />}
                {activeTab === "roles" && <RoleViewsPanel />}
                {activeTab === "emergency" && <EmergencyPanel />}
                {activeTab === "location" && <LocationMapPanel />}
                {activeTab === "insider" && <InsiderMonitorPanel />}


            </div>
        </>
    );
}
