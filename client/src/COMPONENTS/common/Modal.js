import React from 'react';
import { X, AlertTriangle, Info, CheckCircle, Lock, Shield, AlertCircle } from 'lucide-react';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle,
  children, 
  type = 'info', 
  showClose = true,
  customIcon,
  fullHeader = false
}) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      bg: 'bg-red-50',
      headerBg: 'bg-gradient-to-r from-red-600 to-red-700',
      border: 'border-red-200',
      icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
      headerIcon: <AlertTriangle className="w-8 h-8" />,
      titleColor: 'text-red-900',
      headerTitleColor: 'text-white',
      subtitleColor: 'text-red-100'
    },
    info: {
      bg: 'bg-blue-50',
      headerBg: 'bg-gradient-to-r from-blue-600 to-indigo-700',
      border: 'border-blue-200',
      icon: <Info className="w-6 h-6 text-blue-600" />,
      headerIcon: <Info className="w-8 h-8" />,
      titleColor: 'text-blue-900',
      headerTitleColor: 'text-white',
      subtitleColor: 'text-blue-100'
    },
    success: {
      bg: 'bg-green-50',
      headerBg: 'bg-gradient-to-r from-green-600 to-emerald-700',
      border: 'border-green-200',
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
      headerIcon: <CheckCircle className="w-8 h-8" />,
      titleColor: 'text-green-900',
      headerTitleColor: 'text-white',
      subtitleColor: 'text-green-100'
    },
    warning: {
      bg: 'bg-amber-50',
      headerBg: 'bg-gradient-to-r from-amber-600 to-orange-700',
      border: 'border-amber-200',
      icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
      headerIcon: <AlertTriangle className="w-8 h-8" />,
      titleColor: 'text-amber-900',
      headerTitleColor: 'text-white',
      subtitleColor: 'text-amber-100'
    },
    lockdown: {
      bg: 'bg-red-50',
      headerBg: 'bg-gradient-to-r from-red-600 to-red-700',
      border: 'border-red-200',
      icon: <Lock className="w-6 h-6 text-red-600" />,
      headerIcon: <Lock className="w-8 h-8" />,
      titleColor: 'text-red-900',
      headerTitleColor: 'text-white',
      subtitleColor: 'text-red-100'
    },
    security: {
      bg: 'bg-slate-50',
      headerBg: 'bg-gradient-to-r from-slate-700 to-slate-900',
      border: 'border-slate-200',
      icon: <Shield className="w-6 h-6 text-slate-600" />,
      headerIcon: <Shield className="w-8 h-8" />,
      titleColor: 'text-slate-900',
      headerTitleColor: 'text-white',
      subtitleColor: 'text-slate-300'
    }
  };

  const style = typeStyles[type] || typeStyles.info;
  const displayIcon = customIcon || (fullHeader ? style.headerIcon : style.icon);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
        onClick={showClose ? onClose : undefined}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
        {/* Header */}
        {fullHeader ? (
          <div className={`${style.headerBg} p-6 text-white`}>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                {displayIcon}
              </div>
              <div className="flex-1">
                <h2 className={`text-2xl font-bold ${style.headerTitleColor}`}>{title}</h2>
                {subtitle && <p className={`text-sm mt-1 ${style.subtitleColor}`}>{subtitle}</p>}
              </div>
              {showClose && (
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={`flex items-center gap-3 p-6 border-b ${style.border} ${style.bg}`}>
            {displayIcon}
            <h3 className={`text-lg font-semibold flex-1 ${style.titleColor}`}>{title}</h3>
            {showClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'danger',
  loading = false,
  disabled = false,
  children
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} type={type} showClose={!loading}>
      <div className="space-y-4">
        {message && <p className="text-slate-600">{message}</p>}
        {children}
        
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || disabled}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              type === 'danger'
                ? 'bg-red-600 text-white hover:bg-red-700 disabled:hover:bg-red-600'
                : type === 'success'
                ? 'bg-green-600 text-white hover:bg-green-700 disabled:hover:bg-green-600'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:hover:bg-indigo-600'
            }`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function SuccessModal({ isOpen, onClose, title, message, children }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} type="success" showClose={false}>
      <div className="space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        {/* Message */}
        {message && (
          <div className="text-center">
            <p className="text-slate-700 text-base whitespace-pre-line">{message}</p>
          </div>
        )}
        {children}
        
        {/* Close Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

