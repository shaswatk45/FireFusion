const axios = require('axios');
const Wildfire = require('../models/Wildfire');
const Incident = require('../models/Incident');
const User = require('../models/User');

// NASA FIRMS API configuration
// You need to get a free MAP_KEY from: https://firms.modaps.eosdis.nasa.gov/api/map_key/
const FIRMS_API_KEY = process.env.NASA_FIRMS_API_KEY || 'YOUR_NASA_FIRMS_API_KEY';
const FIRMS_BASE_URL = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv';

// Define your area of interest (India coordinates for example)
// You can customize this based on your region
const AREA_CONFIG = {
    minLat: process.env.WILDFIRE_MIN_LAT || 8.0,
    maxLat: process.env.WILDFIRE_MAX_LAT || 35.0,
    minLon: process.env.WILDFIRE_MIN_LON || 68.0,
    maxLon: process.env.WILDFIRE_MAX_LON || 97.0
};

// Minimum confidence level to consider (low, nominal, high)
const MIN_CONFIDENCE = process.env.WILDFIRE_MIN_CONFIDENCE || 'nominal';

// Verification service configuration
const VERIFICATION_SERVICE_URL = process.env.VERIFICATION_SERVICE_URL || 'http://localhost:8000';
const ENABLE_VERIFICATION = process.env.ENABLE_VERIFICATION !== 'false'; // Enabled by default

/**
 * Fetch active fires from NASA FIRMS API
 * @param {string} source - 'VIIRS_NOAA20_NRT' or 'MODIS_NRT'
 * @param {number} dayRange - number of days to look back (1-10)
 */
async function fetchActiveFires(source = 'VIIRS_NOAA20_NRT', dayRange = 1) {
    try {
        const url = `${FIRMS_BASE_URL}/${FIRMS_API_KEY}/${source}/${AREA_CONFIG.minLon},${AREA_CONFIG.minLat},${AREA_CONFIG.maxLon},${AREA_CONFIG.maxLat}/${dayRange}`;

        console.log(`🛰️  Fetching wildfire data from NASA FIRMS...`);
        const response = await axios.get(url);

        if (!response.data) {
            console.log('No fire data received from NASA FIRMS');
            return [];
        }

        // Parse CSV data
        const lines = response.data.split('\n');
        const headers = lines[0].split(',');
        const fires = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(',');
            const fire = {};

            headers.forEach((header, index) => {
                fire[header.trim()] = values[index]?.trim();
            });

            // Filter by confidence level
            if (fire.confidence && shouldProcessFire(fire)) {
                fires.push(fire);
            }
        }

        console.log(`🔥 Found ${fires.length} active fires in the monitored area`);
        return fires;
    } catch (error) {
        console.error('Error fetching fires from NASA FIRMS:', error.message);
        return [];
    }
}

/**
 * Check if fire meets minimum confidence threshold
 */
function shouldProcessFire(fire) {
    const confidence = fire.confidence?.toLowerCase();

    if (MIN_CONFIDENCE === 'high') {
        return confidence === 'h' || confidence === 'high';
    } else if (MIN_CONFIDENCE === 'nominal') {
        return confidence === 'n' || confidence === 'nominal' || confidence === 'h' || confidence === 'high';
    }
    return true; // Include all if set to 'low'
}

/**
 * Call Sentinel-2 verification service to verify fire
 */
