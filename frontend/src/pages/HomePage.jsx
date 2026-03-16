// [AI] HomePage - Portfolio dashboard: Market status, Indices, Commodities, Stocks, Movers, Holdings, News

import React, { useState, useEffect, useCallback } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { getMovers, getIndices, getMarketStatus, getCommodities } from '../utils/stocks';
import { getPortfolioNews } from '../utils/news';
import SkeletonCard from '../components/SkeletonCard';
import NewsCard from '../components/NewsCard';
import ChangeBadge from '../components/ChangeBadge';

const POLL_INTERVAL = 30000;

/** True if symbol is a commodity (e.g. GC=F, CL=F). */
function isCommodity(symbol) {
  return typeof symbol === 'string' && symbol.endsWith('=F');
}

/**
 * SummaryBar - Total value, cash, daily P&L, all-time P&L.
 */
function SummaryBar({ portfolio, holdings, cash }) {
  const rawTotal = (holdings?.reduce((s, h) => s + (h.market_value ?? h.shares * (h.current_price ?? h.avg_cost ?? 0)), 0) ?? 0) + (cash ?? 0);
  const totalValue = Number.isFinite(Number(rawTotal)) ? Number(rawTotal) : 0;
  const dailyPnl = Number.isFinite(Number(portfolio?.daily_pnl)) ? Number(portfolio.daily_pnl) : 0;
  const dailyPnlPercent = Number.isFinite(Number(portfolio?.daily_pnl_percent)) ? Number(portfolio.daily_pnl_percent) : 0;
  const startCash = Number(portfolio?.starting_cash ?? cash ?? 0);
  const allTimePnl = Number.isFinite(totalValue) && Number.isFinite(startCash) ? totalValue - startCash : 0;
  const allTimePnlPercent = portfolio?.all_time_pnl_percent;
  const allTimePnlPercentSafe = Number.isFinite(Number(allTimePnlPercent)) ? Number(allTimePnlPercent) : (startCash ? ((totalValue - startCash) / startCash) * 100 : 0);
  const currency = portfolio?.currency || 'USD';

  return (
    <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xl)', alignItems: 'center' }}>
        <div>
          <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Total Value</span>
          <div className="font-mono" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600 }}>
            {Number.isFinite(totalValue) ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(totalValue) : 'No Data'}
          </div>
        </div>
        <div>
          <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Cash</span>
          <div className="font-mono" style={{ fontSize: 'var(--font-size-lg)' }}>
            {Number.isFinite(Number(cash)) ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cash ?? 0) : 'No Data'}
          </div>
        </div>
        <div>
          <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Daily P&L</span>
          <ChangeBadge change={dailyPnl} changePercent={dailyPnlPercent} currency={currency === 'USD' ? '$' : currency + ' '} />
        </div>
        <div>
          <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>All-time P&L</span>
          <ChangeBadge change={allTimePnl} changePercent={Number.isFinite(allTimePnlPercentSafe) ? allTimePnlPercentSafe : 0} currency={currency === 'USD' ? '$' : currency + ' '} />
        </div>
      </div>
    </div>
  );
}

/**
 * MoverCard - Single market mover (ticker, name, price, % change).
 * Accepts changePercent or change_percent from API.
 */
function MoverCard({ symbol, name, price, changePercent, change_percent }) {
  const pct = changePercent ?? change_percent;
  const validPrice = Number.isFinite(Number(price));
  const validChange = Number.isFinite(Number(pct));
  const numChange = validChange ? Number(pct) : 0;
  const isGain = numChange >= 0;
  return (
    <div className="card" style={{ flex: '1 1 140px', minWidth: 140 }}>
      <div className="font-mono" style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>{symbol}</div>
      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-sm)' }}>{name}</div>
      <div className="font-mono" style={{ fontSize: 'var(--font-size-lg)' }}>
        {validPrice ? `$${Number(price).toFixed(2)}` : 'No Data'}
      </div>
      <span style={{ color: isGain ? 'var(--gain-color)' : 'var(--loss-color)', fontSize: 'var(--font-size-sm)' }}>
        {validChange ? `${numChange >= 0 ? '+' : ''}${numChange.toFixed(2)}%` : 'No Data'}
      </span>
    </div>
  );
}

/**
 * HoldingTicker - Single holding card: ticker, price, shares, market value, daily %.
 */
