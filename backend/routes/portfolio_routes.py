"""
[AI] Portfolio Routes - Portfolio CRUD, buy, sell, holdings, transactions
All routes protected by @require_jwt. Scoped to current user's portfolios.
"""

from flask import Blueprint, request, jsonify, g, send_file
from io import StringIO
from decimal import Decimal
from extensions import db
from models.user_models import Portfolio, Holdings, Transaction
from utils.decorators import require_jwt
from utils.market_hours import is_market_open
from utils.stock_utils import (
    process_buy_transaction,
    process_sell_transaction,
    calculate_holding_value,
    calculate_portfolio_metrics,
)

portfolio_bp = Blueprint('portfolio', __name__)


def _get_portfolio_or_404(portfolio_id):
    """Return portfolio if it belongs to current user, else None."""
    portfolio = Portfolio.query.get(portfolio_id)
    if not portfolio:
        return None, 404
    if portfolio.user_id != g.current_user_id:
        return None, 403
    return portfolio, None


def _holding_to_dict(h, daily_change_percent=None, total_return_percent=None):
    """Convert Holdings model to JSON-serializable dict. Always include daily_change_percent and total_return_percent (use 0 when unknown)."""
    d = {
        'holding_id': h.holding_id,
        'stock_symbol': h.stock_symbol,
        'quantity': int(h.quantity),
        'average_cost': float(h.average_cost),
        'current_price': float(h.current_price),
        'total_value': float(h.total_value or 0),
    }
    try:
        d['daily_change_percent'] = round(float(daily_change_percent if daily_change_percent is not None else 0), 2)
    except (TypeError, ValueError):
        d['daily_change_percent'] = 0
    try:
        d['total_return_percent'] = round(float(total_return_percent if total_return_percent is not None else 0), 2)
    except (TypeError, ValueError):
        d['total_return_percent'] = 0
    return d


def _transaction_to_dict(t):
    """Convert Transaction model to JSON-serializable dict."""
    return {
        'transaction_id': t.transaction_id,
        'stock_symbol': t.stock_symbol,
        'transaction_type': t.transaction_type,
        'quantity': int(t.quantity),
        'price': float(t.price),
        'total_amount': float(t.total_amount),
        'transaction_date': t.transaction_date.isoformat() if t.transaction_date else None,
        'notes': t.notes,
    }


@portfolio_bp.route('', methods=['GET'])
@require_jwt
def list_portfolios():
    """List all portfolios for current user."""
    portfolios = Portfolio.query.filter_by(user_id=g.current_user_id).all()
    return jsonify([{
        'portfolio_id': p.portfolio_id,
        'portfolio_name': p.portfolio_name,
        'current_balance': float(p.current_balance),
        'total_invested': float(p.total_invested or 0),
        'starting_cash': float(p.starting_cash),
    } for p in portfolios]), 200


