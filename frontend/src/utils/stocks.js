// [AI] Stocks API - search, price, movers, indices, history
// Uses real backend at /api/stocks/*

import apiClient, { toDataError } from './api';

/**
 * Search tickers by query.
 * @param {string} query
 * @returns {Promise<{data?: array, error?: object}>}
 */
export async function searchTicker(query) {
  if (!query || !query.trim()) {
    return { data: [], error: null };
  }
  const result = await toDataError(
    apiClient.get('/api/stocks/search', { params: { q: query.trim() } })
  );
  if (result.error) return { data: [], error: result.error };
  const raw = result.data;
  const data = Array.isArray(raw) ? raw : [];
  // Normalize: backend may return { symbol, shortName, longName }
  return {
    data: data.map((t) => ({
      symbol: t.symbol ?? t.ticker,
      name: t.shortName ?? t.longName ?? t.name ?? t.symbol,
    })),
    error: null,
  };
}

/**
 * Get current price for a ticker.
 * @param {string} ticker
 * @returns {Promise<{data?: {price: number, changePercent?: number}|number, error?: object}>}
 */
export async function getPrice(ticker) {
  if (!ticker) return { data: null, error: { message: 'Ticker required' } };
  const sym = (typeof ticker === 'string' ? ticker : ticker?.symbol ?? ticker?.ticker ?? '').toUpperCase();
  const result = await toDataError(apiClient.get(`/api/stocks/price/${sym}`));
  if (result.error) return { data: null, error: result.error };
  const d = result.data;
  return {
    data: typeof d?.price === 'number' ? { price: d.price, changePercent: d.changePercent } : d?.price,
    error: null,
  };
}

/**
 * Get top gainers and losers (market movers).
 * @returns {Promise<{data?: { gainers: array, losers: array }, error?: object}>}
 */
export async function getMovers() {
  const result = await toDataError(apiClient.get('/api/stocks/movers'));
  if (result.error) return { data: { gainers: [], losers: [] }, error: result.error };
  const d = result.data;
  const gainers = d?.gainers ?? [];
  const losers = d?.losers ?? [];
  return {
    data: {
      gainers: Array.isArray(gainers) ? gainers : [],
      losers: Array.isArray(losers) ? losers : [],
    },
    error: null,
  };
}

/**
 * Get US equity market status (open/closed, next open/close).
 * @returns {Promise<{data?: { open: boolean, nextOpen?: string, nextClose?: string, message: string }, error?: object}>}
 */
export async function getMarketStatus() {
  const result = await toDataError(apiClient.get('/api/stocks/market-status'));
  if (result.error) return { data: null, error: result.error };
  return { data: result.data ?? null, error: null };
}

/**
 * Get market indices (S&P 500, NASDAQ, DOW).
 * @returns {Promise<{data?: array, error?: object}>}
 */
export async function getIndices() {
  const result = await toDataError(apiClient.get('/api/stocks/indices'));
  if (result.error) return { data: [], error: result.error };
  const data = result.data;
  return {
    data: Array.isArray(data) ? data : [],
    error: null,
  };
}

/**
 * Get trending commodities (gold, oil, silver, natural gas).
 * @returns {Promise<{data?: array, error?: object}>}
 */
export async function getCommodities() {
  const result = await toDataError(apiClient.get('/api/stocks/commodities'));
  if (result.error) return { data: [], error: result.error };
  const data = result.data;
  return {
    data: Array.isArray(data) ? data : [],
    error: null,
  };
}

/**
 * Get historical price data for a ticker.
 * @param {string} ticker
 * @param {string} period - e.g. '30d', '1y' (maps to backend 1mo, 1y)
 * @returns {Promise<{data?: array, error?: object}>}
 */
export async function getHistory(ticker, period = '30d') {
  if (!ticker) return { data: [], error: { message: 'Ticker required' } };
  const sym = (typeof ticker === 'string' ? ticker : ticker?.symbol ?? ticker?.ticker ?? '').toUpperCase();
  const backendPeriod = period === '1y' ? '1y' : period === '6mo' ? '6mo' : '1mo';
  const result = await toDataError(
    apiClient.get(`/api/stocks/history/${sym}`, { params: { period: backendPeriod } })
  );
  if (result.error) return { data: [], error: result.error };
  const raw = result.data;
  const arr = Array.isArray(raw) ? raw : [];
  // Backend returns { date, open, high, low, close } - map to { date, value } for charts
  return {
    data: arr.map((p) => ({
      date: p.date,
      value: p.close ?? p.value ?? 0,
    })),
    error: null,
  };
}
