"""
[AI] Auth Routes - User authentication endpoints
Handles register, login, logout, me
"""

from flask import Blueprint, request, jsonify, g
from extensions import db
from models.user_models import User, Portfolio
from utils.auth_utils import hash_password, verify_password, generate_jwt_token
from utils.decorators import require_jwt

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user and create default portfolio.
    Body: username, email, password, region, portfolio_name, starting_cash, currency
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    username = data.get('username')
    email = data.get('email') or (f'{username}@stockportfolio.local' if username else None)
    password = data.get('password')
    portfolio_name = data.get('portfolio_name', username or 'My Portfolio')
    starting_cash = data.get('starting_cash', 10000)
    region = data.get('region', 'US')
    currency = data.get('currency', 'USD')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 409

    try:
        starting_cash = float(starting_cash)
        if starting_cash < 0:
            return jsonify({'error': 'Starting cash must be non-negative'}), 400
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid starting_cash'}), 400

    password_hash = hash_password(password)
    user = User(username=username, email=email, password_hash=password_hash)
    db.session.add(user)
    db.session.flush()  # Get user_id

    portfolio = Portfolio(
        user_id=user.user_id,
        portfolio_name=portfolio_name,
        starting_cash=starting_cash,
        current_balance=starting_cash,
        total_invested=0
    )
    db.session.add(portfolio)
    db.session.commit()
    db.session.refresh(portfolio)

    token = generate_jwt_token(user.user_id, portfolio.portfolio_id)
    return jsonify({
        'token': token if isinstance(token, str) else token.decode('utf-8'),
        'user': {
            'user_id': user.user_id,
            'username': user.username,
            'email': user.email,
        },
        'portfolio': {
            'portfolio_id': portfolio.portfolio_id,
            'portfolio_name': portfolio.portfolio_name,
            'current_balance': float(portfolio.current_balance),
        }
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login with username and password.
    Body: username, password
    Returns JWT token and user/portfolio info.
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'Invalid username or password'}), 401

    if not verify_password(password, user.password_hash):
        return jsonify({'error': 'Invalid username or password'}), 401

    portfolio = Portfolio.query.filter_by(user_id=user.user_id).first()
    portfolio_id = portfolio.portfolio_id if portfolio else None

    token = generate_jwt_token(user.user_id, portfolio_id)
    result = {
        'token': token if isinstance(token, str) else token.decode('utf-8'),
        'user': {
            'user_id': user.user_id,
            'username': user.username,
            'email': user.email,
        },
    }
    if portfolio:
        result['portfolio'] = {
            'portfolio_id': portfolio.portfolio_id,
            'portfolio_name': portfolio.portfolio_name,
            'current_balance': float(portfolio.current_balance),
        }

    return jsonify(result), 200


@auth_bp.route('/me', methods=['GET'])
@require_jwt
def me():
    """Get current user and portfolio (requires JWT)."""
    user = User.query.get(g.current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    portfolio = Portfolio.query.filter_by(user_id=user.user_id).first()
    result = {
        'user': {
            'user_id': user.user_id,
            'username': user.username,
            'email': user.email,
        },
    }
    if portfolio:
        result['portfolio'] = {
            'portfolio_id': portfolio.portfolio_id,
            'portfolio_name': portfolio.portfolio_name,
            'current_balance': float(portfolio.current_balance),
        }
    return jsonify(result), 200


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Logout - server-side no-op; frontend clears token.
    """
    return jsonify({'message': 'Logged out successfully'}), 200
