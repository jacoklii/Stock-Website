// [AI] Watchlist API - get, add, remove
// All functions return { data, error } and never throw.

import apiClient, { toDataError } from './api';

/** Normalize watchlist item for frontend (id, ticker, symbol) */
function normalizeWatchlistItem(w) {
  if (!w) return null;
  return {
    ...w,
    id: w.id ?? w.watchlist_id,
    ticker: w.ticker ?? w.stock_symbol ?? w.symbol,
    symbol: w.symbol ?? w.stock_symbol ?? w.ticker,
  };
}

/**
 * Get watchlist for a portfolio.
 * @param {number} portfolioId
 * @returns {Promise<{data?: array, error?: object}>}
 */
export async function getWatchlist(portfolioId) {
  const result = await toDataError(
    apiClient.get(`/api/portfolios/${portfolioId}/watchlist`)
  );
  const raw = result.data?.watchlist ?? result.data ?? [];
  const data = Array.isArray(raw) ? raw.map(normalizeWatchlistItem) : [];
  return { data, error: result.error };
}

/**
 * Add ticker to watchlist.
 * @param {number} portfolioId
 * @param {string} ticker
 * @returns {Promise<{data?: object, error?: object}>}
 */
export async function addTicker(portfolioId, ticker) {
  return toDataError(
    apiClient.post(`/api/portfolios/${portfolioId}/watchlist`, {
      stock_symbol: ticker,
    })
  );
}

/**
 * Remove item from watchlist.
 * @param {number} portfolioId
 * @param {number} watchlistId - ID of watchlist entry to remove
 * @returns {Promise<{data?: object, error?: object}>}
 */
export async function removeTicker(portfolioId, watchlistId) {
  return toDataError(
    apiClient.delete(`/api/portfolios/${portfolioId}/watchlist/${watchlistId}`)
  );
}
