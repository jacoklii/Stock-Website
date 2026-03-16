// [AI] WatchlistPage - Ticker search, watchlist table, news feed

import React, { useState, useEffect } from 'react';
import { useWatchlist } from '../context/WatchlistContext';
import { usePortfolio } from '../context/PortfolioContext';
import { getWatchlistNews } from '../utils/news';
import StockSearchInput from '../components/StockSearchInput';
import ConfirmModal from '../components/ConfirmModal';
import NewsCard from '../components/NewsCard';
import SkeletonCard from '../components/SkeletonCard';

/**
 * WatchlistPage - Watchlist management and news.
 */
export default function WatchlistPage() {
  const { watchlist, addTicker, removeTicker, refresh } = useWatchlist();
  const { portfolio } = usePortfolio();
  const [editMode, setEditMode] = useState(false);
  const [tickerToAdd, setTickerToAdd] = useState('');
  const [news, setNews] = useState({ groups: [], articles: [] });
  const [loading, setLoading] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);

  useEffect(() => {
    if (portfolio?.id) {
      getWatchlistNews(portfolio.id).then(({ data }) => {
        if (data && (Array.isArray(data.groups) || Array.isArray(data.articles))) {
          setNews({
            groups: Array.isArray(data.groups) ? data.groups : [],
            articles: Array.isArray(data.articles) ? data.articles : [],
          });
        } else {
          // Backwards compatibility: data is a flat list.
          setNews({
            groups: [],
            articles: Array.isArray(data) ? data : [],
          });
        }
      });
    }
  }, [portfolio?.id]);

  const handleAdd = async () => {
    const raw = tickerToAdd?.symbol ?? tickerToAdd?.ticker ?? tickerToAdd;
    const t = (raw ?? '').toString().trim().toUpperCase();
    if (!t) return;
    setLoading(true);
    await addTicker(t);
    setLoading(false);
    setTickerToAdd('');
  };

  const handleRemove = async (id) => {
    if (!id) return;
    setLoading(true);
    await removeTicker(id);
    setLoading(false);
    setRemoveTarget(null);
  };

  return (
    <div className="page-enter container">
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Watchlist</h1>

      <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px' }}>
            <label style={{ marginBottom: 'var(--spacing-sm)' }}>Add Ticker</label>
            <StockSearchInput
              onSelect={(item) => {
                const t = item?.symbol ?? item?.ticker ?? item;
                if (t) setTickerToAdd(t);
              }}
              placeholder="Search ticker..."
            />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading}
            onClick={handleAdd}
          >
            Add to Watchlist
          </button>
          <button
            type="button"
            className={editMode ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setEditMode((e) => !e)}
          >
            Edit
          </button>
        </div>
      </div>

      <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Watchlist</h3>
      <div className="card" style={{ overflowX: 'auto', marginBottom: 'var(--spacing-xl)' }}>
        {watchlist?.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Ticker</th>
                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Current Price</th>
                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Open</th>
                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Change</th>
                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>52W Range</th>
                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Added</th>
                <th style={{ padding: 'var(--spacing-md)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((w) => {
                const sym = w.stock_symbol ?? w.ticker ?? w.symbol ?? w.id;
                const price = w.current_price ?? w.price ?? 0;
                const open = w.open_price ?? price;
                const validPrice = Number.isFinite(Number(price));
                const validOpen = Number.isFinite(Number(open));
                const ch = validOpen && open !== 0 ? ((Number(price) - Number(open)) / Number(open)) * 100 : null;
                const validCh = Number.isFinite(ch);
                return (
                  <tr key={w.id ?? sym} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="font-mono" style={{ padding: 'var(--spacing-md)' }}>{sym}</td>
                    <td className="font-mono" style={{ padding: 'var(--spacing-md)' }}>{validPrice ? `$${Number(price).toFixed(2)}` : 'No Data'}</td>
                    <td className="font-mono" style={{ padding: 'var(--spacing-md)' }}>{validOpen ? `$${Number(open).toFixed(2)}` : 'No Data'}</td>
                    <td style={{ padding: 'var(--spacing-md)', color: validCh && ch >= 0 ? 'var(--gain-color)' : 'var(--loss-color)' }}>
                      {validCh ? `${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%` : 'No Data'}
                    </td>
                    <td style={{ padding: 'var(--spacing-md)' }}>
                      <div style={{ width: 80, height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                        {validPrice ? (
                          <div
                            style={{
                              width: `${Math.min(100, Math.max(0, ((Number(price) - (Number(w.low52) || Number(price) * 0.8)) / ((Number(w.high52) || Number(price) * 1.2) - (Number(w.low52) || Number(price) * 0.8)) || 1) * 100))}%`,
                              height: '100%',
                              background: 'var(--accent-color)',
                            }}
                          />
                        ) : (
                          <div style={{ width: '0%', height: '100%', background: 'var(--accent-color)' }} />
                        )}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                      {w.added_at ?? w.created_at ?? '-'}
                    </td>
                    <td style={{ padding: 'var(--spacing-md)' }}>
                      {editMode ? (
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: 'var(--font-size-sm)' }}
                          onClick={() => setRemoveTarget(w.id)}
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: 'var(--font-size-sm)' }}
                          onClick={() => {}}
                        >
                          Add to Portfolio
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p style={{ padding: 'var(--spacing-lg)', color: 'var(--text-secondary)' }}>No items in watchlist. Search and add tickers above.</p>
        )}
      </div>

      <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Watchlist News</h3>
      {news.groups.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
          {news.groups.map((g) => (
            <section key={g.symbol}>
              <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>{g.symbol}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-md)' }}>
                {(g.articles ?? []).slice(0, 3).map((a, i) => (
                  <NewsCard
                    key={a.url ?? `${g.symbol}-${i}`}
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
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-md)' }}>
        {news.articles.length > 0 ? (
          news.articles.map((a, i) => (
            <NewsCard
              key={a.url ?? i}
              title={a.title ?? a.headline}
              source={a.source?.name ?? a.source}
              url={a.url}
              publishedAt={a.publishedAt ?? a.published_at ?? a.date}
              tickers={a.tickers ?? []}
              summary={a.summary ?? a.description}
            />
          ))
        ) : news.groups.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No news for watchlist tickers.</p>
        ) : null}
      </div>

      <ConfirmModal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => handleRemove(removeTarget)}
        title="Remove from Watchlist"
        confirmLabel="Remove"
      >
        <p>Remove this ticker from your watchlist?</p>
      </ConfirmModal>
    </div>
  );
}
