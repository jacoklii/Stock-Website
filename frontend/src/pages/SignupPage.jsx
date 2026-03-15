// [AI] SignupPage - 2-step registration (Account setup -> Portfolio setup)

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from '../components/ErrorBanner';

const REGIONS = [
  { code: 'US', label: 'United States', currency: 'USD' },
  { code: 'CA', label: 'Canada', currency: 'CAD' },
  { code: 'GB', label: 'United Kingdom', currency: 'GBP' },
];

const CASH_PRESETS = [1000, 10000, 100000];

/**
 * SignupPage - Two-step registration flow.
 */
export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [region, setRegion] = useState('US');
  const [portfolioName, setPortfolioName] = useState('');
  const [startingCash, setStartingCash] = useState(10000);
  const [currency, setCurrency] = useState('USD');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, login } = useAuth();
  const navigate = useNavigate();

  const selectedRegion = REGIONS.find((r) => r.code === region);

  const validateStep1 = () => {
    if (!username.trim()) {
      setError('Username is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!portfolioName.trim()) {
      setError('Portfolio name is required');
      return false;
    }
    if (startingCash <= 0) {
      setError('Starting cash must be positive');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (validateStep1()) setStep(2);
  };

  const handlePortfolioNameFocus = () => {
    if (!portfolioName) setPortfolioName(username);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (step === 1) {
      handleNext();
      return;
    }
    if (!validateStep2()) return;

    setLoading(true);
    const { data: signupData, error: signupErr } = await signup({
      username: username.trim(),
      password,
      region,
      portfolio_name: portfolioName.trim(),
      starting_cash: startingCash,
      currency,
    });

    if (signupErr) {
      setError(signupErr.message ?? signupErr.msg ?? 'Registration failed. Please try again.');
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate('/');
  };

  return (
    <div className="page-enter container" style={{ maxWidth: 480, paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}>
      <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>Sign up</h1>
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: step >= 1 ? 'var(--accent-color)' : 'var(--border-color)',
            color: step >= 1 ? 'var(--bg-base)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
          }}
        >
          1
        </span>
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: step >= 2 ? 'var(--accent-color)' : 'var(--border-color)',
            color: step >= 2 ? 'var(--bg-base)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
          }}
        >
          2
        </span>
      </div>
      <ErrorBanner message={error} onDismiss={() => setError('')} />
      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <>
            <div className="form-group">
              <label htmlFor="signup-username">Username</label>
              <input
                id="signup-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="signup-confirm">Confirm Password</label>
              <input
                id="signup-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="signup-region">Region</label>
              <select
                id="signup-region"
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  const r = REGIONS.find((x) => x.code === e.target.value);
                  if (r) setCurrency(r.currency);
                }}
              >
                {REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>{r.label}</option>
                ))}
              </select>
            </div>
            <button type="button" className="btn btn-primary" onClick={handleNext} style={{ width: '100%' }}>
              Next
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <div className="form-group">
              <label htmlFor="signup-portfolio-name">Portfolio Name</label>
              <input
                id="signup-portfolio-name"
                type="text"
                value={portfolioName}
                onChange={(e) => setPortfolioName(e.target.value)}
                onFocus={handlePortfolioNameFocus}
                placeholder={username}
              />
            </div>
            <div className="form-group">
              <label>Starting Cash</label>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                {CASH_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={startingCash === p ? 'btn btn-primary' : 'btn btn-secondary'}
                    onClick={() => setStartingCash(p)}
                  >
                    ${p.toLocaleString()}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={startingCash}
                onChange={(e) => setStartingCash(Number(e.target.value) || 0)}
                min={1}
                style={{ marginTop: 'var(--spacing-sm)' }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="signup-currency">Currency</label>
              <select
                id="signup-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="CAD">CAD</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(1)}
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                {loading ? 'Creating...' : 'Create Portfolio'}
              </button>
            </div>
          </>
        )}
      </form>
      <p style={{ marginTop: 'var(--spacing-lg)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--accent-color)' }}>Log in</Link>
      </p>
    </div>
  );
}
