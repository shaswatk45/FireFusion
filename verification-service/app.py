"""
Flask API Service for Fire Verification
Provides REST endpoint to verify wildfire alerts using Sentinel-2 imagery
"""
from flask import Flask, request, jsonify
from config import Config
from verify_fire import verify_fire
import traceback
app = Flask(__name__)
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    config_status = Config.is_configured()
    config_errors = Config.validate() if not config_status else []
    return jsonify({
        'status': 'healthy' if config_status else 'misconfigured',
        'service': 'Fire Verification Service',
        'configured': config_status,
        'errors': config_errors,
        'settings': {
            'fire_threshold': Config.FIRE_THRESHOLD,
            'bbox_size_km': Config.BBOX_SIZE_KM
        }
    }), 200 if config_status else 503
@app.route('/verify-fire', methods=['POST'])
def verify_fire_endpoint():
    """
    Verify fire presence using Sentinel-2 satellite imagery
    Expected JSON body:
    {
        "lat": 28.6139,
        "lon": 77.2090
    }
    Returns:
    {
        "success": true,
        "verified": true/false,
        "intensity": "Low" | "Medium" | "Severe",
        "confidence": "Low" | "Medium" | "High",
        "timestamp": "ISO8601 timestamp",
        "metadata": {...}
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        if 'lat' not in data or 'lon' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: lat and lon'
            }), 400
        try:
            lat = float(data['lat'])
            lon = float(data['lon'])
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': 'Invalid coordinate values. lat and lon must be numbers'
            }), 400
        if not (-90 <= lat <= 90):
            return jsonify({
                'success': False,
                'error': 'Invalid latitude. Must be between -90 and 90'
            }), 400
        if not (-180 <= lon <= 180):
            return jsonify({
                'success': False,
                'error': 'Invalid longitude. Must be between -180 and 180'
            }), 400
        if not Config.is_configured():
            return jsonify({
                'success': False,
                'verified': False,
                'error': 'Service not configured. Please set SENTINEL_CLIENT_ID and SENTINEL_CLIENT_SECRET',
                'config_errors': Config.validate()
            }), 503
        print(f"\n{'='*60}")
        print(f"🔍 Fire Verification Request")
        print(f"Coordinates: {lat}°N, {lon}°E")
        print(f"{'='*60}")
        result = verify_fire(lat, lon)
        if result.get('verified'):
            print(f"✅ FIRE VERIFIED - Intensity: {result.get('intensity', 'Unknown')}")
        else:
            print(f"❌ NO FIRE DETECTED")
        print(f"{'='*60}\n")
        return jsonify(result), 200
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"❌ Error in verification endpoint: {error_trace}")
        return jsonify({
            'success': False,
            'verified': False,
            'error': f'Internal server error: {str(e)}'
        }), 500
@app.route('/', methods=['GET'])
def index():
    """Root endpoint with service information"""
    return jsonify({
        'service': 'Fire Verification Service',
        'version': '1.0.0',
        'description': 'Verify wildfire alerts using Sentinel-2 satellite imagery',
        'endpoints': {
            'POST /verify-fire': 'Verify fire at given coordinates',
            'GET /health': 'Service health check',
            'GET /': 'This information page'
        },
        'configured': Config.is_configured()
    })
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404
@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500
if __name__ == '__main__':
    print("\n" + "="*60)
    print("🛰️  Fire Verification Service Starting...")
    print("="*60)
    if Config.is_configured():
        print("✅ Configuration loaded successfully")
        print(f"   - Fire Threshold: {Config.FIRE_THRESHOLD}")
        print(f"   - Bounding Box Size: {Config.BBOX_SIZE_KM} km")
    else:
        print("⚠️  WARNING: Service not fully configured")
        print("   Missing credentials:")
        for error in Config.validate():
            print(f"   - {error}")
        print("\n   Please set credentials in .env file before using the service")
    print(f"\n🚀 Starting Flask server on {Config.FLASK_HOST}:{Config.FLASK_PORT}")
    print(f"   Access at: http://localhost:{Config.FLASK_PORT}")
    print("="*60 + "\n")
    app.run(
        host=Config.FLASK_HOST,
        port=Config.FLASK_PORT,
        debug=Config.FLASK_DEBUG
    )
