// [AI] LoginPage - Username + password, Remember me, link to signup

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from '../components/ErrorBanner';

/**
 * LoginPage - Login form with username and password.
 */
export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await login(username, password);
    setLoading(false);
    if (err) {
      const msg = err.message ?? err.msg ?? 'Invalid credentials. Please try again.';
      setError(typeof msg === 'string' ? msg : 'Invalid credentials. Please try again.');
      return;
    }
    navigate('/');
  };

  return (
    <div className="page-enter container" style={{ maxWidth: 420, paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}>
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Log in</h1>
      <ErrorBanner message={error} onDismiss={() => setError('')} />
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="login-username">Username</label>
          <input
            id="login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>
        <div className="form-group">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <input
            id="login-remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <label htmlFor="login-remember" style={{ marginBottom: 0 }}>Remember me</label>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Signing in...' : 'Log in'}
        </button>
      </form>
      <p style={{ marginTop: 'var(--spacing-lg)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
        Don&apos;t have an account? <Link to="/signup" style={{ color: 'var(--accent-color)' }}>Sign up</Link>
      </p>
    </div>
  );
}
