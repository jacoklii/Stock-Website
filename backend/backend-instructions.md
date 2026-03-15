# ⚙️ Backend Prompt — Stock Portfolio Simulator

## Stack

- **Language**: Python 3.10+
- **Framework**: Flask
- **Database**: SQLite via SQLAlchemy ORM
- **Stock Data**: yfinance
- **News Scraping**: BeautifulSoup4, feedparser, requests
- **Auth**: Flask-Login + Werkzeug password hashing (or PyJWT for token-based)
- **Serialization**: `jsonify` + `.to_dict()` methods on models
- **CORS**: Flask-CORS

---

## Project Structure (DO NOT RESTRUCTURE WITHOUT PERMISSION)

```
backend/
├── app.py                   # Flask app factory, blueprint registration
├── requirements.txt         # All Python dependencies
├── .env.example             # Environment variable template
├── config/
│   └── config.py            # Config classes (Dev/Prod), loads .env
├── models/
│   ├── user.py              # User model
│   ├── portfolio.py         # Portfolio model
│   ├── holding.py           # Holding model
│   ├── transaction.py       # Transaction model
│   ├── watchlist.py         # WatchlistItem model
│   └── news_cache.py        # NewsCache model
├── routes/
│   ├── auth.py              # /api/auth/*
│   ├── portfolio.py         # /api/portfolios/*
│   ├── stocks.py            # /api/stocks/*
│   ├── news.py              # /api/news/*
│   └── watchlist.py         # /api/portfolios/{id}/watchlist
└── utils/
    ├── stock_service.py     # yfinance wrapper + caching
    ├── trade_service.py     # Buy/sell logic
    ├── news_service.py      # Scraper, RSS feeds, news aggregation
    ├── recommender.py       # Stock recommendation logic
    ├── cache_service.py     # In-memory JSON cache
    ├── validators.py        # Input validation helpers
    ├── formatters.py        # Currency and percentage formatting
    └── region_map.py        # Region → default currency mapping
```

---

## Database Models

### `User` — `/models/user.py`
```python
id              Integer     PK, autoincrement
username        String(80)  unique, not null
password_hash   String(256) not null
region          String(10)  not null    # e.g. "US", "CA", "GB"
created_at      DateTime    default utcnow
```

### `Portfolio` — `/models/portfolio.py`
```python
id              Integer     PK, autoincrement
user_id         ForeignKey(User.id) not null
name            String(100) not null    # defaults to username
password_hash   String(256) nullable    # optional secondary PIN
cash            Float       not null    # remaining simulated cash
currency        String(10)  not null    # e.g. "USD", "CAD", "GBP"
starting_cash   Float       not null    # original amount for ROI reference
created_at      DateTime    default utcnow
```

### `Holding` — `/models/holding.py`
```python
id              Integer     PK, autoincrement
portfolio_id    ForeignKey(Portfolio.id) not null
ticker          String(10)  not null
shares          Float       not null
avg_cost        Float       not null    # weighted average cost basis
first_bought    DateTime    default utcnow
```
Index on `(portfolio_id, ticker)`.

### `Transaction` — `/models/transaction.py`
```python
id              Integer     PK, autoincrement
portfolio_id    ForeignKey(Portfolio.id) not null
ticker          String(10)  not null
action          String(4)   not null    # "BUY" or "SELL"
shares          Float       not null
price_per_share Float       not null
total           Float       not null    # shares × price_per_share
timestamp       DateTime    default utcnow
```
Index on `portfolio_id` and `timestamp`.

### `WatchlistItem` — `/models/watchlist.py`
```python
id              Integer     PK, autoincrement
portfolio_id    ForeignKey(Portfolio.id) not null
ticker          String(10)  not null
added_at        DateTime    default utcnow
```
Unique constraint on `(portfolio_id, ticker)`.

### `NewsCache` — `/models/news_cache.py`
```python
id              Integer     PK, autoincrement
ticker          String(10)  nullable    # null = general market news
headline        String(500) not null
summary         Text        nullable
source          String(100) nullable
url             String(500) unique
published_at    DateTime    nullable
fetched_at      DateTime    default utcnow
```
Index on `ticker` and `fetched_at`.

---

## API Routes

### Auth — `/api/auth`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create user account + portfolio |
| POST | `/api/auth/login` | Authenticate, return session or JWT token |
| POST | `/api/auth/logout` | Invalidate session or token |
| GET | `/api/auth/me` | Return current authenticated user info |

**`/register` request body**:
```json
{
  "username": "string",
  "password": "string",
  "region": "US",
  "portfolio_name": "string",
  "starting_cash": 10000.00,
  "currency": "USD"
}
```
- `portfolio_name` defaults to `username` if omitted
- `currency` defaults to region's mapped currency if omitted

