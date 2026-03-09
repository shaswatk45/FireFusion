/**
 * Reset all incidents to Reported status (unassign volunteers)
 * Run: node reset_incidents.js
 */

const mongoose = require('mongoose');
const Incident = require('./models/Incident');
require('dotenv').config();

const resetIncidents = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/disastersync');
        console.log('Connected to DB\n');

        // Reset all incidents to Reported status and remove volunteer assignment
        const result = await Incident.updateMany(
            {}, // all incidents
            {
                $set: { status: 'Reported' },
                $unset: { assignedTo: '' }
            }
        );

        console.log(`✅ Reset ${result.modifiedCount} incidents to "Reported" status`);
        console.log('All volunteer assignments removed');
        console.log('\nNow you can test assigning volunteers again!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

resetIncidents();
