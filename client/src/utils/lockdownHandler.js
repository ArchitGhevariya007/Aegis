// Centralized lockdown detection and handling
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AlertCircle } from 'lucide-react';
import Modal from '../Components/common/Modal';

// Lockdown Modal Component using universal Modal
const LockdownModal = ({ message, onClose }) => {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="System Lockdown"
      subtitle="Security Protocol Active"
      type="lockdown"
      showClose={false}
      fullHeader={true}
    >
      <div className="space-y-4">
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
          <p className="text-slate-800 leading-relaxed">
            {message || 'System is currently in lockdown mode. All user access is temporarily disabled.'}
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-slate-700 font-medium mb-1">
              You have been logged out for security reasons.
            </p>
            <p className="text-xs text-slate-600">
              Please contact your system administrator for more information or try again later.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Return to Login
        </button>
      </div>
    </Modal>
  );
};

export const checkLockdown = async (response) => {
  if (response.status === 403) {
    try {
      const data = await response.json();
      if (data.lockdown === true || data.message?.includes('lockdown')) {
        // System is in lockdown mode
        handleLockdown(data.message || 'System is currently in lockdown mode. All user access is temporarily disabled.');
        return true;
      }
    } catch (e) {
      // Not JSON or couldn't parse
    }
  }
  return false;
};

export const handleLockdown = (message) => {
  // Clear user data
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  
  // Create modal container
  const modalRoot = document.createElement('div');
  modalRoot.id = 'lockdown-modal-root';
  document.body.appendChild(modalRoot);

  // Render modal
  const root = ReactDOM.createRoot(modalRoot);
  root.render(
    <LockdownModal
      message={message}
      onClose={() => {
        root.unmount();
        document.body.removeChild(modalRoot);
        window.location.href = '/login';
      }}
    />
  );
};

export const createLockdownAwareFetch = (url, options = {}) => {
  return fetch(url, options).then(async (response) => {
    // Check for lockdown before processing response
    const isLockdown = await checkLockdown(response.clone());
    if (isLockdown) {
      throw new Error('LOCKDOWN_ACTIVE');
    }
    return response;
  });
};

