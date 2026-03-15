// [AI] PortfolioContext - portfolio, holdings, cash, metrics, buyStock, sellStock, refresh
// Depends on AuthContext. Fetches active portfolio and holdings.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as portfolioAPI from '../utils/portfolio';

const PortfolioContext = createContext(null);

/**
 * PortfolioProvider - Wraps app with portfolio state.
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export function PortfolioProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [cash, setCash] = useState(0);
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async (portfolioId) => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    const { data: summaryData, error: summaryError } = await portfolioAPI.getSummary(portfolioId);
    if (summaryError || !summaryData?.portfolio) {
      setPortfolio(null);
      setHoldings([]);
      setCash(0);
      setMetrics(null);
      setIsLoading(false);
      return;
    }
    const p = summaryData.portfolio;
    setPortfolio(p);
    setCash(p.cash ?? p.available_cash ?? 0);
    setMetrics(summaryData.portfolio);

    const id = p.id ?? portfolioId;
    const { data: holdingsData } = await portfolioAPI.getHoldings(id);
    setHoldings(Array.isArray(holdingsData) ? holdingsData : []);
    setIsLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    } else {
      setPortfolio(null);
      setHoldings([]);
      setCash(0);
      setMetrics(null);
    }
  }, [isAuthenticated, refresh]);

  const buyStock = useCallback(async (payload) => {
    if (!portfolio?.id) return { error: { message: 'No portfolio selected' } };
    const result = await portfolioAPI.buyStock(portfolio.id, payload);
    if (!result.error) await refresh(portfolio.id);
    return result;
  }, [portfolio?.id, refresh]);

  const sellStock = useCallback(async (payload) => {
    if (!portfolio?.id) return { error: { message: 'No portfolio selected' } };
    const result = await portfolioAPI.sellStock(portfolio.id, payload);
    if (!result.error) await refresh(portfolio.id);
    return result;
  }, [portfolio?.id, refresh]);

  const value = {
    portfolio,
    holdings,
    cash,
    metrics,
    isLoading,
    buyStock,
    sellStock,
    refresh,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

/**
 * usePortfolio - Hook to access portfolio context.
 * @returns {object} Portfolio context value
 */
export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) {
    throw new Error('usePortfolio must be used within PortfolioProvider');
  }
  return ctx;
}
