"""
[AI] Watchlist Routes - Get, add, remove watchlist items
"""

from flask import Blueprint, request, jsonify, g
from extensions import db
from models.user_models import Portfolio, Watchlist
from utils.decorators import require_jwt

watchlist_bp = Blueprint('watchlist', __name__)


def _get_portfolio_or_404(portfolio_id):
    """Return portfolio if it belongs to current user."""
    portfolio = Portfolio.query.get(portfolio_id)
    if not portfolio:
        return None, 404
    if portfolio.user_id != g.current_user_id:
        return None, 403
    return portfolio, None


def _watchlist_to_dict(w):
    """Convert Watchlist model to JSON-serializable dict."""
    return {
        'watchlist_id': w.watchlist_id,
        'stock_symbol': w.stock_symbol,
        'added_date': w.added_date.isoformat() if w.added_date else None,
        'notes': w.notes,
    }


@watchlist_bp.route('/<int:portfolio_id>/watchlist', methods=['GET'])
@require_jwt
def get_watchlist(portfolio_id):
    """List watchlist items for portfolio."""
    portfolio, err = _get_portfolio_or_404(portfolio_id)
    if err:
        return jsonify({'error': 'Portfolio not found'}), err

    items = Watchlist.query.filter_by(portfolio_id=portfolio_id).order_by(Watchlist.added_date.desc()).all()
    return jsonify([_watchlist_to_dict(w) for w in items]), 200


@watchlist_bp.route('/<int:portfolio_id>/watchlist', methods=['POST'])
@require_jwt
def add_to_watchlist(portfolio_id):
    """Add ticker to watchlist. Body: stock_symbol"""
    portfolio, err = _get_portfolio_or_404(portfolio_id)
    if err:
        return jsonify({'error': 'Portfolio not found'}), err

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    stock_symbol = (data.get('stock_symbol') or data.get('symbol') or '').strip().upper()
    if not stock_symbol:
        return jsonify({'error': 'stock_symbol is required'}), 400

    existing = Watchlist.query.filter_by(
        portfolio_id=portfolio_id,
        stock_symbol=stock_symbol
    ).first()
    if existing:
        return jsonify(_watchlist_to_dict(existing)), 200

    w = Watchlist(
        portfolio_id=portfolio_id,
        stock_symbol=stock_symbol,
    )
    db.session.add(w)
    db.session.commit()
    db.session.refresh(w)

    return jsonify(_watchlist_to_dict(w)), 201


@watchlist_bp.route('/<int:portfolio_id>/watchlist/<int:watchlist_id>', methods=['DELETE'])
@require_jwt
def remove_from_watchlist(portfolio_id, watchlist_id):
    """Remove item from watchlist."""
    portfolio, err = _get_portfolio_or_404(portfolio_id)
    if err:
        return jsonify({'error': 'Portfolio not found'}), err

    w = Watchlist.query.filter_by(
        portfolio_id=portfolio_id,
        watchlist_id=watchlist_id
    ).first()
    if not w:
        return jsonify({'error': 'Watchlist item not found'}), 404

    db.session.delete(w)
    db.session.commit()
    return jsonify({'message': 'Removed from watchlist'}), 200