---

### Portfolio — `/api/portfolios`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/portfolios` | Get portfolio summary (cash, total value, P&L) |
| GET | `/api/portfolios/{id}/holdings` | All holdings with live metrics |
| GET | `/api/portfolios/{id}/transactions` | Full transaction history (supports `?ticker=&from=&to=` filters) |
| POST | `/api/portfolios/{id}/buy` | Execute a buy order |
| POST | `/api/portfolios/{id}/sell` | Execute a sell order |
| PATCH | `/api/portfolios/{id}` | Update portfolio name |
| POST | `/api/portfolios/{id}/reset` | Reset portfolio to starting state |

**`/buy` and `/sell` request body**:
```json
{
  "ticker": "AAPL",
  "shares": 5,
  "dollar_amount": null
}
```
- If `dollar_amount` is provided instead of `shares`: `shares = dollar_amount / current_price`
- Buy validation: sufficient cash, valid ticker
- Sell validation: sufficient shares held

---

### Stocks — `/api/stocks`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/stocks/price/<ticker>` | Current price, daily change, 52-week high/low |
| GET | `/api/stocks/search?q=<query>` | Ticker autocomplete (symbol or company name) |
| GET | `/api/stocks/movers` | Top 5 market gainers + top 5 losers |
| GET | `/api/stocks/indices` | S&P 500, NASDAQ, DOW current data |
| GET | `/api/stocks/history/<ticker>` | OHLCV data; accepts `?period=1mo` (default), 1d, 5d, 3mo, 6mo, 1y |

---

### News — `/api/news`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/news/business` | General market news (scraped, cached) |
| GET | `/api/news/portfolio` | News for all tickers in current user's portfolio |
| GET | `/api/portfolios/{id}/watchlist-news` | News for all tickers on watchlist |
| GET | `/api/news/<ticker>` | News for a specific ticker |

---

### Watchlist — `/api/portfolios/{id}/watchlist`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/portfolios/{id}/watchlist` | All watchlist items with live prices |
| POST | `/api/portfolios/{id}/watchlist` | Add a ticker `{ "ticker": "TSLA" }` |
| DELETE | `/api/portfolios/{id}/watchlist/<ticker>` | Remove a ticker |

---

## Service Layer

### `utils/stock_service.py`

```python
# [AI]

def get_price(ticker: str) -> dict:
    """
    Fetch current price, daily $ change, daily % change, volume,
    52-week high/low, and market cap for a ticker using yfinance.
    Raises TickerNotFoundError if ticker is invalid.
    Cache result in memory for 30 seconds to reduce yfinance calls.
    """

def get_movers(n: int = 5) -> dict:
    """
    Fetch top N gainers and bottom N losers.
    Batch-fetch daily % change from a predefined list of ~500 common tickers.
    Return { gainers: [...], losers: [...] }.
    Cache for 5 minutes.
    """

def search_tickers(query: str) -> list:
    """
    Search by symbol or company name.
    Use a local tickers JSON file or yfinance search.
    Return list of { ticker, name, exchange }.
    """

def get_indices() -> dict:
    """
    Fetch current price and daily % change for ^GSPC, ^IXIC, ^DJI.
    Return { sp500: {...}, nasdaq: {...}, dow: {...} }.
    Cache for 1 minute.
    """

def get_history(ticker: str, period: str = "1mo") -> list:
    """
    Return OHLCV data as list of { date, open, high, low, close, volume }.
    Valid periods: 1d, 5d, 1mo, 3mo, 6mo, 1y.
    """
```

---

### `utils/trade_service.py`

```python
# [AI]

def execute_buy(portfolio_id: int, ticker: str, shares: float = None, dollar_amount: float = None) -> dict:
    """
    1. Fetch current price via stock_service.get_price()
    2. If dollar_amount provided: shares = dollar_amount / price
    3. Validate: portfolio has sufficient cash (raise InsufficientFundsError if not)
    4. Update Holding: create new or increment shares and recalculate avg_cost
    5. Deduct total from Portfolio.cash
    6. Insert Transaction record
    7. Return serialized transaction summary
    """

def execute_sell(portfolio_id: int, ticker: str, shares: float = None, dollar_amount: float = None) -> dict:
    """
    1. Fetch current price
    2. If dollar_amount provided: shares = dollar_amount / price
    3. Validate: portfolio holds enough shares (raise InsufficientSharesError if not)
    4. Decrement or delete Holding
    5. Add proceeds to Portfolio.cash
    6. Insert Transaction record
    7. Return serialized transaction summary
    """

def calculate_avg_cost(existing_shares: float, existing_avg: float, new_shares: float, new_price: float) -> float:
    """
    Weighted average cost basis:
    ((existing_shares * existing_avg) + (new_shares * new_price)) / (existing_shares + new_shares)
    """
```

