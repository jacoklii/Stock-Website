"""
[AI] Stock Portfolio Backend - Main Application
Flask server for handling all backend logic, database operations, and API endpoints
"""

import os
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# [AI] Configuration - Set database URL and secret key from environment variables
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///portfolio.db')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db = SQLAlchemy(app)

# [AI] CORS Configuration - Allow requests from frontend
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://localhost:5000"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Import routes here (will be added later)
# from routes import auth_routes, portfolio_routes, watchlist_routes, news_routes

# [AI] Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint to verify backend is running
    Returns: JSON with status message
    """
    return {'status': 'Backend is running'}, 200

if __name__ == '__main__':
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Run Flask development server
    port = int(os.getenv('API_PORT', 5000))
    app.run(debug=True, port=port, host='0.0.0.0')
