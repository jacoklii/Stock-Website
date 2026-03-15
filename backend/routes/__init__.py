"""
[AI] Routes package - Flask blueprints for API endpoints
"""

from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.portfolio_routes import portfolio_bp
from routes.watchlist_routes import watchlist_bp
from routes.news_routes import news_bp
from routes.stock_routes import stock_bp


def register_blueprints(app):
    """
    Register all API blueprints with the Flask app
    """
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(portfolio_bp, url_prefix='/api/portfolios')
    app.register_blueprint(watchlist_bp, url_prefix='/api/portfolios')
    app.register_blueprint(news_bp, url_prefix='/api')
    app.register_blueprint(stock_bp, url_prefix='/api/stocks')
