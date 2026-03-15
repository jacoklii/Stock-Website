"""
[AI] Stock Routes - Stock search, price, movers, indices, history
"""

from flask import Blueprint, request, jsonify
from utils.stock_fetcher import (
    search_tickers,
    get_price,
    get_price_and_change,
    get_movers,
    get_indices,
    get_commodities,
    get_history,
)
from utils.market_hours import get_market_status as get_market_status_data

stock_bp = Blueprint('stock', __name__)


@stock_bp.route('/market-status', methods=['GET'])
def market_status():
    """Get US equity market open/closed and next open/close times."""
    data = get_market_status_data()
    return jsonify({
        'open': data['open'],
        'nextOpen': data.get('nextOpen'),
        'nextClose': data.get('nextClose'),
        'message': data.get('message', ''),
    }), 200


@stock_bp.route('/search', methods=['GET'])
def search():
    """Search tickers by symbol or company name. Query param: q"""
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify([]), 200
    results = search_tickers(q)
    return jsonify(results), 200


@stock_bp.route('/movers', methods=['GET'])
def movers():
    """Get top gainers and losers."""
    data = get_movers()
    return jsonify(data), 200


@stock_bp.route('/indices', methods=['GET'])
def indices():
    """Get S&P 500, NASDAQ, DOW indices."""
    data = get_indices()
    return jsonify(data), 200


@stock_bp.route('/commodities', methods=['GET'])
def commodities():
    """Get trending commodity futures (gold, oil, silver, natural gas)."""
    data = get_commodities()
    return jsonify(data), 200


@stock_bp.route('/price/<ticker>', methods=['GET'])
def price(ticker):
    """Get current price and daily change % for a ticker."""
    if not ticker:
        return jsonify({'error': 'Ticker required'}), 400
    data = get_price_and_change(ticker.upper())
    if not data or data.get('price') is None:
        return jsonify({'error': 'Price unavailable'}), 404
    return jsonify({
        'symbol': ticker.upper(),
        'price': data['price'],
        'changePercent': data.get('change_percent', 0),
    }), 200


@stock_bp.route('/history/<ticker>', methods=['GET'])
def history(ticker):
    """Get historical data for charts. Query param: period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y)"""
    if not ticker:
        return jsonify({'error': 'Ticker required'}), 400
    period = request.args.get('period', '1mo')
    data = get_history(ticker, period)
    return jsonify(data), 200
