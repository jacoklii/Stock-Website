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
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setItems([]);
    setGroups([]);
    setLoading(true);
    const tab = TABS.find((t) => t.id === activeTab);
    if (!tab) {
      setLoading(false);
      return;
    }
    const id = (activeTab === 'portfolio' || activeTab === 'watchlist') ? portfolio?.id : null;
    const { data } = id ? await tab.fn(id) : await tab.fn();
    if (activeTab === 'portfolio' || activeTab === 'watchlist') {
      const grp = Array.isArray(data?.groups) ? data.groups : [];
      const flat = Array.isArray(data?.articles) ? data.articles : [];
      setGroups(grp);
      setItems(flat);
    } else {
      setItems(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, [activeTab, portfolio?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setItems([]);
    setGroups([]);
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
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-lg)' }}>
          <SkeletonCard height="200px" />
          <SkeletonCard height="200px" />
        </div>
      ) : activeTab === 'market' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-lg)' }}>
          {items.length > 0 ? (
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
      ) : (
        <>
          {/* Per-ticker grouped sections */}
          {groups.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
              {groups.map((g) => (
                <section key={g.symbol}>
                  <h2 style={{ marginBottom: 'var(--spacing-sm)' }}>{g.symbol}</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-md)' }}>
                    {(g.articles ?? []).slice(0, 3).map((a, i) => (
                      <NewsCard
                        key={a.url ? `${a.url}` : `news-${g.symbol}-${i}`}
                        title={a.title ?? a.headline}
                        source={a.source?.name ?? a.source}
                        url={a.url}
                        publishedAt={a.publishedAt ?? a.published_at ?? a.date}
                        tickers={a.tickers ?? [g.symbol]}
                        summary={a.summary ?? a.description}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)' }}>No news grouped by ticker.</p>
          )}

          {/* Combined feed (all headlines together) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-lg)' }}>
            {items.length > 0 ? (
              items.map((a, i) => (
                <NewsCard
                  key={a.url ? `${a.url}` : `news-${activeTab}-flat-${i}`}
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
        </>
      )}
    </div>
  );
}
