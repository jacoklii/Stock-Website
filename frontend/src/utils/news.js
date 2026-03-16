// [AI] News API - market news, portfolio news, watchlist news
// All functions return { data, error } and never throw.

import apiClient, { toDataError } from './api';

/**
 * Get general market/business news.
 * @returns {Promise<{data?: array, error?: object}>}
 */
export async function getMarketNews() {
  const result = await toDataError(apiClient.get('/api/news/business'));
  const data = result.data?.articles ?? result.data ?? [];
  return { data: Array.isArray(data) ? data : [], error: result.error };
}

/**
 * Get news filtered to current portfolio holdings.
 * Returns grouped + flat shapes: { groups: [...], articles: [...] }.
 * @param {number} portfolioId
 * @returns {Promise<{data?: {groups: array, articles: array}, error?: object}>}
 */
export async function getPortfolioNews(portfolioId) {
  const result = await toDataError(
    apiClient.get(`/api/portfolios/${portfolioId}/news`)
  );
  const raw = result.data ?? {};
  const groups = Array.isArray(raw.groups) ? raw.groups : [];
  const articles = Array.isArray(raw.articles)
    ? raw.articles
    : Array.isArray(raw)
      ? raw
      : [];
  return { data: { groups, articles }, error: result.error };
}

/**
 * Get news filtered to watchlist tickers.
 * Returns grouped + flat shapes: { groups: [...], articles: [...] }.
 * @param {number} portfolioId
 * @returns {Promise<{data?: {groups: array, articles: array}, error?: object}>}
 */
export async function getWatchlistNews(portfolioId) {
  const result = await toDataError(
    apiClient.get(`/api/portfolios/${portfolioId}/watchlist-news`)
  );
  const raw = result.data ?? {};
  const groups = Array.isArray(raw.groups) ? raw.groups : [];
  const articles = Array.isArray(raw.articles)
    ? raw.articles
    : Array.isArray(raw)
      ? raw
      : [];
  return { data: { groups, articles }, error: result.error };
}
