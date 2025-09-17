import React, { useState, useEffect } from "react";

const EyeIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

export default function AccessLogViewer() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAccessLogs();
    }, []);

    const fetchAccessLogs = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch('http://localhost:5000/api/auth/access-logs', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setLogs(data.logs || []);
            } else {
                console.error('Failed to fetch access logs');
            }
        } catch (error) {
            console.error('Error fetching access logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString();
    };

    const getDeviceInfo = (userAgent) => {
        if (!userAgent) return 'Unknown Device';
        
        // Simple device detection
        if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
            return 'Mobile App';
        } else if (userAgent.includes('Chrome')) {
            return 'Chrome Desktop';
        } else if (userAgent.includes('Firefox')) {
            return 'Firefox Desktop';
        } else if (userAgent.includes('Safari')) {
            return 'Safari Desktop';
        } else {
            return 'Desktop Browser';
        }
    };

    if (loading) {
        return (
            <div className="p-4 lg:p-6 bg-white rounded-2xl shadow">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <EyeIcon className="w-5 h-5" />
                    Access Log Viewer
                </h2>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-slate-500 mt-2">Loading access logs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-6 bg-white rounded-2xl shadow">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <EyeIcon className="w-5 h-5" />
                Access Log Viewer
            </h2>
            
            {logs.length === 0 ? (
                <div className="text-center py-8">
                    <EyeIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No access logs found</p>
                </div>
            ) : (
                <>
                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-3">
                        {logs.map((log, index) => (
                            <div key={index} className="border rounded-xl p-4 bg-slate-50">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-medium text-slate-900">{formatDate(log.timestamp)}</p>
                                        <p className="text-sm text-slate-600">{formatTime(log.timestamp)}</p>
                                    </div>
                                    <span
                                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                            log.success
                                                ? "bg-emerald-100 text-emerald-800"
                                                : "bg-red-100 text-red-800"
                                        }`}
                                    >
                                        {log.success ? 'Success' : 'Failed'}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-slate-600">
                                        <span className="font-medium">Action:</span> {log.action || 'Login'}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        <span className="font-medium">IP:</span> {log.ipAddress || 'Unknown'}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        <span className="font-medium">Device:</span> {getDeviceInfo(log.userAgent)}
                                    </p>
                                    {log.failureReason && (
                                        <p className="text-sm text-red-600">
                                            <span className="font-medium">Reason:</span> {log.failureReason}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-hidden rounded-xl border">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">IP Address</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Device</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {logs.map((log, index) => (
                                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {formatDate(log.timestamp)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {formatTime(log.timestamp)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {log.action || 'Login'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {log.ipAddress || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {getDeviceInfo(log.userAgent)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                    log.success
                                                        ? "bg-emerald-100 text-emerald-800"
                                                        : "bg-red-100 text-red-800"
                                                }`}
                                            >
                                                {log.success ? 'Success' : 'Failed'}
                                            </span>
                                            {log.failureReason && (
                                                <p className="text-xs text-red-600 mt-1">{log.failureReason}</p>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}