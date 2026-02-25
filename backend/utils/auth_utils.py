"""
[AI] Utility Functions - Authentication
Functions for user authentication, password hashing, and JWT token management
"""

import bcrypt
import jwt
import os
from datetime import datetime, timedelta

# [AI] Password Hashing Utilities
def hash_password(password):
    """
    Hash a password using bcrypt
    Args:
        password (str): Plain text password
    Returns:
        str: Hashed password
    """
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(password, password_hash):
    """
    Verify a password against its hash
    Args:
        password (str): Plain text password
        password_hash (str): Hashed password from database
    Returns:
        bool: True if password matches, False otherwise
    """
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))


# [AI] JWT Token Utilities
def generate_jwt_token(user_id, portfolio_id=None, expires_in_hours=24):
    """
    Generate a JWT token for user authentication
    Args:
        user_id (int): User ID
        portfolio_id (int, optional): Portfolio ID
        expires_in_hours (int): Token expiration time in hours
    Returns:
        str: JWT token
    """
    payload = {
        'user_id': user_id,
        'portfolio_id': portfolio_id,
        'exp': datetime.utcnow() + timedelta(hours=expires_in_hours),
        'iat': datetime.utcnow()
    }
    
    secret_key = os.getenv('JWT_SECRET_KEY', 'dev-secret')
    token = jwt.encode(payload, secret_key, algorithm='HS256')
    return token


def verify_jwt_token(token):
    """
    Verify and decode a JWT token
    Args:
        token (str): JWT token to verify
    Returns:
        dict: Decoded token payload if valid, None otherwise
    """
    try:
        secret_key = os.getenv('JWT_SECRET_KEY', 'dev-secret')
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None  # Token has expired
    except jwt.InvalidTokenError:
        return None  # Invalid token