---

### `utils/news_service.py`

```python
# [AI]

NEWS_SOURCES = [
    {"name": "Yahoo Finance", "url": "https://feeds.finance.yahoo.com/rss/2.0/headline"},
    {"name": "Reuters Business", "url": "https://feeds.reuters.com/reuters/businessNews"},
    # Add additional RSS sources as available
]

def fetch_market_news(limit: int = 20) -> list:
    """
    Pull from RSS feeds using feedparser.
    Parse each entry: headline, summary, source, url, published_at.
    Cache results in NewsCache table (ticker=None) for 15 minutes.
    Return sorted by published_at descending.
    """

def fetch_news_for_tickers(tickers: list, limit_per_ticker: int = 5) -> list:
    """
    For each ticker call yfinance Ticker(ticker).news.
    Deduplicate by URL across all tickers.
    Tag each article with the matching ticker symbol.
    Cache per ticker in NewsCache for 10 minutes.
    Return sorted by published_at descending.
    """

def get_portfolio_news(portfolio_id: int) -> list:
    """
    Query Holdings for all tickers in portfolio_id.
    Call fetch_news_for_tickers(tickers).
    """

def get_watchlist_news(portfolio_id: int) -> list:
    """
    Query WatchlistItem for all tickers in portfolio_id.
    Call fetch_news_for_tickers(tickers).
    """

def is_cache_stale(fetched_at: datetime, max_age_minutes: int) -> bool:
    """Return True if fetched_at is older than max_age_minutes."""
```

---

### `utils/recommender.py`

```python
# [AI]

def get_recommendations(portfolio_id: int, n: int = 5) -> list:
    """
    Simple signal-based recommendation:
    1. Pull recent market news headlines from NewsCache
    2. Extract ticker mentions from headlines using regex against known ticker list
    3. Filter out tickers already held in portfolio or on watchlist
    4. Score remaining tickers by:
       - Mention frequency in recent headlines (higher = more signal)
       - Presence of positive sentiment keywords (e.g. "upgrade", "beat", "growth", "buy")
       - Subtract score for negative keywords (e.g. "downgrade", "miss", "loss", "sell")
    5. Fetch current price data for top-scored tickers
    6. Return top N as list of { ticker, name, price, score, reason_snippet }
    """
```

---

### `utils/cache_service.py`

```python
# [AI]
# In-memory JSON cache for fast repeated lookups (stock prices, news).
# Falls back to fetching live data when cache is missing or stale.

_cache = {}  # { key: { "data": ..., "expires_at": datetime } }

def get(key: str):
    """Return cached value if not expired, else None."""

def set(key: str, value, ttl_seconds: int):
    """Store value with expiry timestamp."""

def invalidate(key: str):
    """Remove a specific cache entry."""

def clear_expired():
    """Purge all stale entries — call periodically."""
```

---

## Config — `config/config.py`

```python
class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///../../database/portfolio.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = ["http://localhost:3000"]

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
```

`.env.example`:
```
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///../../database/portfolio.db
FLASK_ENV=development
```

---

## Error Handling

Define custom exceptions in `utils/validators.py`:

```python
class TickerNotFoundError(Exception): pass
class InsufficientFundsError(Exception): pass
class InsufficientSharesError(Exception): pass
class InvalidInputError(Exception): pass
```

Register error handlers in `app.py`:
```python
@app.errorhandler(TickerNotFoundError)
def handle_ticker_not_found(e):
    return jsonify({"error": "Ticker not found", "message": str(e)}), 404

@app.errorhandler(InsufficientFundsError)
def handle_insufficient_funds(e):
    return jsonify({"error": "Insufficient funds", "message": str(e)}), 400
```

All route handlers must catch exceptions and return structured JSON error responses. Never return raw Python tracebacks to the client.

---

## Code Standards

- **Docstrings** on every function and class (Google or NumPy style)
- Tag AI-generated files with `# [AI]` at the top of the file
- Follow PEP 8 style guidelines throughout
- All database interactions go through SQLAlchemy ORM — no raw SQL strings
- All responses serialized via `.to_dict()` model methods + `jsonify()`
- Never expose `password_hash` in any API response
- Input validation in `utils/validators.py` before any DB write
- Cache stock prices for 30 seconds, news for 10–15 minutes to reduce external API load
- Never commit `.env` — use `.env.example` as the template
- Schema changes go in `database/migrations/` with descriptive filenames