"""
[AI] Stock Fetcher - yfinance wrapper for stock price data
Functions for fetching stock prices, search, movers, indices, and history.
All yfinance calls use a timeout to avoid hanging requests.
"""

import math
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError

try:
    import yfinance as yf
except ImportError:
    yf = None

# Timeout in seconds for any single yfinance operation
YF_TIMEOUT = 10


def _with_timeout(func, *args, timeout=YF_TIMEOUT, default=None):
    """Run func(*args) in a thread; return result or default on timeout/exception."""
    if func is None:
        return default
    try:
        with ThreadPoolExecutor(max_workers=1) as ex:
            future = ex.submit(func, *args)
            return future.result(timeout=timeout)
    except (FuturesTimeoutError, Exception):
        return default


def _ticker_obj(symbol):
    """Return yfinance Ticker object or None."""
    if not yf or not symbol:
        return None
    return yf.Ticker(str(symbol).upper())


def _safe_float(val, default=None):
    """Convert to float; return default if NaN, inf, or invalid."""
    if val is None:
        return default
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f) or f < 0:
            return default
        return f
    except (TypeError, ValueError):
        return default


def search_tickers(query):
    """
    Search tickers by symbol or company name.
    Returns list of dicts with symbol, shortName, longName.
    """
    if not yf or not query or len(query.strip()) < 1:
        return []

    def _search():
        try:
            Search = getattr(yf, 'search', None) or getattr(yf, 'Search', None)
            if Search is None:
                results = yf.search(query.strip()) if hasattr(yf, 'search') else None
            else:
                results = Search(query.strip(), max_results=15) if hasattr(Search, '__call__') else None
            if results is None:
                return []
            out = []
            if hasattr(results, 'quotes') and results.quotes:
                for q in results.quotes[:15]:
                    if hasattr(q, 'symbol'):
                        out.append({
                            'symbol': str(getattr(q, 'symbol', '')),
                            'shortName': str(getattr(q, 'shortname', getattr(q, 'shortName', ''))),
                            'longName': str(getattr(q, 'longname', getattr(q, 'longName', ''))),
                        })
            elif isinstance(results, list):
                for q in results[:15]:
                    if isinstance(q, dict):
                        out.append({
                            'symbol': str(q.get('symbol', '')),
                            'shortName': str(q.get('shortName', q.get('shortname', ''))),
                            'longName': str(q.get('longName', q.get('longname', ''))),
                        })
            elif hasattr(results, 'empty') and not results.empty and hasattr(results, 'columns'):
                cols = getattr(results, 'columns', [])
                if 'symbol' in cols or len(cols) > 0:
                    for _, row in results.head(15).iterrows():
                        out.append({
                            'symbol': str(row.get('symbol', '')),
                            'shortName': str(row.get('shortName', row.get('shortname', row.get('symbol', '')))),
                            'longName': str(row.get('longName', row.get('longname', row.get('shortName', '')))),
                        })
            return out
        except Exception:
            return []

    return _with_timeout(_search, timeout=YF_TIMEOUT, default=[]) or []


def get_price(ticker):
    """
    Get current price for a ticker. Prefers history(5d) last close; fallback fast_info.
    Returns float or None if unavailable. Uses timeout to avoid hanging.
    """
    if not yf or not ticker:
        return None

    def _get():
        try:
            t = _ticker_obj(str(ticker).upper())
            hist = t.history(period='5d')
            if hist is not None and not hist.empty:
                close = _safe_float(hist['Close'].iloc[-1])
                if close is not None:
                    return close
            if hasattr(t, 'fast_info'):
                info = t.fast_info
                if hasattr(info, 'last_price') and info.last_price is not None:
                    return _safe_float(info.last_price)
            hist = t.history(period='1d')
            if hist is not None and not hist.empty:
                return _safe_float(hist['Close'].iloc[-1])
            return None
        except Exception:
            return None

    return _with_timeout(_get, timeout=YF_TIMEOUT, default=None)


def get_price_and_change(ticker):
    """
    Get current price and daily % change (vs previous close).
    Returns:
        dict: { 'price': float, 'change_percent': float } or None if unavailable.
    """
    if not yf or not ticker:
        return None

    def _get():
        try:
            t = _ticker_obj(str(ticker).upper())
            hist = t.history(period='5d')
            if hist is None or hist.empty or len(hist) < 1:
                return None
            close = _safe_float(hist['Close'].iloc[-1])
            if close is None:
                return None
            prev = close
            if len(hist) >= 2:
                prev = _safe_float(hist['Close'].iloc[-2])
            if prev is None or prev == 0:
                prev = close
            chg = ((close - prev) / prev * 100) if prev else 0
            return {'price': close, 'change_percent': round(float(chg), 2)}
        except Exception:
            return None

    return _with_timeout(_get, timeout=YF_TIMEOUT, default=None)


