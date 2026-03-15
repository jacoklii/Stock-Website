// [AI] SettingsPage - Account, Portfolio, Transactions, Preferences, Appearance, Logs

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortfolio } from '../context/PortfolioContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import {
  getTransactions,
  resetPortfolio,
} from '../utils/portfolio';
import {
  updatePortfolioName,
  changePassword,
  getLogs,
  exportCSV,
  getPreferences,
  updatePreferences,
} from '../utils/settings';
import ConfirmModal from '../components/ConfirmModal';
import ErrorBanner from '../components/ErrorBanner';

const SECTIONS = ['account', 'portfolio', 'transactions', 'preferences', 'appearance', 'logs'];
const ACCENT_COLORS = ['#00FF88', '#58a6ff', '#a371f7', '#f85149'];

/**
 * SettingsPage - Settings hub with sidebar nav.
 */
export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { portfolio, refresh } = usePortfolio();
  const { theme, accentColor, fontSize, toggleTheme, setAccentColor, setFontSize } = useTheme();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('account');
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [prefs, setPrefs] = useState({ defaultTradeMode: 'shares', defaultNewsTab: 'market', newsPerPage: 20 });
  const [portfolioName, setPortfolioName] = useState('');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [tickerFilter, setTickerFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPortfolioName(portfolio?.name ?? '');
  }, [portfolio?.name]);

  useEffect(() => {
    if (portfolio?.id && (activeSection === 'transactions' || activeSection === 'logs')) {
      if (activeSection === 'transactions') {
        getTransactions(portfolio.id, { ticker: tickerFilter, dateFrom, dateTo }).then(({ data }) =>
          setTransactions(data ?? [])
        );
      } else {
        getLogs(portfolio.id).then(({ data }) => setLogs(data ?? []));
      }
    }
  }, [portfolio?.id, activeSection, tickerFilter, dateFrom, dateTo]);

  useEffect(() => {
    getPreferences().then(({ data }) => data && setPrefs(data));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleUpdateName = async () => {
    if (!portfolio?.id || !portfolioName.trim()) return;
    setLoading(true);
    const { error: err } = await updatePortfolioName(portfolio.id, portfolioName.trim());
    setLoading(false);
    if (err) setError(err.message ?? 'Failed to update');
    else await refresh();
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwNew !== pwConfirm) {
      setError('New passwords do not match');
      return;
    }
    if (pwNew.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error: err } = await changePassword({ currentPassword: pwCurrent, newPassword: pwNew });
    setLoading(false);
    if (err) setError(err.message ?? 'Failed to change password');
    else {
      setPwCurrent('');
      setPwNew('');
      setPwConfirm('');
      setError('');
    }
  };

  const handleResetPortfolio = async () => {
    if (resetConfirmText !== 'RESET') return;
    if (!portfolio?.id) return;
    setLoading(true);
    const { error: err } = await resetPortfolio(portfolio.id);
    setLoading(false);
    if (err) setError(err.message ?? 'Failed to reset');
    else {
      await refresh();
      setResetConfirmOpen(false);
      setResetConfirmText('');
    }
  };

  const handleExportCSV = async () => {
    if (!portfolio?.id) return;
    const { data, error: err } = await exportCSV(portfolio.id, { dateFrom, dateTo, ticker: tickerFilter });
    if (err) setError(err.message ?? 'Export failed');
    else if (data) {
      const blob = data instanceof Blob ? data : new Blob([data]);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `transactions-${portfolio.id}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  };

  const handleSavePrefs = async () => {
    const { error: err } = await updatePreferences(prefs);
    if (err) setError(err.message ?? 'Failed to save');
    else setError('');
  };

  return (
    <div className="page-enter container" style={{ display: 'flex', gap: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
      <aside style={{ flex: '0 0 180px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
        {SECTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className={activeSection === s ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ textAlign: 'left', textTransform: 'capitalize' }}
            onClick={() => setActiveSection(s)}
          >
            {s}
          </button>
        ))}
      </aside>
      <div style={{ flex: 1, minWidth: 280 }}>
        <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Settings</h1>
        <ErrorBanner message={error} onDismiss={() => setError('')} />

        {activeSection === 'account' && (
          <div className="card">
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Account</h3>
            <p>Username: <strong>{user?.username ?? '-'}</strong></p>
            <p>Region: <strong>{user?.region ?? '-'}</strong></p>
            <p>Currency: <strong>{portfolio?.currency ?? 'USD'}</strong></p>
            <form onSubmit={handleChangePassword} style={{ marginTop: 'var(--spacing-lg)' }}>
              <h4 style={{ marginBottom: 'var(--spacing-md)' }}>Change Password</h4>
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} minLength={6} required />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>Change Password</button>
            </form>
            <button type="button" className="btn btn-danger" style={{ marginTop: 'var(--spacing-lg)' }} onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}

        {activeSection === 'portfolio' && (
          <div className="card">
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Portfolio</h3>
            <div className="form-group">
              <label>Portfolio Name</label>
              <input value={portfolioName} onChange={(e) => setPortfolioName(e.target.value)} />
            </div>
            <button type="button" className="btn btn-primary" disabled={loading} onClick={handleUpdateName}>
              Save
            </button>
            <h4 style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-md)' }}>Reset Portfolio</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-md)' }}>
              This will clear all holdings and transactions and restore starting cash.
            </p>
            <button type="button" className="btn btn-danger" onClick={() => setResetConfirmOpen(true)}>
              Reset Portfolio
            </button>
          </div>
        )}

        {activeSection === 'transactions' && (
          <div className="card">
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Transactions</h3>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', marginBottom: 'var(--spacing-md)' }}>
              <input
                type="text"
                placeholder="Filter by ticker"
                value={tickerFilter}
                onChange={(e) => setTickerFilter(e.target.value)}
                style={{ maxWidth: 120 }}
              />
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              <button type="button" className="btn btn-secondary" onClick={handleExportCSV}>
                Export CSV
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Ticker</th>
                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Action</th>
                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Shares</th>
                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Price</th>
                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, i) => (
                    <tr key={t.id ?? i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: 'var(--spacing-md)' }}>{t.date ?? t.created_at ?? '-'}</td>
                      <td className="font-mono" style={{ padding: 'var(--spacing-md)' }}>{t.ticker ?? t.stock_symbol ?? '-'}</td>
                      <td style={{ padding: 'var(--spacing-md)' }}>{t.action ?? t.type ?? '-'}</td>
                      <td style={{ padding: 'var(--spacing-md)' }}>{t.shares ?? '-'}</td>
                      <td className="font-mono" style={{ padding: 'var(--spacing-md)' }}>${Number(t.price_per_share ?? t.price ?? 0).toFixed(2)}</td>
                      <td className="font-mono" style={{ padding: 'var(--spacing-md)' }}>${Number(t.total ?? 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'preferences' && (
          <div className="card">
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Preferences</h3>
            <div className="form-group">
              <label>Default Trade Input Mode</label>
              <select value={prefs.defaultTradeMode} onChange={(e) => setPrefs({ ...prefs, defaultTradeMode: e.target.value })}>
                <option value="shares">Shares</option>
                <option value="dollar">Dollar</option>
              </select>
            </div>
            <div className="form-group">
              <label>Default News Tab</label>
              <select value={prefs.defaultNewsTab} onChange={(e) => setPrefs({ ...prefs, defaultNewsTab: e.target.value })}>
                <option value="market">Market</option>
                <option value="portfolio">Portfolio</option>
                <option value="watchlist">Watchlist</option>
              </select>
            </div>
            <div className="form-group">
              <label>News Items Per Page</label>
              <input
                type="number"
                value={prefs.newsPerPage}
                onChange={(e) => setPrefs({ ...prefs, newsPerPage: Number(e.target.value) || 20 })}
                min={5}
                max={50}
              />
            </div>
            <button type="button" className="btn btn-primary" onClick={handleSavePrefs}>Save</button>
          </div>
        )}

        {activeSection === 'appearance' && (
          <div className="card">
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Appearance</h3>
            <div className="form-group">
              <label>Theme</label>
              <button type="button" className={theme === 'dark' ? 'btn btn-primary' : 'btn btn-secondary'} onClick={toggleTheme}>
                {theme === 'dark' ? 'Dark' : 'Light'}
              </button>
            </div>
            <div className="form-group">
              <label>Accent Color</label>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAccentColor(c)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: c,
                      border: accentColor === c ? '3px solid white' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                    }}
                    aria-label={`Accent ${c}`}
                  />
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Font Size</label>
              <select value={fontSize} onChange={(e) => setFontSize(e.target.value)}>
                <option value="normal">Normal</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        )}

        {activeSection === 'logs' && (
          <div className="card">
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Logs</h3>
            <div style={{ maxHeight: 300, overflowY: 'auto', fontSize: 'var(--font-size-sm)' }}>
              {logs.length > 0 ? (
                logs.map((l, i) => (
                  <div key={i} style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{l.timestamp ?? l.date ?? '-'}</span> {l.message ?? l.event ?? JSON.stringify(l)}
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>No logs.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={resetConfirmOpen}
        onClose={() => { setResetConfirmOpen(false); setResetConfirmText(''); }}
        onConfirm={handleResetPortfolio}
        title="Reset Portfolio"
        confirmLabel="Reset"
        confirmVariant="danger"
        confirmDisabled={resetConfirmText !== 'RESET'}
      >
        <p>This will clear all holdings and transactions. Type RESET to confirm.</p>
        <input
          type="text"
          value={resetConfirmText}
          onChange={(e) => setResetConfirmText(e.target.value)}
          placeholder="Type RESET"
          style={{ marginTop: 'var(--spacing-md)' }}
        />
      </ConfirmModal>
    </div>
  );
}
