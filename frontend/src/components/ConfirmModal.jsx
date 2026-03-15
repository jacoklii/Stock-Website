// [AI] ConfirmModal - Confirmation dialog for destructive actions

import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * ConfirmModal - Modal for confirming destructive actions (execute trade, reset portfolio, etc.)
 * @param {object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {function} props.onClose - Called when user cancels
 * @param {function} props.onConfirm - Called when user confirms
 * @param {string} props.title - Modal title
 * @param {string|React.ReactNode} props.children - Modal body content
 * @param {string} [props.confirmLabel='Confirm'] - Confirm button label
 * @param {string} [props.confirmVariant='danger'] - 'danger' | 'primary'
 * @param {boolean} [props.confirmDisabled] - Disable confirm button
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  confirmDisabled = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--spacing-lg)',
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-xl)',
          maxWidth: 420,
          width: '100%',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
          <AlertTriangle size={24} color="var(--warning-color)" style={{ flexShrink: 0 }} />
          <div>
            <h2
              id="confirm-modal-title"
              style={{ marginBottom: 'var(--spacing-sm)', fontSize: 'var(--font-size-lg)' }}
            >
              {title}
            </h2>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {children}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={confirmVariant === 'danger' ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={() => onConfirm()}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
