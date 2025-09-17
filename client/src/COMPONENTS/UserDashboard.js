import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileInformation from "./UserDashboard/ProfileInformation";
import BlockchainDigitalID from "./UserDashboard/BlockchainDigitalID";
import DocumentManager from "./UserDashboard/DocumentManager";
import AccessLogViewer from "./UserDashboard/AccessLogViewer";
import NotificationCenter from "./UserDashboard/NotificationCenter";
import PermissionControlPanel from "./UserDashboard/PermissionControlPanel";
import VotingSection from "./UserDashboard/VotingSection";

// Icon Components
const UserIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const VotingIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);

export default function UserDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const [activeSection, setActiveSection] = useState("dashboard");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate("/login");
    };

    const tabs = [
        { key: "overview", label: "Overview" },
        { key: "blockchain", label: "Blockchain ID" },
        { key: "documents", label: "Documents" },
        { key: "accessLogs", label: "Access Logs" },
        { key: "notifications", label: "Notifications" },
        { key: "permissions", label: "Permissions" }
    ];

    return (
        <>
            {/* Top Nav */}
            <div className="w-full border-b bg-white sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-4 lg:px-6">
                    <div className="flex items-center gap-4 lg:gap-6">
                        <span className="font-semibold text-slate-800 text-sm lg:text-base">Digital ID System</span>
                        
                        {/* Dashboard/Voting Navigation */}
                        <div className="hidden sm:flex items-center gap-2">
                            <button
                                onClick={() => setActiveSection("dashboard")}
                                className={`inline-flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg font-medium text-xs lg:text-sm ${
                                    activeSection === "dashboard"
                                        ? "bg-indigo-600 text-white"
                                        : "text-slate-600 hover:bg-slate-100"
                                }`}
                            >
                                <UserIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                                Dashboard
                            </button>
                            <button
                                onClick={() => setActiveSection("voting")}
                                className={`inline-flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg font-medium text-xs lg:text-sm ${
                                    activeSection === "voting"
                                        ? "bg-indigo-600 text-white"
                                        : "text-slate-600 hover:bg-slate-100"
                                }`}
                            >
                                <VotingIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                                Voting
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="sm:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-3">
                        <span className="hidden sm:block text-xs lg:text-sm text-slate-500">
                            Role: <span className="font-medium text-slate-700">User</span>
                        </span>
                        <button
                            onClick={handleLogout}
                            className="px-2 lg:px-3 py-1 text-xs lg:text-sm text-slate-700 border rounded-full hover:bg-slate-100"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="sm:hidden border-t bg-white px-4 py-3">
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => {
                                    setActiveSection("dashboard");
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm w-full justify-start ${
                                    activeSection === "dashboard"
                                        ? "bg-indigo-600 text-white"
                                        : "text-slate-600 hover:bg-slate-100"
                                }`}
                            >
                                <UserIcon className="w-4 h-4" />
                                Dashboard
                            </button>
                            <button
                                onClick={() => {
                                    setActiveSection("voting");
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm w-full justify-start ${
                                    activeSection === "voting"
                                        ? "bg-indigo-600 text-white"
                                        : "text-slate-600 hover:bg-slate-100"
                                }`}
                            >
                                <VotingIcon className="w-4 h-4" />
                                Voting
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Dashboard Content */}
            <div className="max-w-7xl mx-auto py-6 lg:py-10 px-4 lg:px-6">
                <div className="mb-6 lg:mb-8">
                    <h1 className="text-xl lg:text-2xl xl:text-3xl font-semibold mb-2">User Dashboard</h1>
                    <p className="text-slate-600 text-sm lg:text-base">
                        Manage your digital identity and access permissions
                    </p>
                </div>

                {/* Conditionally render content based on section */}
                {activeSection === "dashboard" && (
                    <>
                        {/* Tabs */}
                        <div className="mb-6 lg:mb-8">
                            {/* Desktop Tabs */}
                            <div className="hidden lg:flex gap-2">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                            activeTab === tab.key
                                                ? "bg-indigo-600 text-white shadow-sm"
                                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Mobile/Tablet Dropdown */}
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
                                <ProfileInformation />
                                <BlockchainDigitalID />
                            </div>
                        )}

                        {activeTab === "blockchain" && (
                            <div className="max-w-2xl mx-auto">
                                <BlockchainDigitalID standalone />
                            </div>
                        )}

                        {activeTab === "documents" && <DocumentManager />}
                        {activeTab === "accessLogs" && <AccessLogViewer />}
                        {activeTab === "notifications" && <NotificationCenter />}
                        {activeTab === "permissions" && <PermissionControlPanel />}
                    </>
                )}

                {/* Voting Section */}
                {activeSection === "voting" && <VotingSection />}
            </div>
        </>
    );
}
