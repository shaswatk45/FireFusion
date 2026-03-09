const mongoose = require('mongoose');

const wildfireSchema = new mongoose.Schema({
    firmsId: {
        type: String,
        required: true,
        unique: true // To prevent duplicate detections
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [Number] // [longitude, latitude]
    },
    address: String,
    brightness: Number, // Brightness temperature (Kelvin)
    confidence: String, // Low, Medium, High
    frp: Number, // Fire Radiative Power (MW)
    satellite: String, // MODIS or VIIRS
    acqDate: Date, // Acquisition date from satellite
    acqTime: String, // Acquisition time
    detectedAt: {
        type: Date,
        default: Date.now
    },
    incidentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Incident'
    },
    status: {
        type: String,
        enum: ['detected', 'verification_pending', 'verified', 'rejected', 'incident_created', 'resolved'],
        default: 'detected'
    },
    // Sentinel-2 verification data
    verified: {
        type: Boolean,
        default: false
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected', 'error', 'skipped'],
        default: 'pending'
    },
    verificationData: {
        intensity: String, // Low, Medium, Severe
        confidence: String, // Low, Medium, High
        timestamp: Date,
        maxPixelValue: Number,
        hotPixelPercentage: Number,
        error: String
    }
}, { timestamps: true });

wildfireSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Wildfire', wildfireSchema);
