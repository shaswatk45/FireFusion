const mongoose = require('mongoose');
const Incident = require('./models/Incident');
require('dotenv').config();

async function checkCoords() {
    await mongoose.connect('mongodb://127.0.0.1:27017/firefusion');
    const incidents = await Incident.find().sort({ reportedAt: -1 }).limit(10);
    console.log('--- DATA START ---');
    incidents.forEach(inc => {
        console.log(`TITLE: ${inc.title} | COORDS: ${inc.location.coordinates[0]},${inc.location.coordinates[1]}`);
    });
    console.log('--- DATA END ---');
    process.exit();
}
checkCoords();
