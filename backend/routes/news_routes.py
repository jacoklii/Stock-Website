"""
[AI] News Routes - Business news, portfolio news, watchlist news
"""

from flask import Blueprint, request, jsonify, g
from extensions import db
from models.user_models import Portfolio, Holdings, Watchlist
from utils.decorators import require_jwt
from utils.news_fetcher import get_business_news, get_news_for_symbols, get_news_grouped_for_symbols

news_bp = Blueprint('news', __name__)


def _portfolio_owned(portfolio_id):
    """Check if portfolio belongs to current user."""
    portfolio = Portfolio.query.get(portfolio_id)
    if not portfolio or portfolio.user_id != g.current_user_id:
        return None
    return portfolio


@news_bp.route('/news/business', methods=['GET'])
def business_news():
    """Get general market headlines."""
    limit = request.args.get('limit', 20, type=int)
    limit = min(limit, 50)
    data = get_business_news(limit)
    return jsonify(data), 200


@news_bp.route('/portfolios/<int:portfolio_id>/news', methods=['GET'])
@require_jwt
def portfolio_news(portfolio_id):
    """Get news for portfolio holdings."""
    portfolio = _portfolio_owned(portfolio_id)
    if not portfolio:
        return jsonify({'error': 'Portfolio not found'}), 404

    holdings = Holdings.query.filter_by(portfolio_id=portfolio_id).all()
    symbols = [h.stock_symbol for h in holdings]
    per_symbol = request.args.get('per_symbol', 10, type=int)
    per_symbol = min(max(per_symbol, 1), 10)
    # Return grouped structure for UI (up to 10 headlines per holding).
    grouped = get_news_grouped_for_symbols(symbols, per_symbol=per_symbol)
    # Keep a flat list for backwards compatibility.
    total_limit = min(200, max(per_symbol * max(1, len(symbols)), per_symbol))
    flat = get_news_for_symbols(symbols, limit=total_limit)
    return jsonify({'groups': grouped.get('groups', []), 'articles': flat}), 200


@news_bp.route('/portfolios/<int:portfolio_id>/watchlist-news', methods=['GET'])
@require_jwt
def watchlist_news(portfolio_id):
    """Get news for watchlist tickers."""
    portfolio = _portfolio_owned(portfolio_id)
    if not portfolio:
        return jsonify({'error': 'Portfolio not found'}), 404

    watchlist = Watchlist.query.filter_by(portfolio_id=portfolio_id).all()
    symbols = [w.stock_symbol for w in watchlist]
    per_symbol = request.args.get('per_symbol', 10, type=int)
    per_symbol = min(max(per_symbol, 1), 10)
    grouped = get_news_grouped_for_symbols(symbols, per_symbol=per_symbol)
    total_limit = min(200, max(per_symbol * max(1, len(symbols)), per_symbol))
    flat = get_news_for_symbols(symbols, limit=total_limit)
    return jsonify({'groups': grouped.get('groups', []), 'articles': flat}), 200