@portfolio_bp.route('', methods=['POST'])
@require_jwt
def create_portfolio():
    """Create a new portfolio."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    portfolio_name = data.get('portfolio_name', 'New Portfolio')
    starting_cash = data.get('starting_cash', 10000)

    try:
        starting_cash = float(starting_cash)
        if starting_cash < 0:
            return jsonify({'error': 'Starting cash must be non-negative'}), 400
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid starting_cash'}), 400

    portfolio = Portfolio(
        user_id=g.current_user_id,
        portfolio_name=portfolio_name,
        starting_cash=starting_cash,
        current_balance=starting_cash,
        total_invested=0,
    )
    db.session.add(portfolio)
    db.session.commit()
    db.session.refresh(portfolio)

    return jsonify({
        'portfolio_id': portfolio.portfolio_id,
        'portfolio_name': portfolio.portfolio_name,
        'current_balance': float(portfolio.current_balance),
        'total_invested': 0,
    }), 201


@portfolio_bp.route('/<int:portfolio_id>', methods=['GET'])
@require_jwt
def get_portfolio(portfolio_id):
    """Get single portfolio with holdings summary."""
    portfolio, err = _get_portfolio_or_404(portfolio_id)
    if err:
        return jsonify({'error': 'Portfolio not found'}), err

    holdings = Holdings.query.filter_by(portfolio_id=portfolio_id).all()
    holdings_list = [
        {'quantity': int(h.quantity), 'average_cost': float(h.average_cost), 'current_price': float(h.current_price)}
        for h in holdings
    ]
    metrics = calculate_portfolio_metrics(
        holdings_list,
        float(portfolio.current_balance)
    )

    return jsonify({
        'portfolio_id': portfolio.portfolio_id,
        'portfolio_name': portfolio.portfolio_name,
        'current_balance': float(portfolio.current_balance),
        'total_invested': float(portfolio.total_invested or 0),
        'starting_cash': float(portfolio.starting_cash),
        'metrics': metrics,
    }), 200


@portfolio_bp.route('/<int:portfolio_id>', methods=['PATCH'])
@require_jwt
def update_portfolio(portfolio_id):
    """Update portfolio name."""
    portfolio, err = _get_portfolio_or_404(portfolio_id)
    if err:
        return jsonify({'error': 'Portfolio not found'}), err

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    portfolio_name = data.get('portfolio_name') or data.get('name')
    if portfolio_name is not None:
        portfolio.portfolio_name = str(portfolio_name)

    db.session.commit()
    db.session.refresh(portfolio)

    return jsonify({
        'portfolio_id': portfolio.portfolio_id,
        'portfolio_name': portfolio.portfolio_name,
    }), 200


@portfolio_bp.route('/<int:portfolio_id>/buy', methods=['POST'])
@require_jwt
def buy_stock(portfolio_id):
    """Execute buy transaction. Body: stock_symbol, quantity, price (or dollar_amount)."""
    portfolio, err = _get_portfolio_or_404(portfolio_id)
    if err:
        return jsonify({'error': 'Portfolio not found'}), err

    if not is_market_open():
        return jsonify({
            'error': 'Market is closed. US equity hours: 9:30 AM–4:00 PM ET, Mon–Fri (excluding holidays).'
        }), 400

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    stock_symbol = (data.get('stock_symbol') or data.get('symbol') or data.get('ticker') or '').strip().upper()
    quantity = data.get('quantity') or data.get('shares')
    dollar_amount = data.get('dollar_amount') or data.get('dollarAmount')
    price = data.get('price')

    if not stock_symbol:
        return jsonify({'error': 'stock_symbol or ticker is required'}), 400

    # Resolve price first (needed for dollar_amount and for validation)
    if price is None:
        try:
            from utils.stock_fetcher import get_price
            price = get_price(stock_symbol)
        except Exception:
            pass
    if price is None or price <= 0:
        return jsonify({'error': 'Price unavailable; try again later.'}), 400

    try:
        price = float(price)
        if price < 0:
            raise ValueError('Invalid price')
    except (TypeError, ValueError) as e:
        return jsonify({'error': str(e) or 'Invalid price'}), 400

    # Quantity from shares or from dollar_amount
    if dollar_amount is not None:
        try:
            amt = float(dollar_amount)
            if amt <= 0:
                return jsonify({'error': 'dollar_amount must be positive'}), 400
            quantity = max(1, int(amt / price))
        except (TypeError, ValueError):
            return jsonify({'error': 'Invalid dollar_amount'}), 400
    else:
        try:
            quantity = int(quantity)
            if quantity <= 0:
                raise ValueError('Invalid quantity')
        except (TypeError, ValueError) as e:
            return jsonify({'error': str(e) or 'Invalid quantity'}), 400

    result = process_buy_transaction(
        float(portfolio.current_balance),
        quantity,
        price
    )
    if not result['success']:
        return jsonify({'error': result['message']}), 400

    total_cost = result['total_cost']
    portfolio.current_balance = Decimal(str(result['new_balance']))
    portfolio.total_invested = (portfolio.total_invested or 0) + Decimal(str(total_cost))

    holding = Holdings.query.filter_by(
        portfolio_id=portfolio_id,
        stock_symbol=stock_symbol
    ).first()

    if holding:
        old_qty = int(holding.quantity)
        old_cost = float(holding.average_cost)
        new_qty = old_qty + quantity
        new_avg = (old_qty * old_cost + quantity * price) / new_qty
        holding.quantity = new_qty
        holding.average_cost = Decimal(str(round(new_avg, 2)))
        holding.current_price = Decimal(str(price))
        holding.total_value = Decimal(str(round(new_qty * price, 2)))
    else:
        total_value = quantity * price
        holding = Holdings(
            portfolio_id=portfolio_id,
            stock_symbol=stock_symbol,
            quantity=quantity,
            average_cost=Decimal(str(price)),
            current_price=Decimal(str(price)),
            total_value=Decimal(str(round(total_value, 2))),
        )
        db.session.add(holding)

    transaction = Transaction(
        portfolio_id=portfolio_id,
        stock_symbol=stock_symbol,
        transaction_type='BUY',
        quantity=quantity,
        price=Decimal(str(price)),
        total_amount=Decimal(str(total_cost)),
    )
    db.session.add(transaction)
    db.session.commit()
    db.session.refresh(holding)
    db.session.refresh(portfolio)

    return jsonify({
        'message': 'Buy successful',
        'holding': _holding_to_dict(holding),
        'new_balance': float(portfolio.current_balance),
    }), 201


@portfolio_bp.route('/<int:portfolio_id>/sell', methods=['POST'])
@require_jwt
def sell_stock(portfolio_id):
    """Execute sell transaction. Body: stock_symbol, quantity, price."""
    portfolio, err = _get_portfolio_or_404(portfolio_id)
    if err:
        return jsonify({'error': 'Portfolio not found'}), err

    if not is_market_open():
        return jsonify({
            'error': 'Market is closed. US equity hours: 9:30 AM–4:00 PM ET, Mon–Fri (excluding holidays).'
        }), 400

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    stock_symbol = (data.get('stock_symbol') or data.get('symbol') or data.get('ticker') or '').strip().upper()
    quantity = data.get('quantity') or data.get('shares')
    price = data.get('price')

    if not stock_symbol:
        return jsonify({'error': 'stock_symbol or ticker is required'}), 400

    try:
        quantity = int(quantity)
        if quantity <= 0:
            raise ValueError('Invalid quantity')
    except (TypeError, ValueError) as e:
        return jsonify({'error': str(e) or 'Invalid quantity'}), 400

    holding = Holdings.query.filter_by(
        portfolio_id=portfolio_id,
        stock_symbol=stock_symbol
    ).first()

    if not holding:
        return jsonify({'error': f'No holding for {stock_symbol}'}), 404

    if price is None:
        try:
            from utils.stock_fetcher import get_price
            price = get_price(stock_symbol)
        except Exception:
            pass
    if price is None:
        price = float(holding.current_price)
    try:
        price = float(price)
        if price < 0:
            raise ValueError('Invalid price')
    except (TypeError, ValueError) as e:
        return jsonify({'error': str(e) or 'Invalid price'}), 400

    quantity_owned = int(holding.quantity)
    result = process_sell_transaction(
        quantity_owned,
        quantity,
        price,
        float(portfolio.current_balance)
    )
    if not result['success']:
        return jsonify({'error': result['message']}), 400

    portfolio.current_balance = Decimal(str(result['new_balance']))
    proceeds = quantity * price
    portfolio.total_invested = max(0, (portfolio.total_invested or 0) - Decimal(str(quantity * float(holding.average_cost))))

    if quantity_owned == quantity:
        db.session.delete(holding)
    else:
        holding.quantity = quantity_owned - quantity
        holding.total_value = Decimal(str(round(holding.quantity * price, 2)))
        holding.current_price = Decimal(str(price))

    transaction = Transaction(
        portfolio_id=portfolio_id,
        stock_symbol=stock_symbol,
        transaction_type='SELL',
        quantity=quantity,
        price=Decimal(str(price)),
        total_amount=Decimal(str(proceeds)),
    )
    db.session.add(transaction)
    db.session.commit()
    db.session.refresh(portfolio)

    return jsonify({
        'message': 'Sell successful',
        'proceeds': result['proceeds'],
        'new_balance': float(portfolio.current_balance),
    }), 200


@portfolio_bp.route('/<int:portfolio_id>/holdings', methods=['GET'])
@require_jwt
def get_holdings(portfolio_id):
    """List holdings for portfolio with live prices, daily_change_percent, and total_return_percent."""
    portfolio, err = _get_portfolio_or_404(portfolio_id)
    if err:
        return jsonify({'error': 'Portfolio not found'}), err

    holdings = Holdings.query.filter_by(portfolio_id=portfolio_id).all()
    out = []

    try:
        from utils.stock_fetcher import get_price_and_change
        for h in holdings:
            daily_pct = None
            total_ret_pct = None
            live_price = float(h.current_price)
            res = get_price_and_change(h.stock_symbol)
            if res and res.get('price') is not None:
                live_price = res['price']
                daily_pct = res.get('change_percent', 0)
                h.current_price = Decimal(str(live_price))
                h.total_value = Decimal(str(round(int(h.quantity) * live_price, 2)))
            avg = float(h.average_cost)
            if avg and avg > 0:
                total_ret_pct = ((live_price - avg) / avg) * 100
            out.append(_holding_to_dict(h, daily_change_percent=daily_pct, total_return_percent=total_ret_pct))
        db.session.commit()
    except Exception:
        out = [_holding_to_dict(h) for h in holdings]

    return jsonify(out), 200


@portfolio_bp.route('/<int:portfolio_id>/holdings/<int:holding_id>', methods=['GET'])
@require_jwt
def get_holding(portfolio_id, holding_id):
    """Get single holding."""
    portfolio, err = _get_portfolio_or_404(portfolio_id)
    if err:
        return jsonify({'error': 'Portfolio not found'}), err

    holding = Holdings.query.filter_by(
        portfolio_id=portfolio_id,
        holding_id=holding_id
    ).first()
    if not holding:
        return jsonify({'error': 'Holding not found'}), 404

    return jsonify(_holding_to_dict(holding)), 200


@portfolio_bp.route('/<int:portfolio_id>/transactions', methods=['GET'])
@require_jwt
def get_transactions(portfolio_id):
    """Get transaction history. Query params: date_from, date_to, ticker"""
    portfolio, err = _get_portfolio_or_404(portfolio_id)
    if err:
        return jsonify({'error': 'Portfolio not found'}), err

    q = Transaction.query.filter_by(portfolio_id=portfolio_id)
    ticker = request.args.get('ticker') or request.args.get('stock_symbol')
    if ticker:
        q = q.filter(Transaction.stock_symbol == ticker.upper())
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    if date_from:
        q = q.filter(Transaction.transaction_date >= date_from)
    if date_to:
        q = q.filter(Transaction.transaction_date <= date_to)

    transactions = q.order_by(Transaction.transaction_date.desc()).all()
    return jsonify([_transaction_to_dict(t) for t in transactions]), 200


@portfolio_bp.route('/<int:portfolio_id>/logs', methods=['GET'])
@require_jwt
def get_logs(portfolio_id):
    """Get event logs (stub - returns empty for MVP)."""
    portfolio, err = _get_portfolio_or_404(portfolio_id)
    if err:
        return jsonify({'error': 'Portfolio not found'}), err
    return jsonify({'logs': []}), 200


@portfolio_bp.route('/<int:portfolio_id>/reset', methods=['POST'])
@require_jwt
def reset_portfolio(portfolio_id):
    """Reset portfolio: clear holdings, restore starting cash."""
    portfolio, err = _get_portfolio_or_404(portfolio_id)
    if err:
        return jsonify({'error': 'Portfolio not found'}), err

    Holdings.query.filter_by(portfolio_id=portfolio_id).delete()
    Transaction.query.filter_by(portfolio_id=portfolio_id).delete()
    portfolio.current_balance = portfolio.starting_cash
    portfolio.total_invested = 0
    db.session.commit()
    db.session.refresh(portfolio)

    return jsonify({
        'message': 'Portfolio reset successfully',
        'current_balance': float(portfolio.current_balance),
    }), 200


@portfolio_bp.route('/<int:portfolio_id>/transactions/export', methods=['GET'])
@require_jwt
def export_transactions(portfolio_id):
    """Export transactions as CSV."""
    portfolio, err = _get_portfolio_or_404(portfolio_id)
    if err:
        return jsonify({'error': 'Portfolio not found'}), err

    ticker = request.args.get('ticker') or request.args.get('stock_symbol')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    q = Transaction.query.filter_by(portfolio_id=portfolio_id)
    if ticker:
        q = q.filter(Transaction.stock_symbol == ticker.upper())
    if date_from:
        q = q.filter(Transaction.transaction_date >= date_from)
    if date_to:
        q = q.filter(Transaction.transaction_date <= date_to)
    transactions = q.order_by(Transaction.transaction_date.desc()).all()

    output = StringIO()
    output.write('Date,Ticker,Action,Shares,Price per Share,Total\n')
    for t in transactions:
        date_str = t.transaction_date.strftime('%Y-%m-%d %H:%M') if t.transaction_date else ''
        output.write(f'{date_str},{t.stock_symbol},{t.transaction_type},{t.quantity},{t.price},{t.total_amount}\n')

    output.seek(0)
    return send_file(
        output,
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'portfolio_{portfolio_id}_transactions.csv',
    )
