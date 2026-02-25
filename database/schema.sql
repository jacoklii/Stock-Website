-- [AI] Stock Portfolio Database Schema
-- SQLite schema for the Stock Portfolio Website
-- Tables: Users, Portfolios, Transactions, Holdings, Watchlist, News

-- Users table: Stores user authentication and profile information
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Portfolios table: Stores portfolio information for each user
CREATE TABLE IF NOT EXISTS portfolios (
    portfolio_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    portfolio_name VARCHAR(100) NOT NULL,
    starting_cash DECIMAL(15, 2) NOT NULL,
    current_balance DECIMAL(15, 2) NOT NULL,
    total_invested DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Holdings table: Stores current stock holdings in portfolios
CREATE TABLE IF NOT EXISTS holdings (
    holding_id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER NOT NULL,
    stock_symbol VARCHAR(10) NOT NULL,
    quantity INTEGER NOT NULL,
    average_cost DECIMAL(10, 2) NOT NULL,
    current_price DECIMAL(10, 2) NOT NULL,
    total_value DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id) ON DELETE CASCADE,
    UNIQUE(portfolio_id, stock_symbol)
);

-- Transactions table: Stores all buy/sell transactions
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER NOT NULL,
    stock_symbol VARCHAR(10) NOT NULL,
    transaction_type VARCHAR(10) NOT NULL CHECK(transaction_type IN ('BUY', 'SELL')),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id) ON DELETE CASCADE
);

-- Watchlist table: Stores stocks users are watching
CREATE TABLE IF NOT EXISTS watchlist (
    watchlist_id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER NOT NULL,
    stock_symbol VARCHAR(10) NOT NULL,
    added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id) ON DELETE CASCADE,
    UNIQUE(portfolio_id, stock_symbol)
);

-- News table: Stores news articles and updates related to stocks
CREATE TABLE IF NOT EXISTS news (
    news_id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_symbol VARCHAR(10),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    news_type VARCHAR(50) NOT NULL CHECK(news_type IN ('EARNINGS', 'BUSINESS', 'PORTFOLIO', 'WATCHLIST', 'GENERAL')),
    source VARCHAR(100),
    url TEXT,
    published_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id ON holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON holdings(stock_symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_id ON transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_symbol ON transactions(stock_symbol);
CREATE INDEX IF NOT EXISTS idx_watchlist_portfolio_id ON watchlist(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_news_symbol ON news(stock_symbol);
