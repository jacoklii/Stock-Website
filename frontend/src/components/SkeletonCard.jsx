// [AI] SkeletonCard - Shimmer placeholder for async-loading sections

import React from 'react';

/**
 * SkeletonCard - Loading skeleton with shimmer animation.
 * @param {object} props
 * @param {string} [props.className] - Additional class names
 * @param {string} [props.height] - Min height (e.g. '120px', '200px')
 */
export default function SkeletonCard({ className = '', height = '120px' }) {
  return (
    <div
      className={`skeleton-card ${className}`}
      style={{
        minHeight: height,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        className="skeleton-shimmer"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      />
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
