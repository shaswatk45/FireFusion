# Sentinel Hub API Setup Guide

## Step 1: Create Sentinel Hub Account

1. **Go to**: https://www.sentinel-hub.com/
2. Click **"Sign up for free"** or **"Try Now"**
3. Create your account (free tier includes 1,000 processing units/month)

## Step 2: Get Your API Credentials

### Creating an OAuth Client

1. **Log in** to your Sentinel Hub account
2. Go to **Dashboard** → **User Settings** (or https://apps.sentinel-hub.com/dashboard/)
3. Click on **"OAuth clients"** in the left sidebar
4. Click **"+ New OAuth Client"** button
5. Fill in the details:
   - **Name**: `DisasterSync Fire Verification` (or any name you prefer)
   - **Grant Type**: Select **"Client Credentials"**
   - Click **Create**

6. **IMPORTANT**: After creation, you'll see two values - **COPY THESE IMMEDIATELY**:
   - `Client ID` - looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
   - `Client Secret` - looks like: `a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6`

### What These Credentials Look Like:

```
CLIENT_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
CLIENT_SECRET=a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6
```

## Step 3: Where to Paste These Credentials

You will paste these credentials in the `.env` file located at:
```
d:\SEM 5\EL\Disaster-Sync-main\Disaster-Sync-main\verification-service\.env
```

The file will look like this:

```env
# Sentinel Hub API Credentials
SENTINEL_CLIENT_ID=<PASTE YOUR CLIENT ID HERE>
SENTINEL_CLIENT_SECRET=<PASTE YOUR CLIENT SECRET HERE>

# Verification Settings
FIRE_THRESHOLD=2500
BBOX_SIZE_KM=1.0

# Flask Server Settings
FLASK_PORT=8000
FLASK_HOST=0.0.0.0
FLASK_DEBUG=True
```

## Example (with sample credentials):

```env
# Sentinel Hub API Credentials
SENTINEL_CLIENT_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
SENTINEL_CLIENT_SECRET=a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6

# Verification Settings
FIRE_THRESHOLD=2500
BBOX_SIZE_KM=1.0

# Flask Server Settings
FLASK_PORT=8000
FLASK_HOST=0.0.0.0
FLASK_DEBUG=True
```

## Important Notes

⚠️ **Security**: 
- Never commit the `.env` file to Git
- Never share your `CLIENT_SECRET` publicly
- Keep these credentials secure

✅ **Free Tier Limits**:
- 1,000 processing units per month
- Each fire verification uses approximately 1-2 processing units
- This allows ~500-1000 verifications per month (sufficient for most use cases)

📊 **Monitoring Usage**:
- Check your usage at: https://apps.sentinel-hub.com/dashboard/
- Navigate to **"Statistics"** to see processing unit consumption

## Next Steps

After setting up the credentials:

1. ✅ Create the verification service (I'll do this next)
2. ✅ Install Python dependencies
3. ✅ Test the verification endpoint
4. ✅ Integrate with your Node.js backend

---

**Ready?** Once you have your `CLIENT_ID` and `CLIENT_SECRET`, let me know and I'll create the complete verification service!
