const mongoose = require('mongoose');
const Wildfire = require('./models/Wildfire');
require('dotenv').config();

const clearWildfires = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/disastersync');
        console.log('Connected to MongoDB');

        // Get count before deletion
        const beforeCount = await Wildfire.countDocuments();
        console.log(`\n📊 Current wildfire records: ${beforeCount}`);

        // Delete all wildfire records
        const result = await Wildfire.deleteMany({});
        console.log(`\n🗑️  Deleted ${result.deletedCount} wildfire records`);

        // Verify deletion
        const afterCount = await Wildfire.countDocuments();
        console.log(`✅ Remaining wildfire records: ${afterCount}`);

        console.log('\n=== Wildfire data cleared! ===');
        console.log('ℹ️  Incidents have been preserved.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDatabase disconnected.');
    }
};

clearWildfires();
