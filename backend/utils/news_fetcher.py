"""
[AI] News Fetcher - Fetch business and stock news
Uses RSS/News API or mock data for MVP
"""

import requests
from datetime import datetime
from html import unescape
import re

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None


def get_business_news(limit=20):
    """
    Get general market/business headlines.
    Returns:
        list: [{'title': ..., 'description': ..., 'source': ..., 'url': ..., 'published_date': ...}, ...]
    """
    try:
        # Yahoo Finance RSS
        url = 'https://finance.yahoo.com/news/rssindex'
        r = requests.get(url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
        if r.status_code == 200 and BeautifulSoup:
            soup = BeautifulSoup(r.content, 'xml')
            items = soup.find_all('item', limit=limit)
            out = []
            for item in items:
                title = item.find('title')
                link = item.find('link')
                pub = item.find('pubDate')
                desc = item.find('description')
                title_str = unescape(title.get_text()) if title else ''
                link_str = link.get_text().strip() if link else ''
                pub_str = pub.get_text() if pub else None
                desc_str = ''
                if desc and desc.get_text():
                    raw = desc.get_text()
                    if BeautifulSoup:
                        desc_soup = BeautifulSoup(raw, 'html.parser')
                        desc_str = desc_soup.get_text().strip()[:300]
                    else:
                        desc_str = re.sub(r'<[^>]+>', '', raw)[:300]
                out.append({
                    'title': title_str,
                    'description': desc_str,
                    'source': 'Yahoo Finance',
                    'url': link_str,
                    'published_date': pub_str,
                })
            return out
    except Exception:
        pass

    return _mock_news('BUSINESS', limit)


def get_news_for_symbols(symbols, limit=20):
    """
    Get news filtered by stock symbols.
    Args:
        symbols (list): Stock symbols
    Returns:
        list: News items with stock_symbol when applicable. Empty list if no symbols (do not fall back to market news).
    """
    if not symbols:
        return []

    # NOTE: This function returns a flat list for backwards compatibility.
    # Prefer get_news_grouped_for_symbols() for \"per ticker\" views.
    try:
        import yfinance as yf
        symbols_norm = [str(s).strip().upper() for s in (symbols or []) if str(s).strip()]
        if not symbols_norm:
            return []

        max_symbols = 25
        symbols_norm = symbols_norm[:max_symbols]

        # Distribute coverage across symbols: aim for up to 10 per symbol, but
        # never exceed the global limit.
        per_symbol = max(1, min(10, limit // max(1, len(symbols_norm)) or 1))

        all_news = []
        seen = set()
        for sym in symbols_norm:
            t = yf.Ticker(sym)
            news_list = t.news or [] if hasattr(t, 'news') else []
            count_for_sym = 0
            for n in news_list:
                if len(all_news) >= limit:
                    break
                link = n.get('link', n.get('url', ''))
                if link and link in seen:
                    continue
                seen.add(link)
                all_news.append({
                    'title': n.get('title', ''),
                    'description': n.get('summary', n.get('publisher', {}).get('title', ''))[:300],
                    'source': n.get('publisher', {}).get('title', 'Unknown') if isinstance(n.get('publisher'), dict) else 'Unknown',
                    'url': link,
                    'published_date': datetime.fromtimestamp(n.get('published', 0)).isoformat() if n.get('published') else None,
                    'stock_symbol': sym,
                })
                count_for_sym += 1
                if count_for_sym >= per_symbol:
                    break
            if len(all_news) >= limit:
                break

        if all_news:
            return all_news[:limit]
    except Exception:
        pass

    return _mock_news('GENERAL', limit, symbols)


def get_news_grouped_for_symbols(symbols, per_symbol=10, max_symbols=25):
    """
    Get news grouped by stock symbol.
    Args:
        symbols (list[str]): stock symbols
        per_symbol (int): number of headlines per symbol
        max_symbols (int): max symbols to fetch
    Returns:
        dict: { 'groups': [ { 'symbol': 'AAPL', 'articles': [...] }, ... ] }
    """
    symbols = [str(s).strip().upper() for s in (symbols or []) if str(s).strip()]
    symbols = symbols[:max_symbols]
    per_symbol = max(1, min(int(per_symbol or 10), 10))

    if not symbols:
        return {'groups': []}

    groups = []
    try:
        import yfinance as yf
        for sym in symbols:
            t = yf.Ticker(sym)
            news_list = t.news or [] if hasattr(t, 'news') else []
            articles = []
            for n in news_list[:per_symbol]:
                link = n.get('link', n.get('url', ''))
                articles.append({
                    'title': n.get('title', ''),
                    'description': n.get('summary', n.get('publisher', {}).get('title', ''))[:300],
                    'source': n.get('publisher', {}).get('title', 'Unknown') if isinstance(n.get('publisher'), dict) else 'Unknown',
                    'url': link,
                    'published_date': datetime.fromtimestamp(n.get('published', 0)).isoformat() if n.get('published') else None,
                    'stock_symbol': sym,
                })
            groups.append({'symbol': sym, 'articles': articles})
        return {'groups': groups}
    except Exception:
        # Fallback mock: return 1-3 items per symbol so UI can still render grouped sections.
        groups = []
        for sym in symbols:
            groups.append({'symbol': sym, 'articles': _mock_news('GENERAL', per_symbol, [sym])})
        return {'groups': groups}


def _mock_news(news_type, limit, symbols=None):
    """Fallback mock news."""
    items = [
        {'title': 'Market Update: Stocks Show Resilience', 'source': 'Financial News'},
        {'title': 'Tech Sector Leads Gains Amid Economic Data', 'source': 'Market Watch'},
        {'title': 'Fed Signals Steady Policy Path', 'source': 'Reuters'},
        {'title': 'Earnings Season Kicks Off With Strong Results', 'source': 'Bloomberg'},
        {'title': 'Investors Eye Inflation Data This Week', 'source': 'CNBC'},
    ]
    symbols_norm = [str(s).strip().upper() for s in (symbols or []) if str(s).strip()]
    if news_type == 'BUSINESS':
        # Pure market-wide headlines, no ticker tagging.
        return [
            {
                'title': item['title'],
                'description': "General market news and updates.",
                'source': item['source'],
                'url': '',
                'published_date': datetime.utcnow().isoformat(),
                'stock_symbol': None,
            }
            for item in items[:limit]
        ]

    if not symbols_norm:
        symbols_norm = ['SPY']

    out = []
    for i in range(limit):
        item = items[i % len(items)]
        sym = symbols_norm[i % len(symbols_norm)]
        out.append({
            'title': f"{item['title']} ({sym})",
            'description': f"Market news and updates for {sym}.",
            'source': item['source'],
            'url': '',
            'published_date': datetime.utcnow().isoformat(),
            'stock_symbol': sym,
        })
    return out
