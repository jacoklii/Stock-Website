"""
[AI] News Routes - Business news, portfolio news, watchlist news
"""

from flask import Blueprint, request, jsonify, g
from extensions import db
from models.user_models import Portfolio, Holdings, Watchlist
from utils.decorators import require_jwt
from utils.news_fetcher import get_business_news, get_news_for_symbols

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
    limit = request.args.get('limit', 20, type=int)
    limit = min(limit, 50)
    data = get_news_for_symbols(symbols, limit)
    return jsonify(data), 200


@news_bp.route('/portfolios/<int:portfolio_id>/watchlist-news', methods=['GET'])
@require_jwt
def watchlist_news(portfolio_id):
    """Get news for watchlist tickers."""
    portfolio = _portfolio_owned(portfolio_id)
    if not portfolio:
        return jsonify({'error': 'Portfolio not found'}), 404

    watchlist = Watchlist.query.filter_by(portfolio_id=portfolio_id).all()
    symbols = [w.stock_symbol for w in watchlist]
    limit = request.args.get('limit', 20, type=int)
    limit = min(limit, 50)
    data = get_news_for_symbols(symbols, limit)
    return jsonify(data), 200
