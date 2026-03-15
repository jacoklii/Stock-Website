# 🎨 Frontend Prompt — Stock Portfolio Simulator

## Stack & Tooling

- **Framework**: React (functional components, hooks)
- **Styling**: Plain CSS / CSS Modules (`/src/styles/`)
- **Routing**: React Router v6
- **State**: React Context API (Auth, Portfolio, Theme)
- **API Layer**: `fetch` or `axios` via `/src/utils/`
- **Charts**: Recharts or Chart.js
- **Icons**: Lucide React

---

## Project Structure (DO NOT RESTRUCTURE WITHOUT PERMISSION)

```
frontend/src/
├── components/          # Reusable UI components
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── StockSearchInput.jsx
│   ├── NewsCard.jsx
│   ├── ChangeBadge.jsx
│   ├── ConfirmModal.jsx
│   ├── SkeletonCard.jsx
│   └── ErrorBanner.jsx
├── pages/               # One file per route
│   ├── LoginPage.jsx
│   ├── SignupPage.jsx
│   ├── HomePage.jsx
│   ├── NewsPage.jsx
│   ├── PortfolioPage.jsx
│   ├── WatchlistPage.jsx
│   └── SettingsPage.jsx
├── styles/              # One CSS file per page or component
├── utils/               # API call helpers
│   ├── auth.js
│   ├── portfolio.js
│   ├── stocks.js
│   ├── news.js
│   ├── watchlist.js
│   └── settings.js
├── context/
│   ├── AuthContext.js
│   ├── PortfolioContext.js
│   ├── ThemeContext.js
│   └── WatchlistContext.js
├── App.js
└── index.js
```

---

## Aesthetic Direction

Design language: **refined financial terminal** — dense, data-forward, professional. Dark-first with light mode toggle.

- **Colors**: Deep navy/charcoal base (`#0D1117`, `#161B22`), electric green accent (`#00FF88`) for gains, red (`#FF1744`) for losses, muted grays for secondary text
- **Typography**: `IBM Plex Mono` or `Roboto Condensed` for numbers and tickers; `DM Sans` or `Sora` for body text — imported via Google Fonts
- **Motion**: Number counter animations on values, fade-in on page load, smooth tab transitions — CSS-only where possible
- **Layout**: Card-based, information-dense grids, clear data hierarchy
- **Charts**: Minimal, high-contrast sparklines and line charts
- All colors, fonts, and spacing defined as CSS variables in a global `:root` block

---

## Pages & Routes

| Route | Component | Description |
|---|---|---|
| `/login` | `LoginPage` | Login form |
| `/signup` | `SignupPage` | 2-step registration + portfolio setup |
| `/` | `HomePage` | Portfolio dashboard overview |
| `/news` | `NewsPage` | Market + portfolio + watchlist news |
| `/portfolio` | `PortfolioPage` | Holdings, buy/sell, metrics |
| `/watchlist` | `WatchlistPage` | Watchlist management |
| `/settings` | `SettingsPage` | Account, appearance, logs |

Routes `/`, `/news`, `/portfolio`, `/watchlist`, `/settings` are protected — redirect to `/login` if unauthenticated.

---

## Auth Pages

### `LoginPage.jsx`
- Username + password fields
- "Remember me" toggle
- Link to `/signup`
- `ErrorBanner` on invalid credentials
- On success → redirect to `/`

### `SignupPage.jsx` — 2-Step Flow

**Step 1 — Account Setup**
- Username, password, confirm password
- Region dropdown (e.g. US, CA, GB — mapped to default currency)
- "Next" — validate fields before advancing

**Step 2 — Portfolio Setup**
- Portfolio name (pre-filled with username, editable)
- Starting cash input with preset buttons: `$1,000` / `$10,000` / `$100,000`
- Currency selector (auto-selected from region, overridable)
- "Create Portfolio" submit

Step progress indicator between steps. Full validation on each step before advancing.

---

## Page Specs

### 🏠 `HomePage.jsx`

At-a-glance portfolio dashboard.

**Sections (top to bottom)**:

1. **Portfolio Summary Bar** — Total value, cash balance, daily P&L ($ + %), all-time P&L ($ + %)
   - Component: `SummaryBar`

2. **Big Market Movers** — Top 3 gainers + top 3 losers from `/api/stocks/movers`
   - Compact cards: ticker symbol, company name, price, % change badge
   - Component: `MoverCard`

3. **Holdings Snapshot** — Horizontal scroll or grid of current holdings
   - Each card: ticker, current price, shares held, market value, daily % change
   - Live prices — auto-refresh every 30 seconds while page is active
   - Component: `HoldingTicker`

4. **Portfolio News Feed** — Top 5 headlines for holdings from `/api/news/portfolio`
   - Component: `NewsCard`

5. **Market Indices Bar** — S&P 500, NASDAQ, DOW with price and daily % change
   - Component: `IndexBadge`

---

### 📰 `NewsPage.jsx`

Three-tab news hub:

| Tab | Endpoint | Description |
|---|---|---|
| Market News | `GET /api/news/business` | General market headlines for discovery |
| Portfolio News | `GET /api/news/portfolio` | Headlines filtered to current holdings |
| Watchlist News | `GET /api/portfolios/{id}/watchlist-news` | Headlines filtered to watchlist tickers |

