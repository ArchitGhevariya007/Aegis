import React, { useState, useEffect } from 'react';
import { Shield, Plus, Copy, ChevronLeft, ChevronRight, RotateCw, Trash2 } from 'lucide-react';
import { departmentAPI, storage } from '../../services/api';
import { SuccessModal } from '../common/Modal';

export default function ManageDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    password: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [resetting, setResetting] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [modalPassword, setModalPassword] = useState('');
  const [modalDepartmentName, setModalDepartmentName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
        console.log('Fetched departments:', response.departments);
        response.departments.forEach(dept => {
          console.log(`Department: ${dept.name}, plainPassword: ${dept.plainPassword}, password: ${dept.password}`);
        });
        // Initialize password visibility state
        const visibility = {};
        response.departments.forEach(dept => {
          visibility[dept._id] = false;
        });
        console.log('Initialized password visibility:', visibility);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Department name is required';
    }

    if (!formData.code.trim()) {
      errors.code = 'Department code is required';
    } else if (formData.code.length < 3) {
      errors.code = 'Department code must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const token = storage.getToken();
      const response = await departmentAPI.create(formData, token);

      if (response.success) {
        // Show password in modal
        setModalDepartmentName(formData.name);
        setModalPassword(response.department.password);
        setShowPasswordModal(true);
        setFormData({
          name: '',
          code: '',
          email: '',
          password: '',
          description: ''
        });
        setShowCreateModal(false);
        // Fetch departments after a delay to ensure DB is updated
        setTimeout(() => fetchDepartments(), 500);
      } else {
        setFormErrors({ submit: response.message || 'Failed to create department' });
      }
    } catch (error) {
      console.error('Error creating department:', error);
      setFormErrors({ submit: 'An error occurred while creating the department' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (deptId, deptName) => {
    try {
      setResetting(deptId);
      const token = storage.getToken();
      const response = await departmentAPI.resetPassword(deptId, token);

      if (response.success) {
        // Show password in modal
        setModalDepartmentName(deptName);
        setModalPassword(response.password);
        setShowPasswordModal(true);
        // Fetch departments after a delay
        setTimeout(() => fetchDepartments(), 500);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Failed to reset password. Please try again.');
    } finally {
      setResetting(null);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!departmentToDelete) return;

    try {
      setDeleting(true);
      const token = storage.getToken();
      const response = await departmentAPI.delete(departmentToDelete._id, token);

      if (response.success) {
        setSuccessMessage(`Department "${departmentToDelete.name}" deleted successfully!`);
        setShowSuccessModal(true);
        setShowDeleteConfirm(false);
        setDepartmentToDelete(null);
        fetchDepartments();
      } else {
        alert(response.message || 'Failed to delete department');
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('An error occurred while deleting the department');
    } finally {
      setDeleting(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(departments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDepartments = departments.slice(startIndex, endIndex);

  return (
    <div className="p-6 bg-white rounded-2xl shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Shield className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Manage Departments</h2>
            <p className="text-sm text-slate-500">Create and manage government departments</p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* <button
            onClick={fetchDepartments}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-slate-600" />
          </button> */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Department
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-slate-600 mt-2">Loading departments...</p>
        </div>
      ) : departments.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
          <Shield className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No departments found</p>
          <p className="text-slate-500 text-sm">Create your first department to get started</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Password</th>
                  {/* <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th> */}
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Created</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentDepartments.map((dept) => (
                  <tr key={dept._id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">{dept.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <span className="font-mono bg-slate-100 px-2 py-1 rounded">{dept.code}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <span>{dept.email}</span>
                        <button
                          onClick={() => copyToClipboard(dept.email, `email-${dept._id}`)}
                          className={`p-1.5 rounded transition-colors ${
                            copiedId === `email-${dept._id}`
                              ? 'bg-green-100 text-green-600'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                          title="Copy email"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="flex-1 px-3 py-1.5 bg-slate-100 border-2 border-slate-300 rounded text-sm text-slate-600 font-mono select-none"
                        >
                          ••••••••••••••••
                        </div>
                        <button
                          onClick={() => handleResetPassword(dept._id, dept.name)}
                          disabled={resetting === dept._id}
                          className={`flex-shrink-0 p-1.5 rounded transition-colors ${
                            resetting === dept._id
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'text-slate-600 hover:bg-yellow-100 hover:text-yellow-600'
                          }`}
                          title="Generate new password and view it"
                        >
                          <RotateCw className={`w-4 h-4 ${resetting === dept._id ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </td>
                    {/* <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${
                          dept.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            dept.isActive ? 'bg-green-500' : 'bg-slate-400'
                          }`}
                        ></span>
                        {dept.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td> */}
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(dept.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => {
                          setDepartmentToDelete(dept);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors hover:text-red-700"
                        title="Delete department"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
              <div className="text-sm text-slate-600">
                Showing {startIndex + 1} to {Math.min(endIndex, departments.length)} of {departments.length} departments
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white'
                          : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Department Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowCreateModal(false);
                setFormData({
                  name: '',
                  code: '',
                  email: '',
                  password: '',
                  description: ''
                });
                setFormErrors({});
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-2xl font-bold text-slate-900 mb-6 pr-8">Create New Department</h3>

            <form onSubmit={handleCreateDepartment} className="space-y-5">
              {/* Department Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Department Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Health Department"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1.5">{formErrors.name}</p>
                )}
              </div>

              {/* Department Code */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Department Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g., HEALTH"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
                {formErrors.code && (
                  <p className="text-red-500 text-xs mt-1.5">{formErrors.code}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="e.g., health@example.com"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1.5">{formErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="e.g., Health@123"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
                {formErrors.password && (
                  <p className="text-red-500 text-xs mt-1.5">{formErrors.password}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Department description"
                  rows="2"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                ></textarea>
              </div>

              {formErrors.submit && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-medium">{formErrors.submit}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      name: '',
                      code: '',
                      email: '',
                      password: '',
                      description: ''
                    });
                    setFormErrors({});
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal
          message={successMessage}
          onClose={() => setShowSuccessModal(false)}
        />
      )}

      {/* Password Display Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">🔐 New Password Generated</h3>
            <p className="text-sm text-slate-600 mb-4">
              Department: <span className="font-semibold text-slate-900">{modalDepartmentName}</span>
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-xs text-amber-700 mb-3 font-semibold">⚠️ IMPORTANT:</p>
              <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                <li>Copy this password now - it won't be shown again</li>
                <li>Store it securely in your password manager</li>
                <li>Share it with the department securely</li>
                <li>If forgotten, use Reset button to generate a new one</li>
              </ul>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Password:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={modalPassword}
                  readOnly
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-sm text-slate-700"
                />
                <button
                  onClick={() => {
                    copyToClipboard(modalPassword, 'modal-password');
                    setCopiedId('modal-password');
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                  className={`flex-shrink-0 px-3 py-2 rounded transition-colors font-medium text-sm ${
                    copiedId === 'modal-password'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {copiedId === 'modal-password' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowPasswordModal(false)}
              className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && departmentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-600 mb-2">⚠️ Delete Department</h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to delete <span className="font-semibold text-slate-900">"{departmentToDelete.name}"</span>?
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700 font-semibold mb-2">This action cannot be undone!</p>
              <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                <li>All department data will be permanently deleted</li>
                <li>Any active sessions will be terminated</li>
                <li>No backup will be available</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDepartmentToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDepartment}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
