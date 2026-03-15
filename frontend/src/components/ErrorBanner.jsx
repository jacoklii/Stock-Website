// [AI] ErrorBanner - Dismissible error banner for form/API errors

import React from 'react';
import { X } from 'lucide-react';

/**
 * ErrorBanner - Shows error message with optional dismiss.
 * @param {object} props
 * @param {string} props.message - Error message to display
 * @param {function} [props.onDismiss] - Callback when user dismisses
 */
export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div
      className="error-banner"
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--spacing-md)',
        padding: 'var(--spacing-md) var(--spacing-lg)',
        backgroundColor: 'rgba(218, 54, 51, 0.15)',
        border: '1px solid var(--loss-color)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--loss-color)',
        marginBottom: 'var(--spacing-md)',
      }}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: 'var(--spacing-xs)',
          }}
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
