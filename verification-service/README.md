# 🛰️ Fire Verification Service

Python service that verifies NASA FIRMS wildfire alerts using Sentinel-2 satellite imagery (SWIR Band 12 thermal analysis).

## Quick Start

### 1. Install Dependencies

```bash
cd verification-service
pip install -r requirements.txt
```

### 2. Configure Credentials

1. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```

2. Get Sentinel Hub credentials:
   - Visit: https://www.sentinel-hub.com/
   - Create a free account
   - Go to Dashboard → OAuth clients → Create new client
   - Copy your `CLIENT_ID` and `CLIENT_SECRET`

3. Edit `.env` and paste your credentials:
   ```env
   SENTINEL_CLIENT_ID=your_client_id_here
   SENTINEL_CLIENT_SECRET=your_client_secret_here
   ```

### 3. Run the Service

```bash
python app.py
```

The service will start on `http://localhost:8000`

## API Endpoints

### Verify Fire
**POST** `/verify-fire`

**Request Body:**
```json
{
  "lat": 28.6139,
  "lon": 77.2090
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "intensity": "Severe",
  "confidence": "High",
  "timestamp": "2026-01-18T11:35:00.000Z",
  "metadata": {
    "coordinates": {"lat": 28.6139, "lon": 77.2090},
    "analysis": {
      "max_pixel_value": 3200,
      "hot_pixel_percentage": 15.5
    }
  }
}
```

### Health Check
**GET** `/health`

Returns service status and configuration.

## How It Works

1. **Receives coordinates** from NASA FIRMS fire alert
2. **Fetches Sentinel-2 data** for a 1km × 1km area around the coordinates
3. **Analyzes SWIR Band 12** (Short-Wave Infrared) thermal data
4. **Applies threshold**: Pixel values > 2500 indicate active fire
5. **Calculates intensity**:
   - **Severe**: Max pixel value > 3500
   - **Medium**: Max pixel value > 2800
   - **Low**: Max pixel value > 2500

## Configuration

Edit `.env` to customize:

| Variable | Default | Description |
|----------|---------|-------------|
| `FIRE_THRESHOLD` | 2500 | Minimum SWIR value for fire detection |
| `BBOX_SIZE_KM` | 1.0 | Area size to analyze (km) |
| `FLASK_PORT` | 8000 | Service port |

## Testing

Test with curl:

```bash
curl -X POST http://localhost:8000/verify-fire \
  -H "Content-Type: application/json" \
  -d "{\"lat\": 28.6139, \"lon\": 77.2090}"
```

## Troubleshooting

**"No recent cloud-free imagery available"**
- Sentinel-2 searches last 3 days for cloud-free imagery
- Try different coordinates or wait for newer satellite passes

**"Service not configured"**
- Ensure `SENTINEL_CLIENT_ID` and `SENTINEL_CLIENT_SECRET` are set in `.env`
- Check credentials are valid at https://apps.sentinel-hub.com/dashboard/

**High false positives/negatives**
- Adjust `FIRE_THRESHOLD` in `.env`
- Lower value = more sensitive (more false positives)
- Higher value = less sensitive (may miss small fires)

## Free Tier Limits

- **1,000 processing units/month**
- Each verification uses ~1-2 units
- Allows approximately **500-1000 verifications per month**
- Monitor usage at: https://apps.sentinel-hub.com/dashboard/

## Integration with FireFusion

This service is called by the Node.js backend (`wildfireMonitoring.js`) to verify fires before creating dashboard alerts.
