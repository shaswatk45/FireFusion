const mongoose = require('mongoose');
const Incident = require('./models/Incident');
require('dotenv').config();

async function checkCoords() {
    await mongoose.connect('mongodb://127.0.0.1:27017/disastersync');
    const incidents = await Incident.find().sort({ reportedAt: -1 }).limit(5);

    console.log('--- LATEST 5 INCIDENTS ---');
    incidents.forEach(inc => {
        console.log(`ID: ${inc._id}`);
        console.log(`Title: ${inc.title}`);
        console.log(`Coords [lng, lat]: ${JSON.stringify(inc.location.coordinates)}`);
        console.log(`Address: ${inc.address}`);
        console.log('---');
    });

    process.exit();
}

checkCoords();
