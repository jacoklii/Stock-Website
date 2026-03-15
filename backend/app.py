"""
[AI] Stock Portfolio Backend - Main Application
Flask server for handling all backend logic, database operations, and API endpoints
"""

import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from config.settings import get_config
from extensions import db

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# [AI] Configuration - Use config from settings
app.config.from_object(get_config())

# Override CORS config for API
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://localhost:5000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Initialize database with app
db.init_app(app)

# [AI] Import models to register with SQLAlchemy (must be before db.create_all)
from models import user_models  # noqa: E402, F401

# [AI] Register blueprints
from routes import register_blueprints  # noqa: E402
register_blueprints(app)

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
