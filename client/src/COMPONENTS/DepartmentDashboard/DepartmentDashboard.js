import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, LogOut, Search } from 'lucide-react';
import UserSearchPanel from './UserSearchPanel';
import { storage } from '../../services/api';

export default function DepartmentDashboard() {
    const [activeTab, setActiveTab] = useState('search');
    const [departmentInfo, setDepartmentInfo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDepartmentInfo();
    }, []);

    const fetchDepartmentInfo = async () => {
        try {
            const token = storage.getToken();
            const response = await fetch('http://localhost:5000/api/departments/info', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setDepartmentInfo(data);
            }
        } catch (error) {
            console.error('Error fetching department info:', error);
        }
    };

    const handleLogout = () => {
        storage.removeToken();
        storage.removeUser();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-slate-900">
                                {departmentInfo?.name || 'Department'} Dashboard
                            </h1>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Navigation Tabs */}
                <div className="mb-8">
                    <nav className="flex space-x-4">
                        <button
                            onClick={() => setActiveTab('search')}
                            className={`px-3 py-2 text-sm font-medium rounded-md flex items-center gap-2 ${
                                activeTab === 'search'
                                    ? 'bg-white text-slate-900 shadow'
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            <Search className="w-4 h-4" />
                            User Search
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    {activeTab === 'search' && <UserSearchPanel />}
                </div>
            </main>
        </div>
    );
}
