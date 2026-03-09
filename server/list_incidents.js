const mongoose = require('mongoose');
const Incident = require('./models/Incident');
require('dotenv').config();

const listIncidents = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/disastersync');
        console.log('Connected to MongoDB\n');

        const incidents = await Incident.find().sort({ reportedAt: -1 }).limit(20);

        console.log(`📋 Total incidents: ${await Incident.countDocuments()}`);
        console.log('\n=== Last 20 Incidents ===\n');

        incidents.forEach((inc, i) => {
            console.log(`${i + 1}. ${inc.title}`);
            console.log(`   Severity: ${inc.severity} | Status: ${inc.status}`);
            console.log(`   Location: [${inc.location.coordinates.join(', ')}]`);
            console.log(`   Reported: ${inc.reportedAt}`);
            console.log(`   Source: ${inc.source || 'N/A'}`);
            console.log('');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

listIncidents();
