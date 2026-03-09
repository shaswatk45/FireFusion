const mongoose = require('mongoose');
const Wildfire = require('./models/Wildfire');
require('dotenv').config();

const removeSmallFires = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/firefusion');
        console.log('Connected to MongoDB\n');

        // Delete wildfires with FRP < 50 MW
        const result = await Wildfire.deleteMany({ frp: { $lt: 50 } });
        console.log(`🗑️  Deleted ${result.deletedCount} wildfires with FRP < 50 MW\n`);

        // Show remaining wildfires
        const remaining = await Wildfire.find().sort({ frp: -1 });
        console.log('=== Remaining Wildfires (FRP ≥ 50 MW) ===\n');
        remaining.forEach(f => {
            console.log(`🔥 ${f.address}`);
            console.log(`   FRP: ${f.frp} MW | Confidence: ${f.confidence} | Satellite: ${f.satellite}`);
            console.log('');
        });

        console.log(`Total: ${remaining.length} wildfires`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

removeSmallFires();
