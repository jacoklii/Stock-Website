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

    try:
        import yfinance as yf
        all_news = []
        seen = set()
        for sym in symbols[:5]:
            t = yf.Ticker(sym.upper())
            news_list = t.news[:5] if hasattr(t, 'news') else []
            for n in news_list:
                link = n.get('link', n.get('url', ''))
                if link and link not in seen:
                    seen.add(link)
                    all_news.append({
                        'title': n.get('title', ''),
                        'description': n.get('summary', n.get('publisher', {}).get('title', ''))[:300],
                        'source': n.get('publisher', {}).get('title', 'Unknown') if isinstance(n.get('publisher'), dict) else 'Unknown',
                        'url': link,
                        'published_date': datetime.fromtimestamp(n.get('published', 0)).isoformat() if n.get('published') else None,
                        'stock_symbol': sym.upper(),
                    })
                if len(all_news) >= limit:
                    break
            if len(all_news) >= limit:
                break
        if all_news:
            return all_news[:limit]
    except Exception:
        pass

    return _mock_news('GENERAL', limit, symbols)


def _mock_news(news_type, limit, symbols=None):
    """Fallback mock news."""
    items = [
        {'title': 'Market Update: Stocks Show Resilience', 'source': 'Financial News'},
        {'title': 'Tech Sector Leads Gains Amid Economic Data', 'source': 'Market Watch'},
        {'title': 'Fed Signals Steady Policy Path', 'source': 'Reuters'},
        {'title': 'Earnings Season Kicks Off With Strong Results', 'source': 'Bloomberg'},
        {'title': 'Investors Eye Inflation Data This Week', 'source': 'CNBC'},
    ]
    sym = (symbols[0].upper() if symbols else 'SPY')
    return [
        {
            'title': f"{item['title']} ({sym})",
            'description': f"Market news and updates for {sym}.",
            'source': item['source'],
            'url': '',
            'published_date': datetime.utcnow().isoformat(),
            'stock_symbol': sym if news_type != 'BUSINESS' else None,
        }
        for item in items[:limit]
    ]
