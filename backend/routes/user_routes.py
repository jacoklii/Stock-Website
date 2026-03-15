"""
[AI] User Routes - Password change, preferences
"""

from flask import Blueprint, request, jsonify, g
from extensions import db
from models.user_models import User
from utils.decorators import require_jwt
from utils.auth_utils import hash_password, verify_password

user_bp = Blueprint('user', __name__)


@user_bp.route('/password', methods=['PATCH'])
@require_jwt
def change_password():
    """Change password. Body: current_password, new_password"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    current = data.get('current_password')
    new_pw = data.get('new_password')

    if not current or not new_pw:
        return jsonify({'error': 'current_password and new_password are required'}), 400

    user = User.query.get(g.current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if not verify_password(current, user.password_hash):
        return jsonify({'error': 'Current password is incorrect'}), 401

    user.password_hash = hash_password(new_pw)
    db.session.commit()

    return jsonify({'message': 'Password updated successfully'}), 200


@user_bp.route('/preferences', methods=['GET'])
@require_jwt
def get_preferences():
    """Get user preferences (defaults for MVP)."""
    return jsonify({
        'defaultTradeMode': 'shares',
        'defaultNewsTab': 'market',
        'newsPerPage': 20,
    }), 200


@user_bp.route('/preferences', methods=['PATCH'])
@require_jwt
def update_preferences():
    """Update user preferences (stored in future; returns success)."""
    data = request.get_json() or {}
    return jsonify({
        'defaultTradeMode': data.get('defaultTradeMode', 'shares'),
        'defaultNewsTab': data.get('defaultNewsTab', 'market'),
        'newsPerPage': data.get('newsPerPage', 20),
    }), 200