**`NewsCard` layout**:
- Headline (2-line truncation with ellipsis)
- Source name + favicon
- Relative timestamp ("2h ago")
- Ticker tag(s) if applicable
- 1–2 sentence summary
- External "Read more" link

Layout: 2-column card grid on desktop, 1-column on mobile. Paginated (20 items) or infinite scroll.

---

### 💼 `PortfolioPage.jsx`

Core trading and holdings view.

**Trade Panel (top)**
- Ticker search with autocomplete → `GET /api/stocks/search?q=`
- Tab toggle: **Buy** | **Sell**
- Input mode toggle: **Shares** | **Dollar Amount**
- Quantity input
- Live price display (updates on ticker select)
- Calculated total (estimated cost or estimated shares)
- "Execute Trade" button → opens `ConfirmModal` before submitting
- Cash balance displayed prominently beside the panel

**Holdings Table**

| Column | Notes |
|---|---|
| Ticker | Symbol + company name |
| Shares | Quantity held |
| Avg Cost | Weighted average purchase price |
| Current Price | Live, refreshes every 30s |
| Market Value | Shares × current price |
| Day Change | $ and % |
| Total Return | $ and % since first purchase |
| Actions | Quick sell button |

- Sortable by column header click
- Row expand on click → mini `NewsCard` feed for that ticker

**Portfolio Metrics Panel** (sidebar or below table)
- Total invested vs. total value
- Best and worst performer
- Pie chart — allocation by holding
- Line chart — 30-day portfolio value history

---

### 👁️ `WatchlistPage.jsx`

**Top Bar**
- Ticker search + "Add to Watchlist" → `POST /api/portfolios/{id}/watchlist`
- "Edit" toggle to reveal removal checkboxes

**Watchlist Table**

| Column | Notes |
|---|---|
| Ticker | Symbol + company name |
| Current Price | Live |
| Open Price | Market open price |
| Change from Open | $ and % |
| 52-Week High / Low | Visual range bar |
| Added On | Date added |
| Actions | Remove / Add to Portfolio |

**Watchlist News Feed** — below the table, same `NewsCard` component, from `GET /api/portfolios/{id}/watchlist-news`

---

### ⚙️ `SettingsPage.jsx`

Left sidebar section nav:

**1. Account**
- Display username, region, currency
- Change password form
- Logout button → calls `POST /api/auth/logout`, clears session/token, redirects to `/login`

**2. Portfolio**
- Editable portfolio name → `PATCH /api/portfolios/{id}`
- "Reset Portfolio" — clears all holdings and transactions, restores starting cash. Requires typed confirmation via `ConfirmModal`

**3. Transactions**
- Full log from `GET /api/portfolios/{id}/transactions`
- Columns: Date, Ticker, Action (BUY/SELL), Shares, Price per Share, Total
- Filter by date range and ticker symbol
- "Export CSV" button

**4. Preferences**
- Default trade input mode (Shares / Dollar)
- Default news tab on load
- News items shown per page

**5. Appearance**
- Dark / Light mode toggle (updates `ThemeContext`, persists to `localStorage`)
- Accent color: 4 preset swatches
- Font size: Normal / Large

**6. Logs**
- Read-only event log (login times, trades, errors)
- Timestamped entries, scrollable, newest first

---

## Global Layout Components

### `Navbar.jsx`
- Nav links: Home, News, Portfolio, Watchlist, Settings
- Active route visually highlighted
- Portfolio name + available cash displayed inline
- User initials avatar (top right)
- Collapses to hamburger menu below 768px

### `Footer.jsx`
- Links: Home | About | Logout | Privacy | Contact
- Disclaimer: *"Simulated trading only — not real financial advice."*
- App version

---

## Context

```
AuthContext         → { user, token, login(), logout() }
PortfolioContext    → { holdings, cash, metrics, buyStock(), sellStock() }
ThemeContext        → { theme, accentColor, fontSize, toggleTheme() }
WatchlistContext    → { watchlist, addTicker(), removeTicker() }
```

---

## API Utils (`/src/utils/`)

Each file exports async functions wrapping `fetch`. Always return `{ data, error }` and handle non-2xx responses.

```
auth.js          → login(username, password), signup(payload), logout()
portfolio.js     → getSummary(), getHoldings(), buyStock(payload), sellStock(payload), getMetrics(), getTransactions(filters), resetPortfolio()
stocks.js        → searchTicker(query), getPrice(ticker), getMovers(), getIndices(), getHistory(ticker, period)
news.js          → getMarketNews(), getPortfolioNews(), getWatchlistNews()
watchlist.js     → getWatchlist(), addTicker(ticker), removeTicker(ticker)
settings.js      → exportCSV(), getPreferences(), updatePreferences(payload), getLogs(), changePassword(payload), updatePortfolioName(name)
```

---

## Code Standards

- **JSDoc comments** on every component and utility function
- Tag AI-generated files with `// [AI]` at the top of the file
- Descriptive variable names — no ambiguous single-letter names outside loops
- `SkeletonCard` on all async-loading sections
- `ConfirmModal` required before any destructive action (execute trade, reset portfolio, remove from watchlist)
- Live price polling via `setInterval` every 30 seconds — always cleared on component unmount
- Currency formatting uses user's selected currency from `PortfolioContext`
- Gains always `#00C853` green, losses always `#FF1744` red — never reversed
- Mobile-responsive — single column layout and hamburger nav below 768px
- Never commit `.env` files — use `.env.example` as template