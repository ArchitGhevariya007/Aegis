import React, { useState, useEffect } from 'react';
import { Shield, ChevronDown, ChevronUp, Save, RefreshCw, CheckCircle, XCircle, Building2, FileText } from 'lucide-react';
import { departmentAPI, storage } from '../../services/api';
import { SuccessModal } from '../common/Modal';

export default function RoleViewsPanel() {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const token = storage.getToken();
      const response = await departmentAPI.getAll(token);
      
      if (response.success) {
        setDepartments(response.departments);
        if (response.departments.length > 0 && !selectedDepartment) {
          setSelectedDepartment(response.departments[0]);
          // Expand all categories by default
          const expanded = {};
          response.departments[0].permissions.forEach((_, idx) => {
            expanded[idx] = true;
          });
          setExpandedCategories(expanded);
        }
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentChange = (dept) => {
    setSelectedDepartment(dept);
    // Expand all categories for new department
    const expanded = {};
    dept.permissions.forEach((_, idx) => {
      expanded[idx] = true;
    });
    setExpandedCategories(expanded);
  };

  const toggleCategory = (index) => {
    setExpandedCategories(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleField = async (categoryIndex, fieldIndex) => {
    try {
      const newPermissions = [...selectedDepartment.permissions];
      const currentValue = newPermissions[categoryIndex].fields[fieldIndex].enabled;
      newPermissions[categoryIndex].fields[fieldIndex].enabled = !currentValue;

      // Optimistic update
      setSelectedDepartment({ ...selectedDepartment, permissions: newPermissions });

      // Save to backend
      const token = storage.getToken();
      await departmentAPI.toggleField(
        selectedDepartment._id,
        categoryIndex,
        fieldIndex,
        !currentValue,
        token
      );
    } catch (error) {
      console.error('Failed to toggle field:', error);
      // Revert on error
      fetchDepartments();
    }
  };

  const toggleAllInCategory = async (categoryIndex, enable) => {
    try {
      const newPermissions = [...selectedDepartment.permissions];
      newPermissions[categoryIndex].fields.forEach(field => {
        field.enabled = enable;
      });

      // Optimistic update
      setSelectedDepartment({ ...selectedDepartment, permissions: newPermissions });

      // Save to backend
      const token = storage.getToken();
      await departmentAPI.toggleCategory(
        selectedDepartment._id,
        categoryIndex,
        enable,
        token
      );
    } catch (error) {
      console.error('Failed to toggle category:', error);
      // Revert on error
      fetchDepartments();
    }
  };

  const saveAllChanges = async () => {
    try {
      setSaving(true);
      const token = storage.getToken();
      const response = await departmentAPI.updatePermissions(
        selectedDepartment._id,
        selectedDepartment.permissions,
        token
      );

      if (response.success) {
        setSuccessMessage(`Permissions updated successfully for ${selectedDepartment.name}`);
        setShowSuccessModal(true);
        await fetchDepartments();
      }
    } catch (error) {
      console.error('Failed to save changes:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStats = (department) => {
    if (!department) return { total: 0, enabled: 0, disabled: 0 };
    
    let total = 0;
    let enabled = 0;
    
    department.permissions.forEach(category => {
      category.fields.forEach(field => {
        total++;
        if (field.enabled) enabled++;
      });
    });
    
    return {
      total,
      enabled,
      disabled: total - enabled,
      percentage: total > 0 ? Math.round((enabled / total) * 100) : 0
    };
  };

  if (loading) {
  return (
    <div className="p-6 bg-white rounded-2xl shadow">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      </div>
    );
  }

  const stats = getStats(selectedDepartment);

  return (
    <>
      <div className="p-6 bg-white rounded-2xl shadow">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Department Permissions</h2>
              <p className="text-sm text-slate-500">Manage data access for government departments</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              fetchDepartments();
            }}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Department Selector */}
      <div className="mb-6">
          <label className="block mb-2 text-sm font-semibold text-slate-700">
            Select Department
        </label>
        <select
            value={selectedDepartment?._id || ''}
            onChange={(e) => {
              const dept = departments.find(d => d._id === e.target.value);
              handleDepartmentChange(dept);
            }}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name} ({dept.code})
            </option>
          ))}
        </select>
          {selectedDepartment?.description && (
            <p className="mt-2 text-sm text-slate-600 flex items-start gap-2">
              <Building2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {selectedDepartment.description}
            </p>
          )}
        </div>

        {/* Statistics Cards */}
        {selectedDepartment && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Fields</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Enabled</p>
                  <p className="text-2xl font-bold text-green-900">{stats.enabled}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Disabled</p>
                  <p className="text-2xl font-bold text-red-900">{stats.disabled}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Access Rate</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.percentage}%</p>
                </div>
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </div>
        )}

        {/* Permissions List */}
        {selectedDepartment && (
          <div className="space-y-4">
            {selectedDepartment.permissions.map((category, categoryIndex) => {
              const categoryStats = {
                total: category.fields.length,
                enabled: category.fields.filter(f => f.enabled).length
              };
              const allEnabled = categoryStats.enabled === categoryStats.total;
              const noneEnabled = categoryStats.enabled === 0;

              return (
                <div key={categoryIndex} className="border border-slate-200 rounded-xl overflow-hidden">
                  {/* Category Header */}
                  <div className="bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleCategory(categoryIndex);
                          }}
                          className="p-1 hover:bg-slate-200 rounded transition-colors"
                        >
                          {expandedCategories[categoryIndex] ? (
                            <ChevronUp className="w-5 h-5 text-slate-600" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-600" />
                          )}
                        </button>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{category.category}</h3>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {categoryStats.enabled} of {categoryStats.total} enabled
                          </p>
                        </div>
      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleAllInCategory(categoryIndex, true);
                          }}
                          disabled={allEnabled}
                          className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Enable All
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleAllInCategory(categoryIndex, false);
                          }}
                          disabled={noneEnabled}
                          className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Disable All
                        </button>
                      </div>
      </div>
    </div>

                  {/* Category Fields */}
                  {expandedCategories[categoryIndex] && (
                    <div className="p-4 space-y-2">
                      {category.fields.map((field, fieldIndex) => (
                        <div
                          key={fieldIndex}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <span className="text-sm text-slate-700">{field.name}</span>
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={field.enabled}
                              onChange={() => toggleField(categoryIndex, fieldIndex)}
                            />
                            <div className={`w-11 h-6 ${field.enabled ? 'bg-green-600' : 'bg-gray-300'} rounded-full peer relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md ${field.enabled ? 'after:translate-x-5' : ''}`}></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Save Button */}
        {selectedDepartment && (
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                saveAllChanges();
              }}
              disabled={saving}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              title="Save all permission changes"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Permissions Updated"
        message={successMessage}
      />
    </>
  );
}
