# Stock Portfolio Website

A full-stack web application for simulating stock trades and tracking portfolio performance.

## 🎯 Features

- **User Authentication**: Login/Sign up with email for alerts
- **Portfolio Management**: Buy/sell stocks, track holdings and performance
- **Watchlist**: Monitor potential stock purchases
- **News & Alerts**: Recent stock news, earnings reports, and portfolio updates
- **Performance Metrics**: Track portfolio performance and investment metrics
- **Settings**: Account management, appearance, transaction logs

## 📁 Project Structure

```
Stock-Website/
├── frontend/              # React frontend application
│   ├── public/           # Static assets
│   ├── src/
│   │   ├── components/   # Reusable React components
│   │   ├── pages/        # Page components
│   │   ├── styles/       # CSS stylesheets
│   │   ├── utils/        # Utility functions and API calls
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env.example
├── backend/               # Python Flask backend
│   ├── routes/           # Flask route handlers
│   ├── models/           # Database models
│   ├── utils/            # Utility functions
│   ├── config/           # Configuration files
│   ├── app.py            # Main Flask application
│   ├── requirements.txt   # Python dependencies
│   └── .env.example
├── database/             # Database related files
│   ├── schema.sql        # Database schema
│   └── migrations/       # Database migrations
├── .gitignore
├── README.md
└── .github/
    └── copilot-instructions.md
```

## 🚀 Quick Start

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## 💾 Database

SQLite database for development. Tables include:
- Users
- Portfolios
- Transactions
- Watchlist
- Holdings

## 🔑 Environment Variables

Create `.env` files in both frontend and backend directories. See `.env.example` files for templates.

## 📝 Commit Convention

All commits tagged with `[AI]` indicate changes made by AI assistant. User commits should follow standard conventions.

## 📚 Documentation

- Frontend components are documented with inline comments
- Backend functions include docstrings
- Database schema documented in `database/schema.sql`

## 🤝 Contributing

Push changes to git with descriptive messages. Tag AI-generated commits with `[AI]`.

---

**Project Start Date**: February 24, 2026
