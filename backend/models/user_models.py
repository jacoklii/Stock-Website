"""
[AI] Database Models - SQLAlchemy ORM Models
Defines the structure of all database tables using SQLAlchemy ORM
"""

from extensions import db
from datetime import datetime
from sqlalchemy.dialects.sqlite import JSON

# [AI] User Model - Stores user account information
class User(db.Model):
    """
    Represents a user account
    - Attributes: user_id, username, email, password_hash, created_at, updated_at
    - Relationships: portfolios (one user can have multiple portfolios)
    """
    __tablename__ = 'users'
    
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    portfolios = db.relationship('Portfolio', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.username}>'


# [AI] Portfolio Model - Stores portfolio information for each user
class Portfolio(db.Model):
    """
    Represents a portfolio/account for a user
    - Attributes: portfolio_id, user_id, portfolio_name, starting_cash, current_balance, total_invested
    - Relationships: holdings, transactions, watchlist
    """
    __tablename__ = 'portfolios'
    
    portfolio_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    portfolio_name = db.Column(db.String(100), nullable=False)
    starting_cash = db.Column(db.Numeric(15, 2), nullable=False)
    current_balance = db.Column(db.Numeric(15, 2), nullable=False)
    total_invested = db.Column(db.Numeric(15, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    holdings = db.relationship('Holdings', backref='portfolio', lazy=True, cascade='all, delete-orphan')
    transactions = db.relationship('Transaction', backref='portfolio', lazy=True, cascade='all, delete-orphan')
    watchlist = db.relationship('Watchlist', backref='portfolio', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Portfolio {self.portfolio_name}>'


# [AI] Holdings Model - Stores current stock holdings
class Holdings(db.Model):
    """
    Represents current holdings of a stock in a portfolio
    - Attributes: holding_id, portfolio_id, stock_symbol, quantity, average_cost, current_price, total_value
    - Used for tracking active positions
    """
    __tablename__ = 'holdings'
    
    holding_id = db.Column(db.Integer, primary_key=True)
    portfolio_id = db.Column(db.Integer, db.ForeignKey('portfolios.portfolio_id'), nullable=False)
    stock_symbol = db.Column(db.String(10), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    average_cost = db.Column(db.Numeric(10, 2), nullable=False)
    current_price = db.Column(db.Numeric(10, 2), nullable=False)
    total_value = db.Column(db.Numeric(15, 2))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('portfolio_id', 'stock_symbol', name='unique_portfolio_stock'),)
    
    def __repr__(self):
        return f'<Holdings {self.stock_symbol} x{self.quantity}>'


# [AI] Transaction Model - Stores all buy/sell transactions
class Transaction(db.Model):
    """
    Represents a single buy or sell transaction
    - Attributes: transaction_id, portfolio_id, stock_symbol, transaction_type, quantity, price, total_amount, transaction_date
    - Used for tracking all historical trades and purchase history
    """
    __tablename__ = 'transactions'
    
    transaction_id = db.Column(db.Integer, primary_key=True)
    portfolio_id = db.Column(db.Integer, db.ForeignKey('portfolios.portfolio_id'), nullable=False)
    stock_symbol = db.Column(db.String(10), nullable=False)
    transaction_type = db.Column(db.String(10), nullable=False)  # BUY or SELL
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    total_amount = db.Column(db.Numeric(15, 2), nullable=False)
    transaction_date = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)
    
    def __repr__(self):
        return f'<Transaction {self.transaction_type} {self.stock_symbol}>'


# [AI] Watchlist Model - Stores stocks in user's watchlist
class Watchlist(db.Model):
    """
    Represents a stock in a user's watchlist
    - Attributes: watchlist_id, portfolio_id, stock_symbol, added_date, notes
    - Used for tracking potential stocks to buy
    """
    __tablename__ = 'watchlist'
    
    watchlist_id = db.Column(db.Integer, primary_key=True)
    portfolio_id = db.Column(db.Integer, db.ForeignKey('portfolios.portfolio_id'), nullable=False)
    stock_symbol = db.Column(db.String(10), nullable=False)
    added_date = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)
    
    __table_args__ = (db.UniqueConstraint('portfolio_id', 'stock_symbol', name='unique_portfolio_watchlist'),)
    
    def __repr__(self):
        return f'<Watchlist {self.stock_symbol}>'


# [AI] News Model - Stores news articles and updates
class News(db.Model):
    """
    Represents a news article or update
    - Attributes: news_id, stock_symbol, title, description, news_type, source, url, published_date
    - Used for storing and displaying relevant news content
    """
    __tablename__ = 'news'
    
    news_id = db.Column(db.Integer, primary_key=True)
    stock_symbol = db.Column(db.String(10))
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    news_type = db.Column(db.String(50), nullable=False)  # EARNINGS, BUSINESS, PORTFOLIO, WATCHLIST, GENERAL
    source = db.Column(db.String(100))
    url = db.Column(db.Text)
    published_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<News {self.title}>'
