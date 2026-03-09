const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path as needed
require('dotenv').config();

const createCoordinator = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/disastersync');
        console.log('Connected to DB');

        const coordinatorData = {
            name: "Chief Coordinator",
            email: "coordinator@firesync.com",
            password: "admin123", // Will be hashed by pre-save hook
            role: "coordinator"
        };

        // check if exists
        const exists = await User.findOne({ email: coordinatorData.email });
        if (exists) {
            console.log('Coordinator already exists. Updating role...');
            exists.role = "coordinator";
            await exists.save();
            console.log('Updated existing user to Coordinator.');
        } else {
            const newUser = new User(coordinatorData);
            await newUser.save();
            console.log('Created NEW Coordinator user.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Done.');
    }
};

createCoordinator();
