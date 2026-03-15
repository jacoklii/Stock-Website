// [AI] PortfolioPage - Trade panel, holdings table, metrics, charts

import React, { useState, useEffect, useCallback } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { usePortfolio } from '../context/PortfolioContext';
import { getPrice, getHistory } from '../utils/stocks';
import StockSearchInput from '../components/StockSearchInput';
import ConfirmModal from '../components/ConfirmModal';
import SkeletonCard from '../components/SkeletonCard';
import NewsCard from '../components/NewsCard';
import ChangeBadge from '../components/ChangeBadge';

const POLL_INTERVAL = 30000;

/**
 * PortfolioPage - Trading and holdings view.
 */
export default function PortfolioPage() {
  const { portfolio, holdings, cash, buyStock, sellStock, refresh } = usePortfolio();
  const [mode, setMode] = useState('buy'); // buy | sell
  const [inputMode, setInputMode] = useState('shares'); // shares | dollar
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [livePrice, setLivePrice] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [sortKey, setSortKey] = useState('ticker');
  const [sortDir, setSortDir] = useState(1);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tradeError, setTradeError] = useState(null);

  const currency = portfolio?.currency || 'USD';

  const loadPrice = useCallback(async (ticker) => {
    if (!ticker) return;
    const sym = ticker.symbol ?? ticker.ticker ?? ticker;
    const { data } = await getPrice(sym);
    const price = data?.price ?? data;
    setLivePrice(typeof price === 'number' ? price : null);
  }, []);

  useEffect(() => {
    loadPrice(selectedTicker);
  }, [selectedTicker, loadPrice]);

  useEffect(() => {
    const id = setInterval(() => {
      refresh();
      if (selectedTicker) loadPrice(selectedTicker);
    }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [refresh, selectedTicker, loadPrice]);

  useEffect(() => {
    if (!portfolio?.id) return;
    getHistory('SPY', '30d').then(({ data }) => setHistoryData(data || []));
  }, [portfolio?.id]);

  const handleExecute = async () => {
    if (!selectedTicker || !portfolio?.id) return;
    const sym = selectedTicker.symbol ?? selectedTicker.ticker ?? selectedTicker;
    setTradeError(null);
    setLoading(true);
    let result;
    if (mode === 'buy') {
      const price = livePrice ?? 0;
      if (inputMode === 'dollar') {
        const dollarAmt = Number(quantity);
        if (!dollarAmt || dollarAmt <= 0) {
          setLoading(false);
          setTradeError('Enter a valid dollar amount.');
          return;
        }
        result = await buyStock({ ticker: sym, dollar_amount: dollarAmt, price: price || undefined });
      } else {
        const qty = Math.floor(Number(quantity));
        if (!qty || qty <= 0) {
          setLoading(false);
          setTradeError('Enter a valid share quantity.');
          return;
        }
        result = await buyStock({ ticker: sym, shares: qty, price: price || undefined });
      }
    } else {
      const qty = Math.floor(Number(quantity));
      if (!qty || qty <= 0) {
        setLoading(false);
        setTradeError('Enter a valid share quantity.');
        return;
      }
      result = await sellStock({ ticker: sym, shares: qty });
    }
    setLoading(false);
    if (result.error) {
      setTradeError(result.error?.error ?? result.error?.message ?? 'Trade failed. Try again.');
      return;
    }
    setQuantity('');
    setSelectedTicker(null);
    setLivePrice(null);
    setConfirmOpen(false);
  };

  const totalInvestedRaw = holdings?.reduce((s, h) => s + (h.shares * (h.avg_cost ?? 0)), 0) ?? 0;
  const totalValueRaw = holdings?.reduce((s, h) => s + (h.market_value ?? h.shares * (h.current_price ?? h.avg_cost ?? 0)), 0) ?? 0;
  const totalInvested = Number.isFinite(Number(totalInvestedRaw)) ? Number(totalInvestedRaw) : 0;
  const totalValue = Number.isFinite(Number(totalValueRaw)) ? Number(totalValueRaw) : 0;
  const pieData = holdings?.map((h, i) => ({
    name: h.ticker ?? h.symbol,
    value: h.market_value ?? h.shares * (h.current_price ?? h.avg_cost ?? 0),
    color: ['#00FF88', '#238636', '#3fb950', '#58a6ff', '#a371f7'][i % 5],
  })).filter((d) => d.value > 0) ?? [];

  const sortedHoldings = [...(holdings ?? [])].sort((a, b) => {
    const ak = a[sortKey] ?? '';
    const bk = b[sortKey] ?? '';
    return sortDir * (ak < bk ? -1 : ak > bk ? 1 : 0);
  });

  const handleSort = (key) => {
    setSortKey(key);
    setSortDir((d) => (sortKey === key ? -d : 1));
  };

  return (
    <div className="page-enter container">
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Portfolio</h1>

      <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Trade</h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-lg)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ marginBottom: 'var(--spacing-sm)' }}>Ticker</label>
            <StockSearchInput onSelect={setSelectedTicker} value={selectedTicker?.symbol ?? selectedTicker?.ticker} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button
              type="button"
              className={mode === 'buy' ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => setMode('buy')}
            >
              Buy
            </button>
            <button
              type="button"
              className={mode === 'sell' ? 'btn btn-danger' : 'btn btn-secondary'}
              onClick={() => setMode('sell')}
            >
              Sell
            </button>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button
              type="button"
              className={inputMode === 'shares' ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => setInputMode('shares')}
            >
              Shares
            </button>
            <button
              type="button"
              className={inputMode === 'dollar' ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => setInputMode('dollar')}
            >
              $
            </button>
          </div>
          <div style={{ flex: '0 0 120px' }}>
            <label style={{ marginBottom: 'var(--spacing-sm)' }}>Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min={1}
              placeholder={inputMode === 'shares' ? 'Shares' : 'Amount'}
            />
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Price </span>
            <span className="font-mono">
              {livePrice != null && Number.isFinite(livePrice)
                ? `$${livePrice.toFixed(2)}`
                : selectedTicker && mode === 'buy'
                  ? 'Loading price…'
                  : '-'}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Total </span>
            <span className="font-mono">
              {(() => {
                const q = inputMode === 'shares' ? Number(quantity) : livePrice ? Number(quantity) / livePrice : 0;
                const tot = inputMode === 'shares' ? q * (livePrice ?? 0) : Number(quantity);
                return `$${tot.toFixed(2)}`;
              })()}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Cash </span>
            <span className="font-mono text-gain">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cash ?? 0)}</span>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={
              !selectedTicker ||
              !quantity ||
              loading ||
              (mode === 'buy' && (livePrice == null || livePrice <= 0 || !Number.isFinite(livePrice)))
            }
            onClick={() => { setTradeError(null); setConfirmOpen(true); }}
          >
            Execute Trade
          </button>
        </div>
        {tradeError && (
          <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--loss-color)', fontSize: 'var(--font-size-sm)' }}>
            {tradeError}
          </p>
        )}
      </div>

      <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Holdings</h3>
      <div className="card" style={{ overflowX: 'auto', marginBottom: 'var(--spacing-xl)' }}>
        {holdings?.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['ticker', 'shares', 'avg_cost', 'current_price', 'market_value', 'day_change', 'total_return'].map((k) => (
                  <th
                    key={k}
                    style={{ padding: 'var(--spacing-md)', textAlign: 'left', cursor: 'pointer' }}
                    onClick={() => handleSort(k)}
                  >
                    {k.replace(/_/g, ' ')}
                  </th>
                ))}
                <th style={{ padding: 'var(--spacing-md)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((h) => {
                const ticker = h.ticker ?? h.symbol;
                const mv = h.market_value ?? h.shares * (h.current_price ?? h.avg_cost ?? 0);
                const dayCh = h.daily_change_percent ?? 0;
                const ret = h.total_return_percent ?? 0;
                const validMv = Number.isFinite(Number(mv));
                const validDayCh = Number.isFinite(Number(dayCh));
                const validRet = Number.isFinite(Number(ret));
                const avgCost = h.avg_cost ?? 0;
                const validAvgCost = Number.isFinite(Number(avgCost));
                const curPrice = h.current_price ?? h.avg_cost ?? 0;
                const validCurPrice = Number.isFinite(Number(curPrice));
                return (
                  <React.Fragment key={ticker}>
                    <tr
                      style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                      onClick={() => setExpandedRow(expandedRow === ticker ? null : ticker)}
                    >
                      <td className="font-mono" style={{ padding: 'var(--spacing-md)' }}>{ticker}</td>
                      <td style={{ padding: 'var(--spacing-md)' }}>{h.shares}</td>
                      <td className="font-mono" style={{ padding: 'var(--spacing-md)' }}>{validAvgCost ? `$${Number(avgCost).toFixed(2)}` : 'No Data'}</td>
                      <td className="font-mono" style={{ padding: 'var(--spacing-md)' }}>{validCurPrice ? `$${Number(curPrice).toFixed(2)}` : 'No Data'}</td>
                      <td className="font-mono" style={{ padding: 'var(--spacing-md)' }}>{validMv ? `$${Number(mv).toFixed(2)}` : 'No Data'}</td>
                      <td style={{ padding: 'var(--spacing-md)' }}>
                        <span style={{ color: validDayCh && dayCh >= 0 ? 'var(--gain-color)' : 'var(--loss-color)' }}>
                          {validDayCh ? `${dayCh >= 0 ? '+' : ''}${Number(dayCh).toFixed(2)}%` : 'No Data'}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--spacing-md)' }}>
                        <span style={{ color: validRet && ret >= 0 ? 'var(--gain-color)' : 'var(--loss-color)' }}>
                          {validRet ? `${ret >= 0 ? '+' : ''}${Number(ret).toFixed(2)}%` : 'No Data'}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--spacing-md)' }}>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicker({ symbol: ticker });
                            setMode('sell');
                            setQuantity(String(h.shares));
                            setConfirmOpen(true);
                          }}
                        >
                          Sell
                        </button>
                      </td>
                    </tr>
                    {expandedRow === ticker && (
                      <tr>
                        <td colSpan={8} style={{ padding: 'var(--spacing-md)', background: 'var(--bg-base)' }}>
                          <div style={{ fontSize: 'var(--font-size-sm)' }}>News for {ticker} (placeholder)</div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p style={{ padding: 'var(--spacing-lg)', color: 'var(--text-secondary)' }}>No holdings.</p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-lg)' }}>
        <div className="card">
          <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Metrics</h3>
          <p>Total Invested: <span className="font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(totalInvested)}</span></p>
          <p>Total Value: <span className="font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(totalValue)}</span></p>
        </div>
        {pieData.length > 0 && (
          <div className="card" style={{ minHeight: 220 }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Allocation</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={60} label={(e) => e.name}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {historyData.length > 0 && (
          <div className="card" style={{ minHeight: 220, gridColumn: '1 / -1' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>30-Day Portfolio Value</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={historyData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="var(--accent-color)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setTradeError(null); }}
        onConfirm={handleExecute}
        title={mode === 'buy' ? 'Confirm Buy' : 'Confirm Sell'}
        confirmLabel={mode === 'buy' ? 'Buy' : 'Sell'}
        confirmVariant={mode === 'buy' ? 'primary' : 'danger'}
      >
        {tradeError && (
          <p style={{ color: 'var(--loss-color)', marginBottom: 'var(--spacing-md)' }}>{tradeError}</p>
        )}
        {mode === 'buy' ? (
          inputMode === 'dollar' ? (
            <p>Buy ${quantity} worth of {selectedTicker?.symbol ?? selectedTicker?.ticker} at ~${(livePrice ?? 0).toFixed(2)} per share?</p>
          ) : (
            <p>Buy {quantity} share(s) of {selectedTicker?.symbol ?? selectedTicker?.ticker} at ~${(livePrice ?? 0).toFixed(2)}?</p>
          )
        ) : (
          <p>Sell {quantity} share(s) of {selectedTicker?.symbol ?? selectedTicker?.ticker}?</p>
        )}
      </ConfirmModal>
    </div>
  );
}
