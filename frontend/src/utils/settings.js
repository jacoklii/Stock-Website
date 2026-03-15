// [AI] Settings API - export CSV, preferences, logs, change password, update portfolio name
// Uses real backend; preferences/logs fallback to local defaults when endpoints unavailable.

import apiClient, { toDataError } from './api';

const DEFAULT_PREFERENCES = {
  defaultTradeMode: 'shares',
  defaultNewsTab: 'market',
  newsPerPage: 20,
};

/**
 * Export transactions as CSV.
 * @param {number} portfolioId
 * @param {object} filters - { dateFrom?, dateTo?, ticker? }
 * @returns {Promise<{data?: blob|string, error?: object}>}
 */
export async function exportCSV(portfolioId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set('date_from', filters.dateFrom);
  if (filters.dateTo) params.set('date_to', filters.dateTo);
  if (filters.ticker) params.set('ticker', filters.ticker);
  const qs = params.toString();
  const url = qs
    ? `/api/portfolios/${portfolioId}/transactions/export?${qs}`
    : `/api/portfolios/${portfolioId}/transactions/export`;
  const result = await toDataError(
    apiClient.get(url, { responseType: 'blob' })
  );
  return result;
}

/**
 * Get user preferences.
 * @returns {Promise<{data?: object, error?: object}>}
 */
export async function getPreferences() {
  const result = await toDataError(apiClient.get('/api/users/preferences'));
  if (result.error) {
    return { data: DEFAULT_PREFERENCES, error: null };
  }
  return result;
}

/**
 * Update user preferences.
 * @param {object} payload - { defaultTradeMode?, defaultNewsTab?, newsPerPage? }
 * @returns {Promise<{data?: object, error?: object}>}
 */
export async function updatePreferences(payload) {
  return toDataError(apiClient.patch('/users/preferences', payload));
}

/**
 * Get event logs (login times, trades, errors).
 * @param {number} portfolioId - Optional
 * @returns {Promise<{data?: array, error?: object}>}
 */
export async function getLogs(portfolioId) {
  const url = portfolioId
    ? `/api/portfolios/${portfolioId}/logs`
    : '/logs';
  const result = await toDataError(apiClient.get(url));
  if (result.error) {
    return { data: [], error: null };
  }
  const data = result.data?.logs ?? result.data ?? [];
  return { data: Array.isArray(data) ? data : [], error: result.error };
}

/**
 * Change user password.
 * @param {object} payload - { currentPassword, newPassword } (or current_password, new_password)
 * @returns {Promise<{data?: object, error?: object}>}
 */
export async function changePassword(payload) {
  const body = {
    current_password: payload.currentPassword ?? payload.current_password,
    new_password: payload.newPassword ?? payload.new_password,
  };
  return toDataError(apiClient.patch('/api/users/password', body));  // requires JWT
}

/**
 * Update portfolio name.
 * @param {number} portfolioId
 * @param {string} name
 * @returns {Promise<{data?: object, error?: object}>}
 */
export async function updatePortfolioName(portfolioId, name) {
  return toDataError(
    apiClient.patch(`/api/portfolios/${portfolioId}`, { portfolio_name: name })
  );
}
