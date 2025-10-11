import React, { useState, useEffect } from "react";
import { CheckCircle } from 'lucide-react';

const UserIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

export default function ProfileInformation() {
    const [userInfo, setUserInfo] = useState({
        email: '',
        birthDate: '',
        residency: '',
        memberSince: '',
        verified: false
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch('http://localhost:5000/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUserInfo({
                    email: data.user.email || '',
                    birthDate: data.user.birthDate ? new Date(data.user.birthDate).toLocaleDateString() : '',
                    residency: data.user.residency || '',
                    memberSince: data.user.createdAt ? new Date(data.user.createdAt).toLocaleDateString() : '',
                    verified: data.user.kycStatus === 'completed' || false
                });
            } else {
                console.error('Failed to fetch user profile');
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const extractNameFromEmail = (email) => {
        if (!email) return 'User';
        const name = email.split('@')[0];
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    if (loading) {
        return (
            <div className="p-4 lg:p-6 bg-white rounded-2xl shadow">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <UserIcon className="w-5 h-5" />
                    Profile Information
                </h2>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-slate-500 mt-2">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-6 bg-white rounded-2xl shadow">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Profile Information
            </h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-6 h-6 lg:w-8 lg:h-8 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-lg lg:text-xl font-semibold text-slate-800 flex flex-col sm:flex-row sm:items-center gap-2">
                        <span>{extractNameFromEmail(userInfo.email)}</span>
                        {userInfo.verified && (
                            <span className="text-emerald-500 text-xs lg:text-sm bg-emerald-50 px-2 py-1 rounded-full whitespace-nowrap flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                            </span>
                        )}
                    </h3>
                </div>
            </div>
            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                    <span className="text-slate-600 text-sm lg:text-base">Email:</span>
                    <span className="font-medium text-sm lg:text-base break-all sm:break-normal">
                        {userInfo.email || 'Not provided'}
                    </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                    <span className="text-slate-600 text-sm lg:text-base">Date of Birth:</span>
                    <span className="font-medium text-sm lg:text-base">
                        {userInfo.birthDate || 'Not provided'}
                    </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                    <span className="text-slate-600 text-sm lg:text-base">Residency:</span>
                    <span className="font-medium text-sm lg:text-base">
                        {userInfo.residency || 'Not provided'}
                    </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                    <span className="text-slate-600 text-sm lg:text-base">Member Since:</span>
                    <span className="font-medium text-sm lg:text-base">
                        {userInfo.memberSince || 'Unknown'}
                    </span>
                </div>
            </div>
        </div>
    );
}