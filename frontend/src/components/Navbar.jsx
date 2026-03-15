// [AI] Navbar - Nav links, portfolio name + cash, user avatar; hamburger on mobile

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePortfolio } from '../context/PortfolioContext';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/news', label: 'News' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/watchlist', label: 'Watchlist' },
  { to: '/settings', label: 'Settings' },
];

/**
 * Navbar - Main navigation bar with active route highlight.
 */
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { portfolio, cash } = usePortfolio();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'U';

  const formatCash = (n) => {
    if (typeof n !== 'number') return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: portfolio?.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  };

  return (
    <nav
      style={{
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border-color)',
        padding: 'var(--spacing-md) var(--spacing-lg)',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xl)' }}>
          <NavLink
            to="/"
            style={{
              fontWeight: 600,
              fontSize: 'var(--font-size-lg)',
              color: 'var(--text-primary)',
              textDecoration: 'none',
            }}
          >
            Portfolio
          </NavLink>

          <div
            className="nav-links"
            style={{
              display: 'none',
              gap: 'var(--spacing-sm)',
            }}
          >
            {LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                style={({ isActive }) => ({
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                })}
              >
                {label}
              </NavLink>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-secondary nav-mobile-toggle"
            style={{ padding: 'var(--spacing-sm)', minWidth: 'auto' }}
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
          {portfolio?.name && (
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {portfolio.name}
            </span>
          )}
          <span className="font-mono" style={{ color: 'var(--gain-color)', fontWeight: 500 }}>
            {formatCash(cash)}
          </span>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--accent-color)',
              color: 'var(--bg-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {initials}
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: 'var(--spacing-xs)', minWidth: 'auto' }}
            onClick={handleLogout}
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="mobile-nav-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-xs)',
            marginTop: 'var(--spacing-md)',
            paddingTop: 'var(--spacing-md)',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          {LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 400,
              })}
            >
              {label}
            </NavLink>
          ))}
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .nav-links { display: flex !important; }
          .nav-mobile-toggle { display: none !important; }
          .mobile-nav-panel { display: none !important; }
        }
        @media (max-width: 767px) {
          .nav-links { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
