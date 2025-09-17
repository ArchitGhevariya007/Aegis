import React, { useState, useEffect } from "react";

const CogIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export default function PermissionControlPanel() {
    const [permissions, setPermissions] = useState({});
    const [connectedServices, setConnectedServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const defaultPermissions = [
        { key: "name", label: "Name", desc: "Allow government services to access your name information" },
        { key: "dob", label: "Date Of Birth", desc: "Allow government services to access your date of birth information" },
        { key: "address", label: "Address", desc: "Allow government services to access your address information" },
        { key: "health", label: "Health", desc: "Allow government services to access your health information" },
        { key: "tax", label: "Tax", desc: "Allow government services to access your tax information" },
    ];

    useEffect(() => {
        fetchPermissions();
        fetchConnectedServices();
    }, []);

    const fetchPermissions = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch('http://localhost:5000/api/auth/permissions', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPermissions(data.permissions || {
                    name: true,
                    dob: true,
                    address: false,
                    health: false,
                    tax: false
                });
            } else {
                // Set default permissions
                setPermissions({
                    name: true,
                    dob: true,
                    address: false,
                    health: false,
                    tax: false
                });
            }
        } catch (error) {
            console.error('Error fetching permissions:', error);
            // Set default permissions
            setPermissions({
                name: true,
                dob: true,
                address: false,
                health: false,
                tax: false
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchConnectedServices = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch('http://localhost:5000/api/auth/connected-services', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setConnectedServices(data.services || []);
            } else {
                // Fallback to default services for demo
                setConnectedServices([
                    { id: 1, name: "Tax Office", permissions: ["name", "DOB", "tax"], status: "active" },
                    { id: 2, name: "Healthcare System", permissions: ["name", "DOB", "health"], status: "active" },
                    { id: 3, name: "Municipal Services", permissions: ["name", "address"], status: "pending" },
                    { id: 4, name: "Banking Services", permissions: ["name", "DOB", "address"], status: "inactive" },
                ]);
            }
        } catch (error) {
            console.error('Error fetching connected services:', error);
            // Fallback to default services
            setConnectedServices([
                { id: 1, name: "Tax Office", permissions: ["name", "DOB", "tax"], status: "active" },
                { id: 2, name: "Healthcare System", permissions: ["name", "DOB", "health"], status: "active" },
                { id: 3, name: "Municipal Services", permissions: ["name", "address"], status: "pending" },
                { id: 4, name: "Banking Services", permissions: ["name", "DOB", "address"], status: "inactive" },
            ]);
        }
    };

    const updatePermission = async (permissionKey, value) => {
        setSaving(true);
        try {
            const newPermissions = { ...permissions, [permissionKey]: value };
            
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:5000/api/auth/permissions', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ permissions: newPermissions })
            });

            if (response.ok) {
                setPermissions(newPermissions);
            } else {
                alert('Failed to update permission');
            }
        } catch (error) {
            console.error('Error updating permission:', error);
            alert('Failed to update permission');
        } finally {
            setSaving(false);
        }
    };

    const manageService = (serviceId) => {
        alert(`Manage service functionality will be implemented for service ID: ${serviceId}`);
    };

    if (loading) {
        return (
            <div className="p-4 lg:p-6 bg-white rounded-2xl shadow">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CogIcon className="w-5 h-5" />
                    Permission Control Panel
                </h2>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-slate-500 mt-2">Loading permissions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-6 bg-white rounded-2xl shadow">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CogIcon className="w-5 h-5" />
                Permission Control Panel
            </h2>

            {/* Data Sharing Permissions */}
            <div className="mb-6 lg:mb-8">
                <h3 className="font-medium text-slate-700 mb-3 text-sm lg:text-base">Data Sharing Permissions</h3>
                <div className="space-y-4">
                    {defaultPermissions.map((perm) => (
                        <div key={perm.key} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm lg:text-base">{perm.label}</p>
                                <p className="text-xs lg:text-sm text-slate-500 mt-1">{perm.desc}</p>
                            </div>
                            <label className="inline-flex items-center cursor-pointer flex-shrink-0">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={permissions[perm.key] || false}
                                    onChange={(e) => updatePermission(perm.key, e.target.checked)}
                                    disabled={saving}
                                />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Connected Services */}
            <div>
                <h3 className="font-medium text-slate-700 mb-3 text-sm lg:text-base">Connected Services</h3>
                {connectedServices.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No connected services found</p>
                ) : (
                    <div className="space-y-3">
                        {connectedServices.map((service) => (
                            <div
                                key={service.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 lg:p-4 border rounded-xl gap-3"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium text-sm lg:text-base">{service.name}</p>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            service.status === 'active' ? 'bg-green-100 text-green-800' :
                                            service.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {service.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {service.permissions.map((p, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700"
                                            >
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => manageService(service.id)}
                                    className="px-3 py-2 text-xs lg:text-sm border rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
                                >
                                    Manage
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {saving && (
                <div className="mt-4 text-center">
                    <p className="text-sm text-indigo-600">Updating permissions...</p>
                </div>
            )}
        </div>
    );
}