const mongoose = require('mongoose');
require('dotenv').config();

async function clearOldFireData() {
    try {
        // Use the exact same connection as the server
        const mongoUri = 'mongodb://127.0.0.1:27017/disastersync';

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000
        });

        console.log('✅ Connected to MongoDB');

        // Load models
        const Wildfire = require('./models/Wildfire');
        const Incident = require('./models/Incident');

        // Delete all wildfire records
        const wildfireResult = await Wildfire.deleteMany({});
        console.log(`🔥 Deleted ${wildfireResult.deletedCount} wildfire records`);

        // Delete all satellite-detected incidents (keep manually reported ones)
        const incidentResult = await Incident.deleteMany({
            $or: [
                { 'metadata.source': 'NASA_FIRMS' },
                { 'metadata.automated': true }
            ]
        });
        console.log(`📊 Deleted ${incidentResult.deletedCount} satellite incident records`);

        console.log('\n✅ Historical fire data cleared successfully!');
        console.log('🔄 Refresh your dashboard to see the clean state.');
        console.log('📊 From now on, only new wildfires (≥50 MW + verified) will appear.');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        if (error.name === 'MongooseServerSelectionError') {
            console.error('❌ Could not connect to MongoDB.');
            console.error('Make sure MongoDB is running or the server is started.');
        } else {
            console.error('❌ Error:', error.message);
        }
        process.exit(1);
    }
}

clearOldFireData();
