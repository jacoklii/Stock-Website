"""
[AI] Flask extensions - Database and other shared instances
Defined here to avoid circular imports between app, models, and routes.
"""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
