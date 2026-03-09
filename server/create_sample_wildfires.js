const mongoose = require('mongoose');
const Wildfire = require('./models/Wildfire');
require('dotenv').config();

const createSampleWildfires = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/firefusion');
        console.log('Connected to MongoDB\n');

        // Sample wildfire data with high FRP values (>50MW)
        const wildfires = [
            {
                firmsId: 'VIIRS_2026_001',
                location: { type: 'Point', coordinates: [77.5946, 12.9716] }, // Bangalore
                address: 'Near Bannerghatta National Park, Bangalore, Karnataka',
                brightness: 342.5,
                confidence: 'High',
                frp: 78.5, // High FRP
                satellite: 'VIIRS',
                acqDate: new Date(),
                acqTime: '13:45',
                status: 'detected'
            },
            {
                firmsId: 'MODIS_2026_002',
                location: { type: 'Point', coordinates: [73.8567, 18.5204] }, // Pune
                address: 'Sinhagad Forest Area, Pune, Maharashtra',
                brightness: 356.8,
                confidence: 'High',
                frp: 92.3, // Very High FRP
                satellite: 'MODIS',
                acqDate: new Date(),
                acqTime: '14:20',
                status: 'detected'
            },
            {
                firmsId: 'VIIRS_2026_003',
                location: { type: 'Point', coordinates: [77.2090, 28.6139] }, // Delhi
                address: 'Asola Bhatti Wildlife Sanctuary, South Delhi',
                brightness: 328.1,
                confidence: 'Medium',
                frp: 55.7, // High FRP
                satellite: 'VIIRS',
                acqDate: new Date(),
                acqTime: '12:30',
                status: 'detected'
            },
            {
                firmsId: 'MODIS_2026_004',
                location: { type: 'Point', coordinates: [80.2707, 13.0827] }, // Chennai
                address: 'Guindy National Park, Chennai, Tamil Nadu',
                brightness: 315.2,
                confidence: 'Medium',
                frp: 61.4, // High FRP
                satellite: 'MODIS',
                acqDate: new Date(),
                acqTime: '15:10',
                status: 'incident_created'
            },
            {
                firmsId: 'VIIRS_2026_005',
                location: { type: 'Point', coordinates: [88.3639, 22.5726] }, // Kolkata
                address: 'Sundarbans Border Region, West Bengal',
                brightness: 368.9,
                confidence: 'High',
                frp: 125.8, // Very High FRP
                satellite: 'VIIRS',
                acqDate: new Date(),
                acqTime: '11:45',
                status: 'detected'
            },
            {
                firmsId: 'MODIS_2026_006',
                location: { type: 'Point', coordinates: [75.7873, 26.9124] }, // Jaipur
                address: 'Nahargarh Wildlife Sanctuary, Jaipur, Rajasthan',
                brightness: 301.5,
                confidence: 'Low',
                frp: 32.1, // Lower FRP
                satellite: 'MODIS',
                acqDate: new Date(),
                acqTime: '16:00',
                status: 'detected'
            }
        ];

        console.log('Creating sample wildfire data...\n');

        for (const fire of wildfires) {
            const exists = await Wildfire.findOne({ firmsId: fire.firmsId });
            if (exists) {
                await Wildfire.updateOne({ firmsId: fire.firmsId }, fire);
                console.log(`✅ Updated: ${fire.address} (FRP: ${fire.frp} MW)`);
            } else {
                await new Wildfire(fire).save();
                console.log(`✅ Created: ${fire.address} (FRP: ${fire.frp} MW)`);
            }
        }

        const total = await Wildfire.countDocuments();
        const highFRP = await Wildfire.countDocuments({ frp: { $gte: 50 } });

        console.log('\n=== Wildfire Data Summary ===');
        console.log(`📊 Total wildfires: ${total}`);
        console.log(`🔥 High FRP (≥50 MW): ${highFRP}`);
        console.log('\n✅ Sample wildfire data created successfully!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDatabase disconnected.');
    }
};

createSampleWildfires();
