const mongoose = require('mongoose');
const Incident = require('./models/Incident');
require('dotenv').config();

const clearOldWildfireIncidents = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/firefusion');
        console.log('Connected to MongoDB\n');

        // Count incidents by type before
        const total = await Incident.countDocuments();
        const wildfireIncidents = await Incident.countDocuments({
            title: { $regex: /Wildfire Detected|N20 Satellite/i }
        });
        const sosIncidents = await Incident.countDocuments({
            title: { $regex: /SOS|EMERGENCY/i }
        });
        const otherIncidents = total - wildfireIncidents - sosIncidents;

        console.log('=== Before Cleanup ===');
        console.log(`📋 Total incidents: ${total}`);
        console.log(`🔥 Wildfire/Satellite incidents: ${wildfireIncidents}`);
        console.log(`🆘 SOS/Emergency incidents: ${sosIncidents}`);
        console.log(`📌 Other incidents: ${otherIncidents}`);

        // Delete wildfire-related incidents (created from satellite detections)
        const result = await Incident.deleteMany({
            title: { $regex: /Wildfire Detected|N20 Satellite/i }
        });

        console.log(`\n🗑️  Deleted ${result.deletedCount} wildfire incidents`);

        // Count remaining
        const remaining = await Incident.countDocuments();
        console.log(`\n=== After Cleanup ===`);
        console.log(`📋 Total incidents remaining: ${remaining}`);

        console.log('\n✅ Old wildfire incidents cleared!');
        console.log('ℹ️  SOS/Emergency incidents have been preserved.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDatabase disconnected.');
    }
};

clearOldWildfireIncidents();
