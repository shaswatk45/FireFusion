"""
Configuration module for Fire Verification Service
Loads settings from environment variables
"""
import os
from dotenv import load_dotenv
load_dotenv()
class Config:
    """Application configuration"""
    SENTINEL_CLIENT_ID = os.getenv('SENTINEL_CLIENT_ID', '')
    SENTINEL_CLIENT_SECRET = os.getenv('SENTINEL_CLIENT_SECRET', '')
    FIRE_THRESHOLD = int(os.getenv('FIRE_THRESHOLD', '2500'))
    BBOX_SIZE_KM = float(os.getenv('BBOX_SIZE_KM', '1.0'))
    FLASK_PORT = int(os.getenv('FLASK_PORT', '8000'))
    FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    INTENSITY_THRESHOLDS = {
        'severe': 3500,    # Very hot fire
        'medium': 2800,    # Moderate fire
        'low': FIRE_THRESHOLD  # Just above detection threshold
    }
    @staticmethod
    def validate():
        """Validate that required configuration is present"""
        errors = []
        if not Config.SENTINEL_CLIENT_ID:
            errors.append("SENTINEL_CLIENT_ID is not set")
        if not Config.SENTINEL_CLIENT_SECRET:
            errors.append("SENTINEL_CLIENT_SECRET is not set")
        return errors
    @staticmethod
    def is_configured():
        """Check if the service is properly configured"""
        return len(Config.validate()) == 0
