// [AI] Footer - Links, disclaimer, app version

import React from 'react';
import { Link } from 'react-router-dom';

const APP_VERSION = '1.0.0';

/**
 * Footer - Site footer with links and disclaimer.
 */
export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 'auto',
        padding: 'var(--spacing-xl) var(--spacing-lg)',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-elevated)',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--spacing-md)',
            justifyContent: 'center',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>
            Home
          </Link>
          <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>About</a>
          <Link to="/settings" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>
            Logout
          </Link>
          <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>Privacy</a>
          <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>Contact</a>
        </div>
        <p
          style={{
            textAlign: 'center',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-muted)',
            marginBottom: 'var(--spacing-xs)',
          }}
        >
          Simulated trading only — not real financial advice.
        </p>
        <p style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
          v{APP_VERSION}
        </p>
      </div>
    </footer>
  );
}