function HoldingTicker({ holding }) {
  const value = holding?.market_value ?? holding?.shares * (holding?.current_price ?? holding?.avg_cost ?? 0);
  const validValue = Number.isFinite(Number(value));
  const price = holding?.current_price ?? holding?.avg_cost;
  const validPrice = Number.isFinite(Number(price));
  const change = holding?.daily_change_percent ?? 0;
  const validChange = Number.isFinite(Number(change));
  const numChange = validChange ? Number(change) : 0;
  const isGain = numChange >= 0;
  return (
    <div className="card" style={{ flex: '1 1 180px', minWidth: 160 }}>
      <div className="font-mono" style={{ fontWeight: 600 }}>{holding?.ticker ?? holding?.symbol}</div>
      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>{holding?.company_name ?? ''}</div>
      <div className="font-mono" style={{ marginTop: 'var(--spacing-sm)' }}>
        {validPrice ? `$${Number(price).toFixed(2)}` : 'No Data'}
      </div>
      <div style={{ fontSize: 'var(--font-size-sm)' }}>{holding?.shares ?? 0} shares</div>
      <div className="font-mono">{validValue ? `$${Number(value).toFixed(2)}` : 'No Data'}</div>
      <span style={{ color: isGain ? 'var(--gain-color)' : 'var(--loss-color)', fontSize: 'var(--font-size-sm)' }}>
        {validChange ? `${numChange >= 0 ? '+' : ''}${numChange.toFixed(2)}%` : 'No Data'}
      </span>
    </div>
  );
}

/**
 * IndexBadge - S&P 500, NASDAQ, DOW with price and daily %.
 * Accepts changePercent or change_percent from API.
 */
function IndexBadge({ symbol, name, price, changePercent, change_percent }) {
  const pct = changePercent ?? change_percent;
  const validPrice = Number.isFinite(Number(price));
  const validChange = Number.isFinite(Number(pct));
  const numChange = validChange ? Number(pct) : 0;
  const isGain = numChange >= 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', padding: 'var(--spacing-sm) var(--spacing-md)', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
      <span className="font-mono" style={{ fontWeight: 600 }}>{symbol}</span>
      <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>{name}</span>
      <span className="font-mono">{validPrice ? `$${Number(price).toFixed(0)}` : 'No Data'}</span>
      <span style={{ color: isGain ? 'var(--gain-color)' : 'var(--loss-color)', fontSize: 'var(--font-size-sm)' }}>
        {validChange ? `${numChange >= 0 ? '+' : ''}${numChange.toFixed(2)}%` : 'No Data'}
      </span>
    </div>
  );
}

/**
 * Small card for sliding strip (index/commodity/stock): symbol, price, % change.
 * Accepts changePercent or change_percent from API.
 */
