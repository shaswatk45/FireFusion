/**
 * CREATE PUBLIC USERS
 * Run: node create_public_users.js
 */

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createPublicUsers = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/disastersync');
        console.log('Connected to DB\n');

        const users = [
            { name: "Arun Mehta", email: "user1@firesync.com", password: "user123", role: "public" },
            { name: "Kavya Nair", email: "user2@firesync.com", password: "user123", role: "public" },
            { name: "Rohan Gupta", email: "user3@firesync.com", password: "user123", role: "public" },
            { name: "Anjali Verma", email: "user4@firesync.com", password: "user123", role: "public" },
            { name: "Sanjay Das", email: "user5@firesync.com", password: "user123", role: "public" }
        ];

        console.log('PUBLIC USER CREDENTIALS:');
        console.log('========================');

        for (const u of users) {
            const exists = await User.findOne({ email: u.email });
            if (exists) {
                exists.name = u.name;
                exists.role = u.role;
                exists.password = u.password;
                await exists.save();
                console.log(`✅ Updated: ${u.name} (${u.email})`);
            } else {
                await new User(u).save();
                console.log(`✅ Created: ${u.name} (${u.email})`);
            }
        }

        console.log('\nAll public users ready!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

createPublicUsers();
