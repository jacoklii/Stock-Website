# [AI] Step-by-step instructions for setting up and running the project

## Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- Git

## Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration (especially REACT_APP_API_URL)

5. Start development server:
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3000`

## Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

5. Update `.env` with your configuration

6. Initialize database (first time):
   ```bash
   python app.py
   ```

   The database will be created automatically on first run.

7. Run Flask development server:
   ```bash
   python app.py
   ```

The backend will run on `http://localhost:5000`

## Running Both Servers

Open two terminal windows:
- Terminal 1: `cd frontend && npm start`
- Terminal 2: `cd backend && source venv/bin/activate && python app.py`

## Git Workflow

All changes made by AI will be tagged with `[AI]` in commit messages:
```bash
git commit -m "[AI] Add feature description"
```

User changes should follow standard naming conventions.

## Project Structure

- **frontend/**: React application with components, pages, and styles
- **backend/**: Flask server with routes, models, and utilities
- **database/**: Database schema and migration files
- **.github/**: GitHub-specific configuration

## Endpoints (Backend)

- `GET /api/health` - Health check
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/portfolios` - Get user portfolios
- `POST /api/portfolios` - Create new portfolio
- `POST /api/portfolios/{id}/buy` - Buy stock
- `POST /api/portfolios/{id}/sell` - Sell stock
- `GET /api/portfolios/{id}/holdings` - Get holdings
- `GET /api/portfolios/{id}/watchlist` - Get watchlist
- `GET /api/news/business` - Get business news

## Troubleshooting

**Port already in use**:
- Frontend (3000): `lsof -ti:3000 | xargs kill -9`
- Backend (5000): `lsof -ti:5000 | xargs kill -9`

**Database issues**:
- Delete `portfolio.db` and restart Flask server

**Module not found**:
- Make sure you're in the correct virtual environment
- Run `pip install -r requirements.txt` again
