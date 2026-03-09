"""
Fire Verification Module using Sentinel-2 Satellite Imagery
Uses SWIR Band 12 thermal analysis to detect active fires
"""
import numpy as np
from datetime import datetime, timedelta
from sentinelhub import (
    SHConfig,
    BBox,
    CRS,
    MimeType,
    SentinelHubRequest,
    DataCollection,
    bbox_to_dimensions
)
from config import Config
def create_bbox(lat, lon, size_km=1.0):
    """
    Create a bounding box around the given coordinates
    Args:
        lat: Latitude of the fire alert
        lon: Longitude of the fire alert
        size_km: Size of the bounding box in kilometers (default 1km)
    Returns:
        BBox object for Sentinel Hub API
    """
    lat_offset = size_km / 111.0
    lon_offset = size_km / (111.0 * np.cos(np.radians(lat)))
    bbox_coords = [
        lon - lon_offset,  # min longitude
        lat - lat_offset,  # min latitude
        lon + lon_offset,  # max longitude
        lat + lat_offset   # max latitude
    ]
    return BBox(bbox=bbox_coords, crs=CRS.WGS84)
def get_sentinel_config():
    """
    Initialize Sentinel Hub configuration with credentials
    Returns:
        SHConfig object with credentials
    """
    config = SHConfig()
    config.sh_client_id = Config.SENTINEL_CLIENT_ID
    config.sh_client_secret = Config.SENTINEL_CLIENT_SECRET
    config.sh_base_url = 'https://services.sentinel-hub.com'
    config.sh_token_url = 'https://services.sentinel-hub.com/oauth/token'
    return config
def fetch_swir_band12(lat, lon, bbox_size_km=1.0):
    """
    Fetch Sentinel-2 SWIR Band 12 data for the given location
    Args:
        lat: Latitude
        lon: Longitude
        bbox_size_km: Size of bounding box in km
    Returns:
        dict with 'success', 'data' (numpy array), and 'metadata'
    """
    try:
        bbox = create_bbox(lat, lon, bbox_size_km)
        bbox_coords = list(bbox)
        bbox_size = bbox_to_dimensions(bbox, resolution=20)  # 20m resolution for Band 12
        evalscript = """
        //VERSION=3
        function setup() {
            return {
                input: [{
                    bands: ["B12"],
                    units: "DN"
                }],
                output: {
                    bands: 1,
                    sampleType: "UINT16"
                }
            };
        }
        function evaluatePixel(sample) {
            return [sample.B12];
        }
        """
        config = get_sentinel_config()
        time_interval = (
            (datetime.now() - timedelta(days=3)).isoformat(),
            datetime.now().isoformat()
        )
        request = SentinelHubRequest(
            evalscript=evalscript,
            input_data=[
                SentinelHubRequest.input_data(
                    data_collection=DataCollection.SENTINEL2_L2A,
                    time_interval=time_interval,
                    maxcc=0.5  # Maximum 50% cloud coverage
                )
            ],
            responses=[
                SentinelHubRequest.output_response('default', MimeType.TIFF)
            ],
            bbox=bbox,
            size=bbox_size,
            config=config
        )
        response = request.get_data()
        if not response or len(response) == 0:
            return {
                'success': False,
                'error': 'No recent cloud-free imagery available',
                'data': None
            }
        band12_data = response[0]
        return {
            'success': True,
            'data': band12_data,
            'metadata': {
                'shape': list(band12_data.shape),
                'dtype': str(band12_data.dtype),
                'bbox': [float(x) for x in bbox_coords],
                'resolution': '20m'
            }
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'data': None
        }
def analyze_fire_presence(band12_data, threshold=2500):
    """
    Analyze SWIR Band 12 data to detect fire presence
    Args:
        band12_data: Numpy array of Band 12 pixel values
        threshold: Minimum pixel value to consider as fire
    Returns:
        dict with verification results
    """
    if band12_data is None or band12_data.size == 0:
        return {
            'verified': False,
            'reason': 'No valid imagery data'
        }
    max_value = np.max(band12_data)
    mean_value = np.mean(band12_data)
    hot_pixels = np.sum(band12_data > threshold)
    total_pixels = band12_data.size
    hot_pixel_percentage = (hot_pixels / total_pixels) * 100
    verified = max_value > threshold
    intensity = 'Low'
    if max_value > Config.INTENSITY_THRESHOLDS['severe']:
        intensity = 'Severe'
    elif max_value > Config.INTENSITY_THRESHOLDS['medium']:
        intensity = 'Medium'
    elif max_value > Config.INTENSITY_THRESHOLDS['low']:
        intensity = 'Low'
    return {
        'verified': bool(verified),
        'intensity': intensity,
        'max_pixel_value': int(max_value),
        'mean_pixel_value': float(mean_value),
        'hot_pixels_count': int(hot_pixels),
        'hot_pixel_percentage': float(hot_pixel_percentage),
        'threshold_used': threshold,
        'confidence': 'High' if max_value > threshold * 1.3 else 'Medium' if verified else 'Low'
    }
def verify_fire(lat, lon):
    """
    Main verification function - checks if fire is active at given coordinates
    Args:
        lat: Latitude
        lon: Longitude
    Returns:
        dict with complete verification results
    """
    try:
        if not Config.is_configured():
            config_errors = Config.validate()
            return {
                'success': False,
                'verified': False,
                'error': 'Service not configured: ' + ', '.join(config_errors),
                'timestamp': datetime.now().isoformat()
            }
        print(f"Fetching Sentinel-2 data for coordinates: {lat}, {lon}")
        sentinel_result = fetch_swir_band12(lat, lon, Config.BBOX_SIZE_KM)
        if not sentinel_result['success']:
            return {
                'success': False,
                'verified': False,
                'error': sentinel_result.get('error', 'Failed to fetch satellite data'),
                'timestamp': datetime.now().isoformat()
            }
        print("Analyzing SWIR Band 12 data...")
        analysis_result = analyze_fire_presence(
            sentinel_result['data'],
            Config.FIRE_THRESHOLD
        )
        return {
            'success': True,
            'verified': analysis_result['verified'],
            'intensity': analysis_result.get('intensity', 'Unknown'),
            'confidence': analysis_result.get('confidence', 'Low'),
            'timestamp': datetime.now().isoformat(),
            'metadata': {
                'coordinates': {'lat': lat, 'lon': lon},
                'sentinel_data': sentinel_result.get('metadata', {}),
                'analysis': analysis_result
            }
        }
    except Exception as e:
        print(f"Error in fire verification: {str(e)}")
        return {
            'success': False,
            'verified': False,
            'error': f'Verification failed: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }
