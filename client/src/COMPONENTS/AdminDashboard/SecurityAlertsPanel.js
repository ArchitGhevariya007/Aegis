import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, CheckCircle, Loader2 } from 'lucide-react';

export default function SecurityAlertsPanel() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState({ severity: '', status: '' });
    const itemsPerPage = 10;

    useEffect(() => {
        fetchAlerts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, filter]);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
            
            const params = new URLSearchParams({
                page: currentPage,
                limit: itemsPerPage
            });
            
            if (filter.severity) params.append('severity', filter.severity);
            if (filter.status) params.append('status', filter.status);

            const response = await axios.get(
                `http://localhost:5000/api/security-alerts?${params.toString()}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setAlerts(response.data.alerts);
            setTotalPages(response.data.pages);
            setTotal(response.data.total);
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (alertId) => {
        try {
            const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
            await axios.patch(
                `http://localhost:5000/api/security-alerts/${alertId}/resolve`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Refresh alerts after resolving
            fetchAlerts();
        } catch (error) {
            console.error('Error resolving alert:', error);
            alert('Failed to resolve alert');
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'CRITICAL':
                return 'bg-red-100 text-red-600';
            case 'HIGH':
                return 'bg-orange-100 text-orange-600';
            case 'MEDIUM':
                return 'bg-yellow-100 text-yellow-600';
            case 'LOW':
                return 'bg-blue-100 text-blue-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(',', '');
    };

    const Pagination = () => (
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-slate-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} alerts
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                    Previous
                </button>
                
                {/* Page numbers */}
                <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                            pageNum = i + 1;
                        } else if (currentPage <= 3) {
                            pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                        } else {
                            pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                    currentPage === pageNum
                                        ? 'bg-indigo-600 text-white'
                                        : 'border hover:bg-slate-50'
                                }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                    Next
                </button>
            </div>
        </div>
    );

    if (loading && alerts.length === 0) {
        return (
            <div className="p-6 bg-white rounded-2xl shadow w-full">
                <div className="flex items-center justify-center h-96">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                        <span>Loading security alerts...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-2xl shadow w-full">
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg font-semibold">Security Alerts Panel</h2>
                </div>
                <p className="text-sm text-slate-500">
                    Monitor and respond to security threats
                </p>
            </div>

            {/* Filters */}
            <div className="mb-4 flex gap-3">
                <select
                    value={filter.severity}
                    onChange={(e) => {
                        setFilter({ ...filter, severity: e.target.value });
                        setCurrentPage(1);
                    }}
                    className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All Severities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                </select>
                
                <select
                    value={filter.status}
                    onChange={(e) => {
                        setFilter({ ...filter, status: e.target.value });
                        setCurrentPage(1);
                    }}
                    className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="INVESTIGATING">Investigating</option>
                </select>
            </div>

            {/* Table */}
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
                        {alerts.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                                    No security alerts found
                                </td>
                            </tr>
                        ) : (
                            alerts.map((alert) => (
                                <tr key={alert._id} className="border-b hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-800">
                                        {alert.title}
                                        <div className="text-xs text-slate-500">{alert.description}</div>
                                    </td>
                                    <td className="px-4 py-3">{alert.userEmail}</td>
                                    <td className="px-4 py-3">{formatDate(alert.createdAt)}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}
                                        >
                                            {alert.severity}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {alert.status === 'RESOLVED' ? (
                                            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                Resolved
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleResolve(alert._id)}
                                                className="px-3 py-1 text-xs font-medium border rounded-lg text-indigo-600 border-indigo-300 hover:bg-indigo-50 transition-colors"
                                            >
                                                Resolve
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && <Pagination />}
        </div>
    );
}
