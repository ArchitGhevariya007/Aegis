import React, { useState, useEffect } from "react";
import { AlertTriangle, Lock, Shield, Activity } from 'lucide-react';
import { emergencyAPI, storage } from '../../services/api';

export default function EmergencySummary() {
  const [isLockdownActive, setIsLockdownActive] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = storage.getToken();
      const [statusResponse, statsResponse] = await Promise.all([
        emergencyAPI.getStatus(token),
        emergencyAPI.getStats(token)
      ]);
      
      // Use isLockdownActive specifically for lockdown status
      setIsLockdownActive(statusResponse.isLockdownActive || false);
      setStats(statsResponse);
    } catch (error) {
      console.error('Failed to fetch emergency data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-2xl shadow">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-red-100 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Emergency Controls</h2>
          <p className="text-xs text-slate-500">System protection & data management</p>
        </div>
        {isLockdownActive && (
          <div className="px-3 py-1 bg-red-100 border border-red-300 rounded-lg">
            <span className="text-xs font-semibold text-red-700 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              LOCKED
            </span>
          </div>
        )}
      </div>

      {/* System Status */}
      <div className={`mb-4 p-4 rounded-xl border-2 ${isLockdownActive ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
        <div className="flex items-center gap-3">
          <Lock className={`w-5 h-5 ${isLockdownActive ? 'text-red-600' : 'text-slate-400'}`} />
          <div className="flex-1">
            <p className="font-semibold text-sm text-slate-900">
              {isLockdownActive ? 'System Locked Down' : 'System Operational'}
            </p>
            <p className="text-xs text-slate-600">
              {isLockdownActive 
                ? 'All user access is currently disabled' 
                : 'Normal operations, no active restrictions'}
            </p>
          </div>
          <div className={`w-3 h-3 rounded-full ${isLockdownActive ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex flex-col items-center text-center">
              <Shield className="w-5 h-5 text-slate-400 mb-1" />
              <p className="text-lg font-bold text-slate-800">{stats.total || 0}</p>
              <p className="text-xs text-slate-500">Total Events</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex flex-col items-center text-center">
              <Activity className="w-5 h-5 text-red-500 mb-1" />
              <p className="text-lg font-bold text-red-600">{stats.active || 0}</p>
              <p className="text-xs text-red-600">Active</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
            <div className="flex flex-col items-center text-center">
              <Lock className="w-5 h-5 text-indigo-500 mb-1" />
              <p className="text-lg font-bold text-indigo-600">{stats.systemLockdowns || 0}</p>
              <p className="text-xs text-indigo-600">Lockdowns</p>
            </div>
          </div>
        </div>
      )}

      {/* Warning Banner */}
      {/* <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
        <p className="text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Emergency controls allow immediate system lockdown in case of security breach or compromise.</span>
        </p>
      </div> */}
    </div>
  );
}