function StripCard({ symbol, name, price, changePercent, change_percent }) {
  const pct = changePercent ?? change_percent;
  const validPrice = Number.isFinite(Number(price));
  const validChange = Number.isFinite(Number(pct));
  const numChange = validChange ? Number(pct) : 0;
  const isGain = numChange >= 0;
  return (
    <div style={{ flex: '0 0 auto', minWidth: 140, padding: 'var(--spacing-sm) var(--spacing-md)', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
      <div className="font-mono" style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{symbol}</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>{name}</div>
      <div className="font-mono" style={{ marginTop: 'var(--spacing-xs)' }}>{validPrice ? `$${Number(price).toFixed(2)}` : 'No Data'}</div>
      <span style={{ color: isGain ? 'var(--gain-color)' : 'var(--loss-color)', fontSize: 'var(--font-size-sm)' }}>
        {validChange ? `${numChange >= 0 ? '+' : ''}${numChange.toFixed(2)}%` : 'No Data'}
      </span>
    </div>
  );
}

/**
 * HomePage - Dashboard overview.
 */
export default function HomePage() {
  const { portfolio, holdings, cash, refresh } = usePortfolio();
  const [marketStatus, setMarketStatus] = useState(null);
  const [movers, setMovers] = useState({ gainers: [], losers: [] });
  const [indices, setIndices] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [statusRes, mRes, iRes, cRes, nRes] = await Promise.all([
      getMarketStatus(),
      getMovers(),
      getIndices(),
      getCommodities(),
      portfolio?.id ? getPortfolioNews(portfolio.id) : Promise.resolve({ data: [] }),
    ]);
    if (statusRes.data) setMarketStatus(statusRes.data);
    if (mRes.data) setMovers(mRes.data);
    if (iRes.data) setIndices(iRes.data);
    if (cRes.data) setCommodities(Array.isArray(cRes.data) ? cRes.data : []);
    if (nRes.data) {
      const articles = Array.isArray(nRes.data?.articles)
        ? nRes.data.articles
        : Array.isArray(nRes.data)
          ? nRes.data
          : [];
      setNews(articles.slice(0, 5));
    }
    setLoading(false);
  }, [portfolio?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => {
      refresh();
      load();
    }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [refresh, load]);

  const stockHoldings = (holdings ?? []).filter((h) => !isCommodity(h.ticker ?? h.symbol ?? ''));

  /** Combined list for sliding ticker: indices + commodities + your stocks (normalized with change_percent → changePercent) */
  const tickerItems = [
    ...indices.map((idx) => ({ ...idx, changePercent: idx.change_percent ?? idx.changePercent, key: `idx-${idx.symbol}` })),
    ...commodities.map((c) => ({ ...c, changePercent: c.change_percent ?? c.changePercent, key: `com-${c.symbol}` })),
    ...stockHoldings.map((h) => ({
      symbol: h.ticker ?? h.symbol,
      name: h.company_name ?? h.ticker ?? h.symbol,
      price: h.current_price ?? h.avg_cost,
      changePercent: h.daily_change_percent ?? h.dailyChangePercent,
      key: `stock-${h.ticker ?? h.symbol}`,
    })),
  ];

  const formatNextTime = (iso) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
    } catch {
      return null;
    }
  };

  return (
    <div className="page-enter">
      <div className="container">
        <h1 style={{ marginBottom: 'var(--spacing-md)' }}>Dashboard</h1>
        {loading ? (
          <SkeletonCard height="120px" />
        ) : (
          <SummaryBar portfolio={portfolio} holdings={holdings} cash={cash} />
        )}
      </div>

      {/* Full-width market open/close subheader across the page */}
      {!loading && marketStatus && (
        <header
          style={{
            width: '100vw',
            marginLeft: 'calc(-50vw + 50%)',
            marginBottom: 'var(--spacing-lg)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            background: marketStatus.open ? 'var(--gain-color)' : 'var(--loss-color)',
            color: 'var(--bg-base)',
            fontSize: 'var(--font-size-base)',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          {marketStatus.message ?? (marketStatus.open ? 'Market Open' : 'Market Closed')}
          {marketStatus.nextOpen && !marketStatus.open && (
            <span style={{ fontWeight: 400, opacity: 0.9 }}> — Opens {formatNextTime(marketStatus.nextOpen)}</span>
          )}
          {marketStatus.nextClose && marketStatus.open && (
            <span style={{ fontWeight: 400, opacity: 0.9 }}> — Closes {formatNextTime(marketStatus.nextClose)}</span>
          )}
        </header>
      )}

      {/* Single continuous sliding ticker: indices + commodities + your stocks (Apple-style) */}
      <div className="container" style={{ paddingTop: 0 }}>
        {loading ? (
          <SkeletonCard height="72px" style={{ marginBottom: 'var(--spacing-xl)' }} />
        ) : tickerItems.length > 0 ? (
          <div className="ticker-wrap">
            <div className="ticker-inner">
              {tickerItems.map((item) => (
                <div key={`${item.key}-1`} className="ticker-item">
                  <StripCard
                    symbol={item.symbol}
                    name={item.name}
                    price={item.price}
                    changePercent={item.changePercent}
                    change_percent={item.change_percent}
                  />
                </div>
              ))}
              {tickerItems.map((item) => (
                <div key={`${item.key}-2`} className="ticker-item">
                  <StripCard
                    symbol={item.symbol}
                    name={item.name}
                    price={item.price}
                    changePercent={item.changePercent}
                    change_percent={item.change_percent}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)' }}>No Data</p>
        )}
      </div>

      <div className="container">

      <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Big Market Movers</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        {loading ? (
          <>
            <SkeletonCard height="100px" style={{ flex: '1 1 140px' }} />
            <SkeletonCard height="100px" style={{ flex: '1 1 140px' }} />
            <SkeletonCard height="100px" style={{ flex: '1 1 140px' }} />
          </>
        ) : (movers.gainers?.length > 0 || movers.losers?.length > 0) ? (
          <>
            {movers.gainers?.map((m) => <MoverCard key={m.symbol} {...m} />)}
            {movers.losers?.map((m) => <MoverCard key={m.symbol} {...m} />)}
          </>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>No Data</p>
        )}
      </div>

      <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Holdings Snapshot</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)', overflowX: 'auto' }}>
        {loading ? (
          <SkeletonCard height="140px" style={{ flex: '1 1 180px' }} />
        ) : holdings?.length > 0 ? (
          holdings.map((h) => <HoldingTicker key={h.ticker ?? h.symbol ?? h.id} holding={h} />)
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>No Data</p>
        )}
      </div>

      <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Portfolio News</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        {loading ? (
          <SkeletonCard height="160px" />
        ) : news.length > 0 ? (
          news.map((a, i) => (
            <NewsCard
              key={a.url ? `${a.url}` : `news-${i}`}
              title={a.title ?? a.headline}
              source={a.source?.name ?? a.source}
              url={a.url}
              publishedAt={a.publishedAt ?? a.published_at ?? a.date}
              tickers={a.tickers ?? []}
              summary={a.summary ?? a.description}
            />
          ))
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>No Data</p>
        )}
      </div>
      </div>
    </div>
  );
}
