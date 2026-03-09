const mongoose = require('mongoose');
const Incident = require('./models/Incident');
require('dotenv').config();

const clearSatelliteIncidents = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/firefusion');
        console.log('Connected to MongoDB');

        // Get count of satellite incidents before deletion
        const beforeCount = await Incident.countDocuments({ source: 'Satellite' });
        console.log(`\n📊 Current satellite-sourced incidents: ${beforeCount}`);

        // Get count of user-reported incidents (will be preserved)
        const userReported = await Incident.countDocuments({ source: { $ne: 'Satellite' } });
        console.log(`👤 User-reported incidents (will be preserved): ${userReported}`);

        // Delete only satellite-sourced incidents
        const result = await Incident.deleteMany({ source: 'Satellite' });
        console.log(`\n🗑️  Deleted ${result.deletedCount} satellite-sourced incidents`);

        // Verify deletion
        const afterCount = await Incident.countDocuments({ source: 'Satellite' });
        console.log(`✅ Remaining satellite incidents: ${afterCount}`);

        const totalRemaining = await Incident.countDocuments();
        console.log(`📋 Total incidents remaining: ${totalRemaining}`);

        console.log('\n=== Satellite incidents cleared! ===');
        console.log('ℹ️  User-reported incidents have been preserved.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDatabase disconnected.');
    }
};

clearSatelliteIncidents();
