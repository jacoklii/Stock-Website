"""
[AI] Decorators - Authentication Middleware
JWT authentication decorator for protecting routes
"""

from functools import wraps
from flask import request, jsonify, g
from utils.auth_utils import verify_jwt_token


def require_jwt(f):
    """
    Decorator that requires a valid JWT in the Authorization header.
    Extracts Bearer token, verifies it, and injects user_id into g.current_user_id.
    Returns 401 if token is missing, invalid, or expired.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid Authorization header'}), 401

        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401

        g.current_user_id = payload.get('user_id')
        g.current_portfolio_id = payload.get('portfolio_id')
        if not g.current_user_id:
            return jsonify({'error': 'Invalid token payload'}), 401

        return f(*args, **kwargs)
    return decorated_function
