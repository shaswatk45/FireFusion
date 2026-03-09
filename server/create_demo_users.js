const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');
require('dotenv').config();

const createUsers = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/firefusion');
        console.log('Connected to DB');

        const users = [
            {
                name: "Coordinator Chief",
                email: "coordinator@firesync.com",
                password: "admin123",
                role: "coordinator"
            },
            {
                name: "Demo Public User",
                email: "user@firesync.com",
                password: "user123",
                role: "public"
            },
            {
                name: "Demo Volunteer",
                email: "volunteer@firesync.com",
                password: "volunteer123",
                role: "volunteer"
            },
            {
                name: "System Admin",
                email: "admin@firesync.com",
                password: "admin123",
                role: "admin"
            }
        ];

        for (const u of users) {
            const exists = await User.findOne({ email: u.email });
            if (exists) {
                // Update password and role manually to ensure they are correct
                // We must hash password because we are updating directly
                // (Pre-save hook might run if we save, but explicit hash is safer for update)
                exists.name = u.name;
                exists.role = u.role;
                // If we save, the pre-save hook will hash ONLY if 'password' is modified.
                // To force reset, we set it.
                exists.password = u.password;
                await exists.save();
                console.log(`Updated: ${u.role} (${u.email})`);
            } else {
                await new User(u).save();
                console.log(`Created: ${u.role} (${u.email})`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Done.');
    }
};

createUsers();
