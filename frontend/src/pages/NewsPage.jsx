// [AI] NewsPage - Market, Portfolio, Watchlist news tabs

import React, { useState, useEffect, useCallback } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { getMarketNews, getPortfolioNews, getWatchlistNews } from '../utils/news';
import NewsCard from '../components/NewsCard';
import SkeletonCard from '../components/SkeletonCard';

const TABS = [
  { id: 'market', label: 'Market News', fn: getMarketNews },
  { id: 'portfolio', label: 'Portfolio News', fn: (id) => getPortfolioNews(id) },
  { id: 'watchlist', label: 'Watchlist News', fn: (id) => getWatchlistNews(id) },
];

/**
 * NewsPage - Three-tab news hub.
 */
export default function NewsPage() {
  const { portfolio } = usePortfolio();
  const [activeTab, setActiveTab] = useState('market');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setItems([]);
    setLoading(true);
    const tab = TABS.find((t) => t.id === activeTab);
    if (!tab) {
      setLoading(false);
      return;
    }
    const id = (activeTab === 'portfolio' || activeTab === 'watchlist') ? portfolio?.id : null;
    const { data } = id ? await tab.fn(id) : await tab.fn();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [activeTab, portfolio?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setItems([]);
  };

  return (
    <div className="page-enter container">
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>News</h1>
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={activeTab === t.id ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => handleTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-lg)' }}>
        {loading ? (
          <>
            <SkeletonCard height="200px" />
            <SkeletonCard height="200px" />
          </>
        ) : items.length > 0 ? (
          items.map((a, i) => (
            <NewsCard
              key={a.url ? `${a.url}` : `news-${activeTab}-${i}`}
              title={a.title ?? a.headline}
              source={a.source?.name ?? a.source}
              url={a.url}
              publishedAt={a.publishedAt ?? a.published_at ?? a.date}
              tickers={a.tickers ?? []}
              summary={a.summary ?? a.description}
            />
          ))
        ) : (
          <p style={{ color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>No Data</p>
        )}
      </div>
    </div>
  );
}
