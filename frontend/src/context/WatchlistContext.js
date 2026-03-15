// [AI] WatchlistContext - watchlist, addTicker, removeTicker, refresh
// Depends on PortfolioContext for portfolio ID.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePortfolio } from './PortfolioContext';
import * as watchlistAPI from '../utils/watchlist';

const WatchlistContext = createContext(null);

/**
 * WatchlistProvider - Wraps app with watchlist state.
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export function WatchlistProvider({ children }) {
  const { portfolio } = usePortfolio();
  const [watchlist, setWatchlist] = useState([]);

  const refresh = useCallback(async () => {
    if (!portfolio?.id) {
      setWatchlist([]);
      return;
    }
    const { data, error } = await watchlistAPI.getWatchlist(portfolio.id);
    if (!error) setWatchlist(Array.isArray(data) ? data : []);
  }, [portfolio?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTicker = useCallback(async (ticker) => {
    if (!portfolio?.id) return { error: { message: 'No portfolio selected' } };
    const result = await watchlistAPI.addTicker(portfolio.id, ticker);
    if (!result.error) await refresh();
    return result;
  }, [portfolio?.id, refresh]);

  const removeTicker = useCallback(async (watchlistId) => {
    if (!portfolio?.id) return { error: { message: 'No portfolio selected' } };
    const result = await watchlistAPI.removeTicker(portfolio.id, watchlistId);
    if (!result.error) await refresh();
    return result;
  }, [portfolio?.id, refresh]);

  const value = {
    watchlist,
    addTicker,
    removeTicker,
    refresh,
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

/**
 * useWatchlist - Hook to access watchlist context.
 * @returns {object} Watchlist context value
 */
export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    throw new Error('useWatchlist must be used within WatchlistProvider');
  }
  return ctx;
}
