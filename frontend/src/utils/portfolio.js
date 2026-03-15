// [AI] Portfolio API - summary, holdings, buy/sell, metrics, transactions, reset
// All functions return { data, error } and never throw.
// Normalizes backend fields (portfolio_id, stock_symbol, etc.) to frontend shapes (id, ticker, etc.)

import apiClient, { toDataError } from './api';

/** Normalize portfolio object for frontend (id, cash, etc.) */
function normalizePortfolio(p) {
  if (!p) return null;
  return {
    ...p,
    id: p.id ?? p.portfolio_id,
    portfolio_id: p.portfolio_id ?? p.id,
    cash: p.cash ?? p.current_balance ?? p.available_cash,
    name: p.name ?? p.portfolio_name,
  };
}

/** Normalize holding for frontend (ticker, shares, avg_cost, market_value) */
function normalizeHolding(h) {
  if (!h) return null;
  return {
    ...h,
    id: h.id ?? h.holding_id,
    ticker: h.ticker ?? h.stock_symbol ?? h.symbol,
    symbol: h.symbol ?? h.stock_symbol ?? h.ticker,
    shares: h.shares ?? h.quantity,
    quantity: h.quantity ?? h.shares,
    avg_cost: h.avg_cost ?? h.average_cost,
    average_cost: h.average_cost ?? h.avg_cost,
    market_value: h.market_value ?? h.total_value,
    total_value: h.total_value ?? h.market_value,
  };
}

/**
 * Get portfolio summary for user (portfolios list, active portfolio).
 * @param {number} portfolioId - Optional; if not provided, uses first portfolio
 * @returns {Promise<{data?: object, error?: object}>}
 */
export async function getSummary(portfolioId) {
  const { data: portfoliosRaw, error: listError } = await toDataError(
    apiClient.get('/api/portfolios')
  );
  if (listError) return { data: null, error: listError };

  const portfolios = Array.isArray(portfoliosRaw)
    ? portfoliosRaw.map(normalizePortfolio)
    : [];
  const id = portfolioId ?? portfolios?.[0]?.id ?? portfolios?.[0]?.portfolio_id;

  if (!id) {
    return { data: { portfolio: null, portfolios }, error: null };
  }

  const { data: portfolioRaw, error: detailError } = await toDataError(
    apiClient.get(`/api/portfolios/${id}`)
  );
  if (detailError) return { data: null, error: detailError };

  const portfolio = normalizePortfolio(portfolioRaw);
  return { data: { portfolio, portfolios }, error: null };
}

/**
 * Get holdings for a portfolio.
 * @param {number} portfolioId
 * @returns {Promise<{data?: array, error?: object}>}
 */
export async function getHoldings(portfolioId) {
  const result = await toDataError(
    apiClient.get(`/api/portfolios/${portfolioId}/holdings`)
  );
  const raw = result.data?.holdings ?? result.data ?? [];
  const data = Array.isArray(raw) ? raw.map(normalizeHolding) : [];
  return { data, error: result.error };
}

const TRADE_REQUEST_TIMEOUT_MS = 15000;

/**
 * Buy stock in a portfolio.
 * @param {number} portfolioId
 * @param {object} payload - { ticker, shares, price } or { ticker, dollar_amount }
 * @returns {Promise<{data?: object, error?: object}>}
 */
export async function buyStock(portfolioId, payload) {
  const body = {
    ticker: payload.ticker ?? payload.stock_symbol ?? payload.symbol,
    shares: payload.shares ?? payload.quantity,
    price: payload.price,
    dollar_amount: payload.dollar_amount ?? payload.dollarAmount,
  };
  return toDataError(
    apiClient.post(`/api/portfolios/${portfolioId}/buy`, body, { timeout: TRADE_REQUEST_TIMEOUT_MS })
  );
}

/**
 * Sell stock from a portfolio.
 * @param {number} portfolioId
 * @param {object} payload - { ticker, shares } (price fetched by backend if omitted)
 * @returns {Promise<{data?: object, error?: object}>}
 */
export async function sellStock(portfolioId, payload) {
  const body = {
    ticker: payload.ticker ?? payload.stock_symbol ?? payload.symbol,
    shares: payload.shares ?? payload.quantity,
    price: payload.price,
  };
  return toDataError(
    apiClient.post(`/api/portfolios/${portfolioId}/sell`, body, { timeout: TRADE_REQUEST_TIMEOUT_MS })
  );
}

/**
 * Get portfolio metrics (total value, P&L, etc.).
 * @param {number} portfolioId
 * @returns {Promise<{data?: object, error?: object}>}
 */
export async function getMetrics(portfolioId) {
  const result = await toDataError(apiClient.get(`/api/portfolios/${portfolioId}`));
  if (result.data) result.data = normalizePortfolio(result.data);
  return result;
}

/**
 * Get transaction history for a portfolio.
 * @param {number} portfolioId
 * @param {object} filters - { dateFrom?, dateTo?, ticker? }
 * @returns {Promise<{data?: array, error?: object}>}
 */
export async function getTransactions(portfolioId, filters = {}) {
  const params = {};
  if (filters.dateFrom) params.date_from = filters.dateFrom;
  if (filters.dateTo) params.date_to = filters.dateTo;
  if (filters.ticker) params.ticker = filters.ticker;
  const qs = new URLSearchParams(params).toString();
  const url = qs
    ? `/api/portfolios/${portfolioId}/transactions?${qs}`
    : `/api/portfolios/${portfolioId}/transactions`;
  const result = await toDataError(apiClient.get(url));
  const data = result.data?.transactions ?? result.data ?? [];
  return {
    data: Array.isArray(data) ? data : [],
    error: result.error,
  };
}

/**
 * Create a new portfolio.
 * @param {object} payload - { name, starting_cash, currency } or { portfolio_name, starting_cash }
 * @returns {Promise<{data?: object, error?: object}>}
 */
export async function createPortfolio(payload) {
  const body = {
    portfolio_name: payload.portfolio_name ?? payload.name,
    starting_cash: payload.starting_cash ?? payload.startingCash ?? 10000,
  };
  return toDataError(apiClient.post('/api/portfolios', body));
}

/**
 * Reset portfolio (clear holdings and transactions, restore starting cash).
 * @param {number} portfolioId
 * @returns {Promise<{data?: object, error?: object}>}
 */
export async function resetPortfolio(portfolioId) {
  return toDataError(
    apiClient.post(`/api/portfolios/${portfolioId}/reset`)
  );
}
