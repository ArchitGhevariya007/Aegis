import React, { useState, useEffect } from "react";
import { AlertTriangle, Lock, FileText, Loader2, Database, Users } from 'lucide-react';
import { emergencyAPI, storage } from '../../services/api';
import { ConfirmModal, SuccessModal } from '../common/Modal';

export default function EmergencyPanel() {
  const [isLockdownActive, setIsLockdownActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lockdownReason, setLockdownReason] = useState('');
  
  // Modal states
  const [showLockdownModal, setShowLockdownModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successDetails, setSuccessDetails] = useState('');
  const [exportType, setExportType] = useState('users'); // 'users' or 'admin'

  // Fetch emergency status on mount
  useEffect(() => {
    fetchEmergencyStatus();
  }, []);

  const fetchEmergencyStatus = async () => {
    try {
      const token = storage.getToken();
      const response = await emergencyAPI.getStatus(token);
      // Use isLockdownActive from response (specifically for lockdown status)
      setIsLockdownActive(response.isLockdownActive || false);
      console.log('[EmergencyPanel] Lockdown status:', response.isLockdownActive);
    } catch (error) {
      console.error('Failed to fetch emergency status:', error);
      setIsLockdownActive(false); // Default to false on error
    }
  };

  const handleLockdownToggle = async (checked) => {
    if (checked) {
      // Show modal for activation
      setShowLockdownModal(true);
    } else {
      // Deactivate without modal
      await performLockdownToggle(false);
    }
  };

  const performLockdownToggle = async (enable) => {
    setLoading(true);

    try {
      const token = storage.getToken();
      const response = await emergencyAPI.toggleLockdown(enable, lockdownReason, token);
      
      setShowLockdownModal(false);
      setLockdownReason('');
      
      // Only show success modal if action was actually performed
      if (response.success) {
        setSuccessMessage(enable ? 'System Lockdown Activated' : 'System Lockdown Deactivated');
        setSuccessDetails(enable 
          ? '🔒 All users have been logged out and the system is now in lockdown mode. User access is completely disabled.'
          : '✅ Lockdown has been lifted. Normal system operations have resumed and users can now access the platform.');
        setShowSuccessModal(true);
        
        // Update state based on actual result
        setIsLockdownActive(enable);
      }
      
      // Refresh status to be sure
      await fetchEmergencyStatus();
    } catch (error) {
      // Show error in a modal instead of alert
      setSuccessMessage('⚠️ Action Failed');
      setSuccessDetails(error.message || 'Failed to toggle system lockdown. Please try again.');
      setShowSuccessModal(true);
      console.error('Lockdown toggle error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportClick = (type) => {
    setExportType(type);
    setShowExportModal(true);
  };

  const performExport = async () => {
    setExporting(true);
    setShowExportModal(false);

    try {
      const token = storage.getToken();
      const response = await emergencyAPI.exportUsers(token, exportType);
      
      // Create and download JSON file
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      const filename = exportType === 'users' 
        ? `aegis-users-backup-${new Date().toISOString().split('T')[0]}.json`
        : `aegis-admin-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success modal
      setSuccessMessage(exportType === 'users' ? 'User Data Exported Successfully' : 'Admin Data Exported Successfully');
      setSuccessDetails(exportType === 'users'
        ? `Exported ${response.data.data.summary.totalUsers} user accounts\n\nFile: ${filename}`
        : `Admin data backup completed\n\nFile: ${filename}`);
      setShowSuccessModal(true);
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to export data'}`);
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);

    try {
      const token = storage.getToken();
      const response = await emergencyAPI.generateReport(token);
      
      const dateStr = new Date().toISOString().split('T')[0];
      
      // Create and download report as JSON
      const reportStr = JSON.stringify(response.report, null, 2);
      const reportBlob = new Blob([reportStr], { type: 'application/json' });
      const jsonUrl = window.URL.createObjectURL(reportBlob);
      const jsonLink = document.createElement('a');
      jsonLink.href = jsonUrl;
      jsonLink.download = `aegis-system-report-${dateStr}.json`;
      document.body.appendChild(jsonLink);
      jsonLink.click();
      document.body.removeChild(jsonLink);
      window.URL.revokeObjectURL(jsonUrl);

      // Also create a readable text version
      const textReport = generateTextReport(response.report);
      const textBlob = new Blob([textReport], { type: 'text/plain' });
      const textUrl = window.URL.createObjectURL(textBlob);
      const textLink = document.createElement('a');
      textLink.href = textUrl;
      textLink.download = `aegis-system-report-${dateStr}.txt`;
      document.body.appendChild(textLink);
      textLink.click();
      document.body.removeChild(textLink);
      window.URL.revokeObjectURL(textUrl);

      // Show success modal
      setSuccessMessage('System Report Generated Successfully');
      setSuccessDetails(`Comprehensive security report created in dual formats:\n\n• aegis-system-report-${dateStr}.json\n• aegis-system-report-${dateStr}.txt\n\nCheck your Downloads folder.`);
      setShowSuccessModal(true);
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to generate system report'}`);
      console.error('Report generation error:', error);
    } finally {
      setGenerating(false);
    }
  };

  const generateTextReport = (report) => {
    return `
═══════════════════════════════════════════════════════════
        AEGIS DIGITAL ID SYSTEM - EMERGENCY REPORT
═══════════════════════════════════════════════════════════

Generated: ${new Date(report.generatedAt).toLocaleString()}
Generated By: ${report.generatedBy}
Report Period: ${new Date(report.reportPeriod.start).toLocaleDateString()} - ${new Date(report.reportPeriod.end).toLocaleDateString()}

───────────────────────────────────────────────────────────
SYSTEM STATUS
───────────────────────────────────────────────────────────
Overall Status: ${report.systemStatus.status}
Active Alerts: ${report.systemStatus.activeAlerts}
Critical Issues: ${report.systemStatus.criticalIssues}

───────────────────────────────────────────────────────────
USER METRICS
───────────────────────────────────────────────────────────
Total Users: ${report.userMetrics.total}
Active Users: ${report.userMetrics.active}
Locked Users: ${report.userMetrics.locked}
New Users Today: ${report.userMetrics.newToday}
Active Sessions: ${report.userMetrics.activeSessions}

───────────────────────────────────────────────────────────
LOGIN METRICS
───────────────────────────────────────────────────────────
Total Logins: ${report.loginMetrics.total}
Logins Today: ${report.loginMetrics.today}
Failed Today: ${report.loginMetrics.failedToday}
Success Rate: ${report.loginMetrics.successRate}

───────────────────────────────────────────────────────────
SECURITY METRICS
───────────────────────────────────────────────────────────
Total Alerts: ${report.securityMetrics.totalAlerts}
Active Alerts: ${report.securityMetrics.activeAlerts}
Critical (Last 7 Days): ${report.securityMetrics.criticalAlertsLast7Days}

───────────────────────────────────────────────────────────
RECOMMENDATIONS
───────────────────────────────────────────────────────────
${report.recommendations.map((rec, i) => `${i + 1}. [${rec.level}] ${rec.message}\n   Action: ${rec.action}`).join('\n\n')}

───────────────────────────────────────────────────────────
RECENT CRITICAL ALERTS (Last 7 Days)
───────────────────────────────────────────────────────────
${report.recentCriticalAlerts.map((alert, i) => 
  `${i + 1}. [${alert.severity}] ${alert.title}\n   User: ${alert.userEmail}\n   Status: ${alert.status}\n   Date: ${new Date(alert.createdAt).toLocaleString()}`
).join('\n\n')}

───────────────────────────────────────────────────────────
TOP COUNTRIES (Last 7 Days)
───────────────────────────────────────────────────────────
${report.geographicData.topCountries.map((loc, i) => 
  `${i + 1}. ${loc._id}: ${loc.count} logins from ${loc.cities.length} cities`
).join('\n')}

═══════════════════════════════════════════════════════════
                    END OF REPORT
═══════════════════════════════════════════════════════════
    `;
  };

  return (
    <>
      <div className="p-6 bg-white rounded-2xl shadow w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Emergency Control Panel</h2>
              <p className="text-sm text-slate-500">Critical system controls and data management</p>
            </div>
          </div>
          {isLockdownActive && (
            <div className="px-4 py-2 bg-red-100 border border-red-300 rounded-lg">
              <span className="text-sm font-semibold text-red-700 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                SYSTEM LOCKED
              </span>
            </div>
          )}
        </div>

        {/* Professional Warning Banner */}
        {/* <div className="mb-6 overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="p-4 flex items-start gap-3">
            <div className="flex-shrink-0 p-2 bg-white rounded-lg shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900 mb-1">Emergency Access Only</h4>
              <p className="text-sm text-amber-700">These controls should only be used during verified security incidents. All actions are logged and monitored for audit purposes.</p>
            </div>
          </div>
        </div> */}


        {/* System Lockdown Control */}
        <div className={`mb-6 overflow-hidden rounded-xl border-2 ${isLockdownActive ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${isLockdownActive ? 'bg-red-100' : 'bg-slate-100'}`}>
                  <Lock className={`w-6 h-6 ${isLockdownActive ? 'text-red-600' : 'text-slate-600'}`} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">System Lockdown</h3>
                  <p className="text-sm text-slate-600 max-w-md">
                    {isLockdownActive 
                      ? 'System is currently in lockdown mode. All user access is disabled and sessions are terminated.' 
                      : 'Enable to immediately lock down all login systems and force logout all active users'}
                  </p>
                </div>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isLockdownActive}
                  onChange={(e) => handleLockdownToggle(e.target.checked)}
                  disabled={loading}
                />
                <div className={`w-14 h-7 ${isLockdownActive ? 'bg-red-600' : 'bg-gray-300'} rounded-full peer relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-md ${isLockdownActive ? 'after:translate-x-7' : ''}`}></div>
              </label>
            </div>
          </div>
        </div>

        {/* Emergency Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Export Users */}
          <button 
            onClick={() => handleExportClick('users')}
            disabled={exporting}
            className="group p-5 border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                {exporting && exportType === 'users' ? (
                  <Loader2 className="w-7 h-7 text-indigo-700 animate-spin" />
                ) : (
                  <Users className="w-7 h-7 text-indigo-700" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Export User Data</h4>
                <p className="text-xs text-slate-600">All user accounts & activity</p>
              </div>
            </div>
          </button>

          {/* Export Admin */}
          <button 
            onClick={() => handleExportClick('admin')}
            disabled={exporting}
            className="group p-5 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl hover:border-purple-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                {exporting && exportType === 'admin' ? (
                  <Loader2 className="w-7 h-7 text-purple-700 animate-spin" />
                ) : (
                  <Database className="w-7 h-7 text-purple-700" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Export Admin Data</h4>
                <p className="text-xs text-slate-600">Admin accounts & controls</p>
              </div>
            </div>
          </button>

          {/* Generate Report */}
          <button 
            onClick={handleGenerateReport}
            disabled={generating}
            className="group p-5 border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl hover:border-green-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                {generating ? (
                  <Loader2 className="w-7 h-7 text-green-700 animate-spin" />
                ) : (
                  <FileText className="w-7 h-7 text-green-700" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">System Report</h4>
                <p className="text-xs text-slate-600">Complete analysis & logs</p>
              </div>
            </div>
          </button>
        </div>

        {/* Help Information */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-600" />
            Emergency Features Overview
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
            <div>
              <p className="font-medium text-slate-700 mb-1">System Lockdown</p>
              <p>Immediately disables all user logins and terminates active sessions</p>
            </div>
            <div>
              <p className="font-medium text-slate-700 mb-1">Data Export</p>
              <p>Downloads complete backup of users or admin data in JSON format</p>
            </div>
            <div>
              <p className="font-medium text-slate-700 mb-1">System Report</p>
              <p>Generates comprehensive security analysis and activity logs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lockdown Confirmation Modal */}
      <ConfirmModal
        isOpen={showLockdownModal}
        onClose={() => {
          setShowLockdownModal(false);
          setLockdownReason('');
        }}
        onConfirm={() => performLockdownToggle(true)}
        title="Activate System Lockdown"
        type="danger"
        confirmText="Activate Lockdown"
        loading={loading}
        disabled={!lockdownReason.trim()}
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm font-semibold text-red-900 mb-2">⚠️ This action will immediately:</p>
            <ul className="text-sm text-red-800 space-y-1 ml-4 list-disc">
              <li>Lock down the entire system</li>
              <li>Force logout ALL active users</li>
              <li>Disable all user logins</li>
              <li>Create a CRITICAL security alert</li>
            </ul>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Reason for Lockdown <span className="text-red-600">*</span>
            </label>
            <textarea
              value={lockdownReason}
              onChange={(e) => setLockdownReason(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows="3"
              placeholder="e.g., Detected security breach from multiple IPs, Suspicious admin activity, System compromise detected..."
              required
            />
            <p className="text-xs text-slate-500 mt-1">This reason will be logged for audit purposes</p>
          </div>
        </div>
      </ConfirmModal>

      {/* Export Confirmation Modal */}
      <ConfirmModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onConfirm={performExport}
        title={`Export ${exportType === 'users' ? 'User' : 'Admin'} Data`}
        type="info"
        confirmText="Download Export"
        loading={exporting}
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            This will download a complete backup of all {exportType === 'users' ? 'user' : 'admin'} data in JSON format.
          </p>
          
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-2">Export includes:</p>
            <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
              {exportType === 'users' ? (
                <>
                  <li>All user accounts (passwords excluded)</li>
                  <li>Login locations and sessions</li>
                  <li>Security alerts related to users</li>
                  <li>Summary statistics</li>
                </>
              ) : (
                <>
                  <li>Admin account details</li>
                  <li>Emergency control history</li>
                  <li>Admin action logs</li>
                  <li>System configurations</li>
                </>
              )}
            </ul>
          </div>
          
          <p className="text-xs text-slate-500">
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            This action will be logged in the security alerts panel
          </p>
        </div>
      </ConfirmModal>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successMessage}
        message={successDetails}
      />
    </>
  );
}
