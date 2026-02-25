# Copilot Instructions for Stock Portfolio Website

## Project Overview
This is a full-stack stock portfolio simulation website built with React (frontend), Flask (backend), and SQLite (database). The project allows users to create portfolios, simulate stock trading, track performance, and monitor watchlists.

## Key Guidelines

### 🏷️ Commit Tagging
All AI-generated changes must be tagged with `[AI]` in commit messages:
```
[AI] Feature description or change summary
```
User changes should follow standard naming conventions without tags.

### 📁 Project Structure (DO NOT RESTRUCTURE WITHOUT PERMISSION)
```
Stock-Website/
├── frontend/                 # React application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── styles/          # CSS files
│   │   ├── utils/           # Utility functions and API calls
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json         # npm dependencies
│   └── .env.example         # Environment template
├── backend/                  # Flask application
│   ├── routes/              # API route handlers
│   ├── models/              # Database models
│   ├── utils/               # Utility functions
│   ├── config/              # Configuration files
│   ├── app.py               # Main Flask app
│   ├── requirements.txt      # Python dependencies
│   └── .env.example         # Environment template
├── database/                # Database files and schemas
│   ├── schema.sql           # Database schema
│   └── migrations/          # Database migrations
├── .github/                 # GitHub configuration
│   └── copilot-instructions.md
├── .gitignore               # Git ignore rules
├── README.md                # Project documentation
└── SETUP.md                 # Setup instructions

```

### 🚫 DO NOT DO
- Install unnecessary dependencies without asking
- Create multiple SQL databases/tables without authorization
- Restructure folder/file organization without explicit permission
- Push to git without user authorization
- Ignore user requirements or make assumptions about design choices
- Create markdown summary documents unless explicitly requested
- Make Breaking changes to existing code structures

### ✅ MUST DO
1. **Comment Code**: Add descriptive comments for each function/component
2. **Tag Commits**: All commits must start with `[AI]`
3. **Describe Changes**: Include what each committed code block does
4. **Follow Patterns**: Use existing code patterns and conventions
5. **Validate Changes**: Check for errors before implementing
6. **Ask for Clarification**: If requirements are ambiguous, ask the user

### 📝 Code Standards

#### Backend (Python)
- Use docstrings for all functions and classes
- Add inline comments explaining complex logic
- Follow PEP 8 style guidelines
- Tag functions with `[AI]` in comments if AI-generated
- Include error handling

#### Frontend (React)
- Add JSDoc comments for components
- Use descriptive variable names
- Add comments explaining complex logic
- Tag components with `[AI]` in comments if AI-generated

#### Database
- Include schema documentation
- Add indexes for frequently queried columns
- Use meaningful table and column names
- Include foreign key constraints

### 🔐 Environment Setup
Each section (frontend/backend) has a `.env.example` file. Users must:
1. Copy `.env.example` to `.env`
2. Update configuration values
3. Never commit `.env` files (covered by .gitignore)

### 📚 Available Endpoints (Backend)
When building new endpoints:
- Authentication: `/api/auth/register`, `/api/auth/login`
- Portfolio: `/api/portfolios`, `/api/portfolios/{id}`
- Holdings: `/api/portfolios/{id}/holdings`
- Transactions: `/api/portfolios/{id}/buy`, `/api/portfolios/{id}/sell`
- Watchlist: `/api/portfolios/{id}/watchlist`
- News: `/api/news/business`, `/api/portfolios/{id}/watchlist-news`

### 🔍 Database Models Available
- User: Authentication and profile data
- Portfolio: User's portfolio/account information
- Holdings: Current stock holdings
- Transaction: Buy/sell transaction history
- Watchlist: Monitored stocks
- News: News articles and updates

### 🎯 Next Steps for User
1. Review project structure
2. Set up frontend with `npm install`
3. Set up backend with Python virtual environment
4. Create `.env` files for both sections
5. Initialize database
6. Start both development servers
7. Begin implementing features

### 📞 Communication Guidelines
When working on this project, I will:
- Only make changes when explicitly requested
- Ask for clarification on ambiguous requirements
- Provide clear status updates on progress
- Tag all changes with [AI] for tracking
- Never make unauthorized structure changes
- Always explain what code does before implementing
