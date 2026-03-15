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
 * @param {number} portfolioId
 * @returns {Promise<{data?: array, error?: object}>}
 */
export async function getPortfolioNews(portfolioId) {
  const result = await toDataError(
    apiClient.get(`/api/portfolios/${portfolioId}/news`)
  );
  const data = result.data?.articles ?? result.data ?? [];
  return { data: Array.isArray(data) ? data : [], error: result.error };
}

/**
 * Get news filtered to watchlist tickers.
 * @param {number} portfolioId
 * @returns {Promise<{data?: array, error?: object}>}
 */
export async function getWatchlistNews(portfolioId) {
  const result = await toDataError(
    apiClient.get(`/api/portfolios/${portfolioId}/watchlist-news`)
  );
  const data = result.data?.articles ?? result.data ?? [];
  return { data: Array.isArray(data) ? data : [], error: result.error };
}
