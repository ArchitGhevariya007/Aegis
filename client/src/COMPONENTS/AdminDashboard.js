import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, storage } from "../services/api";

import SecurityAlertsPanel from "./AdminDashboard/SecurityAlertsPanel";
import RoleViewsPanel from "./AdminDashboard/RoleViewsPanel";
import EmergencyPanel from "./AdminDashboard/EmergencyPanel";
import LocationMapPanel from "./AdminDashboard/LocationMapPanel";
import InsiderMonitorPanel from "./AdminDashboard/InsiderMonitorPanel";
import EmergencySummary from "./AdminDashboard/EmergencySummary";
import VotingPanel from "./AdminDashboard/VotingPanel";


// Example icon for Admin
// eslint-disable-next-line
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

    const handleLogout = async () => {
        try {
            const token = storage.getToken();
            if (token) {
                await authAPI.logout(token);
            }
            storage.removeToken();
            storage.removeUser();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
        navigate("/login");
        }
    };

    const tabs = [
        { key: "overview", label: "Overview" },
        { key: "location", label: "Location Map" },
        { key: "alerts", label: "Security Alerts" },
        { key: "roles", label: "Manage Roles" },
        { key: "emergency", label: "Emergency" },
        { key: "voting", label: "Voting System" },
        // { key: "insider", label: "Insider Monitor" },
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
                        {/* Left: Login Location Map - Mini Mode */}
                        <LocationMapPanel miniMode={true} activityLimit={4} />

                        {/* Right: Emergency Controls Summary */}
                        <EmergencySummary />
                    </div>
                )}

                {/* Placeholders for other sections */}
                {activeTab === "alerts" && <SecurityAlertsPanel />}
                {activeTab === "roles" && <RoleViewsPanel />}
                {activeTab === "emergency" && <EmergencyPanel />}
                {activeTab === "location" && <LocationMapPanel />}
                {activeTab === "voting" && <VotingPanel />}
                {activeTab === "insider" && <InsiderMonitorPanel />}


            </div>
        </>
    );
}
