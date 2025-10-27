import React, { useState, useEffect } from "react";

const BellIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

export default function NotificationCenter() {
    const [settings, setSettings] = useState({
        emailNotifications: true,
        pushNotifications: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchNotificationSettings();
    }, []);

    const fetchNotificationSettings = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch('http://localhost:5000/api/auth/notification-settings', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSettings(data.settings || settings);
            }
        } catch (error) {
            console.error('Error fetching notification settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateNotificationSettings = async (newSettings) => {
        setSaving(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:5000/api/auth/notification-settings', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ settings: newSettings })
            });

            if (response.ok) {
                setSettings(newSettings);
            } else {
                alert('Failed to update notification settings');
            }
        } catch (error) {
            console.error('Error updating notification settings:', error);
            alert('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = (settingKey) => {
        const newSettings = {
            ...settings,
            [settingKey]: !settings[settingKey]
        };
        updateNotificationSettings(newSettings);
    };

    if (loading) {
        return (
            <div className="p-4 lg:p-6 bg-white rounded-2xl shadow max-w-2xl mx-auto">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BellIcon className="w-5 h-5" />
                    Real-Time Access Notifications
                </h2>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-slate-500 mt-2">Loading notification settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-6 bg-white rounded-2xl shadow max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BellIcon className="w-5 h-5" />
                Real-Time Access Notifications
            </h2>

            {/* Notification Settings */}
            <div className="space-y-6">
                {/* Email Notifications Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <p className="font-medium text-sm lg:text-base">Email Notifications</p>
                        <p className="text-slate-500 text-xs lg:text-sm mt-1">
                            Get notified of all login attempts and data access via email
                        </p>
                    </div>
                    <label className="inline-flex items-center cursor-pointer flex-shrink-0">
                        <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.emailNotifications}
                            onChange={() => handleToggle('emailNotifications')}
                            disabled={saving}
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 relative
                after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white
                after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                    </label>
                </div>

                {/* Push Notifications Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <p className="font-medium text-sm lg:text-base">Push Notifications</p>
                        <p className="text-slate-500 text-xs lg:text-sm mt-1">
                            Get real-time browser notifications for immediate alerts
                        </p>
                    </div>
                    <label className="inline-flex items-center cursor-pointer flex-shrink-0">
                        <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.pushNotifications}
                            onChange={() => handleToggle('pushNotifications')}
                            disabled={saving}
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 relative
                after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white
                after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                    </label>
                </div>
            </div>

            {/* Active Notifications List */}
            <div className="bg-blue-50 px-4 py-4 lg:py-3 rounded-xl border text-slate-600 mt-6">
                <p className="font-semibold mb-2 text-sm lg:text-base">Active Notifications:</p>
                <ul className="list-disc pl-6 text-xs lg:text-sm space-y-1">
                    <li>Login attempts from new devices</li>
                    <li>Government service data access</li>
                    <li>Permission changes</li>
                    <li>Security alerts</li>
                    <li>Document verification updates</li>
                </ul>
            </div>

            {saving && (
                <div className="mt-4 text-center">
                    <p className="text-sm text-indigo-600">Saving settings...</p>
                </div>
            )}
        </div>
    );
}