async function verifySatelliteFire(lat, lon) {
    if (!ENABLE_VERIFICATION) {
        console.log('⏭️  Verification disabled, skipping...');
        return {
            verified: true,
            skipped: true,
            reason: 'Verification disabled in configuration'
        };
    }

    try {
        console.log(`🛰️  Verifying fire at ${lat}°N, ${lon}°E via Sentinel-2...`);

        const response = await axios.post(`${VERIFICATION_SERVICE_URL}/verify-fire`, {
            lat: parseFloat(lat),
            lon: parseFloat(lon)
        }, {
            timeout: 30000, // 30 second timeout
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.success && response.data.verified) {
            console.log(`✅ Fire VERIFIED by Sentinel-2 - Intensity: ${response.data.intensity}`);
            return {
                verified: true,
                intensity: response.data.intensity,
                confidence: response.data.confidence,
                timestamp: response.data.timestamp,
                metadata: response.data.metadata
            };
        } else {
            console.log(`❌ Fire NOT verified by Sentinel-2`);
            return {
                verified: false,
                reason: response.data.error || 'No active fire detected in satellite imagery'
            };
        }
    } catch (error) {
        console.error('⚠️  Verification service error:', error.message);

        // If verification service is down, proceed with fire alert (failsafe)
        // You can change this behavior by returning verified: false
        return {
            verified: true, // Failsafe: proceed if verification unavailable
            skipped: true,
            error: error.message,
            reason: 'Verification service unavailable - proceeding with FIRMS data only'
        };
    }
}

/**
 * Process detected fires and create incidents
 */
async function processDetectedFires(fires) {
    let newFiresCount = 0;
    let incidentsCreated = 0;
    let verifiedCount = 0;
    let skippedSmallFires = 0;

    for (const fire of fires) {
        try {
            const firmsId = `${fire.latitude}_${fire.longitude}_${fire.acq_date}_${fire.acq_time}`;

            // Check if this fire was already detected
            const existingFire = await Wildfire.findOne({ firmsId });
            if (existingFire) {
                continue; // Skip already processed fires
            }

            // Parse FRP (Fire Radiative Power)
            const frp = parseFloat(fire.frp);
            const confidence = mapConfidence(fire.confidence);

            // **FILTER OUT SMALL AGRICULTURAL FIRES**
            // Only process real wildfires (FRP ≥ 50 MW)
            if (frp < 50) {
                skippedSmallFires++;
                console.log(`⏭️  Skipping small fire (${frp.toFixed(1)} MW) - likely agricultural burn`);
                continue; // Don't even create a database record
            }

            // Create wildfire record (only for fires ≥ 50 MW)
            const wildfire = new Wildfire({
                firmsId,
                location: {
                    type: 'Point',
                    coordinates: [parseFloat(fire.longitude), parseFloat(fire.latitude)]
                },
                brightness: parseFloat(fire.bright_ti4 || fire.brightness),
                confidence: confidence,
                frp: frp,
                satellite: fire.satellite || 'VIIRS',
                acqDate: new Date(fire.acq_date),
                acqTime: fire.acq_time,
                address: `Wildfire detected at ${fire.latitude}°N, ${fire.longitude}°E`,
                status: 'verification_pending',
                verificationStatus: 'pending'
            });

            await wildfire.save();
            newFiresCount++;

            // **VERIFY ALL WILDFIRES ≥ 50 MW**
            // Check if fire meets criteria for verification
            if (confidence === 'High' && frp >= 50) {
                console.log(`\n🔍 Wildfire detected (${frp.toFixed(1)} MW) - initiating Sentinel-2 verification...`);

                // Verify fire using Sentinel-2
                const verificationResult = await verifySatelliteFire(
                    fire.latitude,
                    fire.longitude
                );

                // Update wildfire with verification results
                wildfire.verified = verificationResult.verified && !verificationResult.skipped;
                wildfire.verificationStatus = verificationResult.skipped ? 'skipped' :
                    verificationResult.verified ? 'verified' :
                        verificationResult.error ? 'error' : 'rejected';

                if (verificationResult.verified && !verificationResult.skipped) {
                    wildfire.verificationData = {
                        intensity: verificationResult.intensity,
                        confidence: verificationResult.confidence,
                        timestamp: new Date(verificationResult.timestamp),
                        maxPixelValue: verificationResult.metadata?.analysis?.max_pixel_value,
                        hotPixelPercentage: verificationResult.metadata?.analysis?.hot_pixel_percentage
                    };
                } else if (verificationResult.error) {
                    wildfire.verificationData = {
                        error: verificationResult.reason || verificationResult.error
                    };
                }

                await wildfire.save();

                // ONLY create incident if fire is VERIFIED (or verification was skipped/failed)
                if (verificationResult.verified) {
                    verifiedCount++;

                    const incident = await createWildfireIncident(
                        wildfire,
                        fire,
                        verificationResult
                    );

                    wildfire.incidentId = incident._id;
                    wildfire.status = 'incident_created';
                    await wildfire.save();

                    incidentsCreated++;

                    // Send alert to coordinators (enhanced with verification data)
                    await alertCoordinators(incident, wildfire, verificationResult);
                } else {
                    console.log(`⏭️  Fire not verified - incident not created`);
                    wildfire.status = 'rejected';
                    await wildfire.save();
                }
            } else {
                console.log(`⏭️  Fire below confidence threshold - skipping verification`);
                wildfire.verificationStatus = 'skipped';
                wildfire.status = 'detected';
                await wildfire.save();
            }

        } catch (error) {
            console.error('Error processing fire:', error.message);
        }
    }

    console.log(`✅ Processed ${newFiresCount} wildfires (≥50 MW), ${verifiedCount} verified, created ${incidentsCreated} incidents`);
    console.log(`⏭️  Skipped ${skippedSmallFires} small fires (<50 MW - agricultural burns)`);
    return { newFiresCount, verifiedCount, incidentsCreated, skippedSmallFires };
}

/**
 * Map confidence levels from satellite data
 */
function mapConfidence(conf) {
    const c = conf?.toLowerCase();
    if (c === 'h' || c === 'high') return 'High';
    if (c === 'n' || c === 'nominal') return 'Medium';
    return 'Low';
}

/**
 * Create incident from wildfire detection
 */
async function createWildfireIncident(wildfire, fireData, verificationResult = null) {
    const severity = wildfire.frp > 100 ? 'High' : wildfire.frp > 50 ? 'Medium' : 'Low';

    // Build description with verification info
    let description = `Satellite-detected wildfire with ${wildfire.confidence} confidence.\nFire Radiative Power: ${wildfire.frp.toFixed(2)} MW\nBrightness: ${wildfire.brightness.toFixed(1)} K\nDetection Time: ${wildfire.acqDate.toISOString().split('T')[0]} ${wildfire.acqTime}`;

    if (verificationResult && verificationResult.verified && !verificationResult.skipped) {
        description += `\n\n✅ VERIFIED by Sentinel-2 Thermal Imaging\nIntensity: ${verificationResult.intensity}\nConfidence: ${verificationResult.confidence}`;
    } else if (verificationResult?.skipped) {
        description += `\n\n⚠️ Verification unavailable - based on NASA FIRMS data only.`;
    }

    description += `\n\n🚨 Immediate verification and response recommended.`;

    const incident = new Incident({
        title: verificationResult?.verified && !verificationResult.skipped ?
            `🔥 VERIFIED Wildfire - ${wildfire.satellite} + Sentinel-2` :
            `🔥 Wildfire Detected - ${wildfire.satellite} Satellite`,
        description,
        severity,
        status: 'Reported',
        location: wildfire.location,
        address: wildfire.address,
        reportedBy: null, // System-generated
        reportedAt: new Date(),
        metadata: {
            source: 'NASA_FIRMS',
            satellite: wildfire.satellite,
            brightness: wildfire.brightness,
            frp: wildfire.frp,
            confidence: wildfire.confidence,
            automated: true,
            verified: verificationResult?.verified || false,
            verification: verificationResult || null
        }
    });

    await incident.save();
    console.log(`🚨 Created wildfire incident: ${incident.title}`);
    return incident;
}

/**
 * Alert coordinators about new wildfire
 */
async function alertCoordinators(incident, wildfire, verificationResult = null) {
    try {
        // Find all coordinators
        const coordinators = await User.find({ role: 'coordinator' });

        // Prepare alert message
        const isVerified = verificationResult?.verified && !verificationResult?.skipped;
        const alertMessage = isVerified ?
            `🛰️ VERIFIED WILDFIRE at ${wildfire.address}` :
            `🛰️ Satellite wildfire detected at ${wildfire.address}`;

        // Send real-time alert via Socket.IO if available
        if (global.io) {
            global.io.emit('wildfire-alert', {
                type: 'wildfire',
                verified: isVerified,
                incident: incident,
                wildfire: {
                    satellite: wildfire.satellite,
                    confidence: wildfire.confidence,
                    frp: wildfire.frp,
                    brightness: wildfire.brightness,
                    verified: wildfire.verified,
                    verification: verificationResult ? {
                        intensity: verificationResult.intensity,
                        confidence: verificationResult.confidence
                    } : null
                },
                message: alertMessage,
                timestamp: new Date()
            });

            console.log(`📡 ${isVerified ? 'VERIFIED ' : ''}Wildfire alert sent to ${coordinators.length} coordinators via Socket.IO`);
        }

        // You can also add email/SMS notifications here if configured

    } catch (error) {
        console.error('Error alerting coordinators:', error.message);
    }
}

/**
 * Main monitoring function - run periodically
 */
async function monitorWildfires() {
    console.log('\n🛰️  Starting wildfire monitoring cycle...');

    try {
        // Fetch from VIIRS (more frequent updates, better for active monitoring)
        const viirsFiresLives = await fetchActiveFires('VIIRS_NOAA20_NRT', 1);

        // Optionally also check MODIS for broader coverage
        // const modisFires = await fetchActiveFires('MODIS_NRT', 1);
        // const allFires = [...viirsFires, ...modisFires];

        await processDetectedFires(viirsFiresLives);

        console.log('✅ Wildfire monitoring cycle completed\n');
    } catch (error) {
        console.error('❌ Error in wildfire monitoring:', error.message);
    }
}

/**
 * Start periodic monitoring
 * @param {number} intervalMinutes - How often to check (default: 60 minutes)
 */
function startWildfireMonitoring(intervalMinutes = 60) {
    console.log(`\n🛰️  Wildfire Monitoring System Started`);
    console.log(`📡 Monitoring area: Lat ${AREA_CONFIG.minLat}°-${AREA_CONFIG.maxLat}°, Lon ${AREA_CONFIG.minLon}°-${AREA_CONFIG.maxLon}°`);
    console.log(`⏱️  Check interval: ${intervalMinutes} minutes`);
    console.log(`🔒 Minimum confidence: ${MIN_CONFIDENCE}\n`);

    // Run immediately on startup
    monitorWildfires();

    // Then run periodically
    const intervalMs = intervalMinutes * 60 * 1000;
    setInterval(monitorWildfires, intervalMs);
}

module.exports = {
    startWildfireMonitoring,
    monitorWildfires,
    fetchActiveFires
};