def get_quote_summary(ticker):
    """
    Get a compact quote snapshot for tables (watchlist/holdings).
    Returns:
        dict: {
          'price': float|None,
          'open': float|None,
          'change_percent': float|None,
          'low_52w': float|None,
          'high_52w': float|None,
        }
    """
    if not yf or not ticker:
        return None

    symbol = str(ticker).upper()

    def _get():
        try:
            t = _ticker_obj(symbol)
            out = {
                'price': None,
                'open': None,
                'change_percent': None,
                'low_52w': None,
                'high_52w': None,
            }

            # Price + change from history
            pc = get_price_and_change(symbol)
            if pc:
                out['price'] = pc.get('price')
                out['change_percent'] = pc.get('change_percent')

            # Open + 52w range from fast_info/info
            fi = getattr(t, 'fast_info', None)
            if fi is not None:
                out['open'] = _safe_float(getattr(fi, 'open', None), default=out['open'])
                out['low_52w'] = _safe_float(getattr(fi, 'year_low', None), default=out['low_52w'])
                out['high_52w'] = _safe_float(getattr(fi, 'year_high', None), default=out['high_52w'])

            # Fallback to .info only if needed (can be slower)
            if out['open'] is None or out['low_52w'] is None or out['high_52w'] is None:
                info = getattr(t, 'info', None) or {}
                if isinstance(info, dict):
                    out['open'] = out['open'] if out['open'] is not None else _safe_float(info.get('open'))
                    out['low_52w'] = out['low_52w'] if out['low_52w'] is not None else _safe_float(info.get('fiftyTwoWeekLow'))
                    out['high_52w'] = out['high_52w'] if out['high_52w'] is not None else _safe_float(info.get('fiftyTwoWeekHigh'))

            return out
        except Exception:
            return None

    return _with_timeout(_get, timeout=YF_TIMEOUT, default=None)

def get_movers():
    """
    Get top gainers and losers with real % change from history.
    Returns dict: {'gainers': [...], 'losers': [...]} with symbol, name, price, change_percent.
    """
    if not yf:
        return {'gainers': [], 'losers': []}

    symbols = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META', 'AMZN', 'TSLA', 'JPM', 'V', 'JNJ']
    candidates = []
    for sym in symbols:
        res = get_price_and_change(sym)
        if res and res.get('price') is not None:
            candidates.append({
                'symbol': sym,
                'name': sym,
                'price': res['price'],
                'change_percent': res.get('change_percent', 0),
            })
    candidates.sort(key=lambda x: x.get('change_percent', 0), reverse=True)
    gainers = [c for c in candidates if c.get('change_percent', 0) >= 0][:3]
    losers = [c for c in candidates if c.get('change_percent', 0) < 0][:3]
    losers.reverse()
    return {'gainers': gainers, 'losers': losers}


def get_indices():
    """
    Get S&P 500, NASDAQ, DOW indices with price and daily change.
    Returns list: [{'symbol': '^GSPC', 'name': 'S&P 500', 'price': ..., 'change_percent': ...}, ...]
    """
    indices = [
        ('^GSPC', 'S&P 500'),
        ('^IXIC', 'NASDAQ'),
        ('^DJI', 'DOW'),
    ]
    out = []
    for symbol, name in indices:
        res = get_price_and_change(symbol)
        if res and res.get('price') is not None:
            out.append({
                'symbol': symbol,
                'name': name,
                'price': res['price'],
                'change_percent': res.get('change_percent', 0),
            })
    return out


def get_commodities():
    """
    Get trending commodity futures (gold, oil, silver, natural gas) with price and daily change.
    Returns list: [{'symbol': 'GC=F', 'name': 'Gold', 'price': ..., 'change_percent': ...}, ...]
    """
    commodities = [
        ('GC=F', 'Gold'),
        ('CL=F', 'Crude Oil'),
        ('SI=F', 'Silver'),
        ('NG=F', 'Natural Gas'),
    ]
    out = []
    for symbol, name in commodities:
        res = get_price_and_change(symbol)
        if res and res.get('price') is not None:
            out.append({
                'symbol': symbol,
                'name': name,
                'price': res['price'],
                'change_percent': res.get('change_percent', 0),
            })
    return out


def get_history(ticker, period='1mo'):
    """
    Get historical OHLC data for charts.
    Returns list: [{'date': 'YYYY-MM-DD', 'open': ..., 'high': ..., 'low': ..., 'close': ...}, ...]
    """
    if not yf or not ticker:
        return []

    def _hist():
        try:
            t = _ticker_obj(str(ticker).upper())
            hist = t.history(period=period)
            if hist is None or hist.empty:
                return []
            out = []
            for dt, row in hist.iterrows():
                out.append({
                    'date': dt.strftime('%Y-%m-%d') if hasattr(dt, 'strftime') else str(dt),
                    'open': float(row['Open']),
                    'high': float(row['High']),
                    'low': float(row['Low']),
                    'close': float(row['Close']),
                })
            return out
        except Exception:
            return []

    return _with_timeout(_hist, timeout=YF_TIMEOUT, default=[]) or []
