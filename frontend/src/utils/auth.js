// [AI] Auth API - login, signup, logout
// All functions return { data, error } and never throw.

import apiClient, { toDataError } from './api';

/**
 * User login.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{data?: object, error?: object}>}
 */
export async function login(username, password) {
  const result = await toDataError(
    apiClient.post('/api/auth/login', { username, password })
  );
  if (result.data?.token) {
    localStorage.setItem('authToken', result.data.token);
  }
  return result;
}

/**
 * User registration (signup).
 * @param {object} payload - { username, password, region?, ... }
 * @returns {Promise<{data?: object, error?: object}>}
 */
export async function signup(payload) {
  const result = await toDataError(
    apiClient.post('/api/auth/register', payload)
  );
  if (result.data?.token) {
    localStorage.setItem('authToken', result.data.token);
  }
  return result;
}

/**
 * User logout. Calls backend if available, clears local token.
 * @returns {Promise<{data?: object, error?: object}>}
 */
export async function logout() {
  const result = await toDataError(
    apiClient.post('/api/auth/logout').catch(() => ({ data: null }))
  );
  localStorage.removeItem('authToken');
  return { data: null, error: null };
}
