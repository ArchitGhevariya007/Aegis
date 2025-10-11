import React from "react";
import { AlertTriangle, Lock, FileText, Shield } from 'lucide-react';

export default function EmergencyPanel() {
  return (
    <div className="p-6 bg-white rounded-2xl shadow">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <h2 className="text-lg font-semibold">Emergency Control Panel</h2>
      </div>

      <div className="p-4 mb-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>Use these controls only in case of a verified system emergency.</span>
      </div>

      <div className="flex items-center justify-between p-4 border rounded-xl mb-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-slate-600 mt-0.5" />
          <div>
            <p className="font-medium">System Lockdown</p>
            <p className="text-sm text-slate-500">
              Immediately lock down login and data systems
            </p>
          </div>
        </div>
        <label className="inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-red-600 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
        </label>
      </div>

      <div className="flex gap-3">
        <button className="flex-1 border border-red-400 text-red-600 py-2 rounded-xl hover:bg-red-50 flex items-center justify-center gap-2">
          <Shield className="w-4 h-4" />
          Trigger Security Protocol
        </button>
        <button className="flex-1 border border-indigo-400 text-indigo-600 py-2 rounded-xl hover:bg-indigo-50 flex items-center justify-center gap-2">
          <FileText className="w-4 h-4" />
          Generate Emergency Report
        </button>
      </div>
    </div>
  );
}
