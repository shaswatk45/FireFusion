
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust path if necessary

console.log('Testing MongoDB connection...');
const uri = 'mongodb://127.0.0.1:27017/disastersync';
console.log('URI:', uri);

mongoose.connect(uri)
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        try {
            const users = await User.find({});
            console.log(`Found ${users.length} users:`);
            users.forEach(u => {
                console.log(`- Email: ${u.email}, Role: ${u.role}`);
            });

            if (users.length === 0) {
                console.log('No users found. Creating a default admin...');
                // Create a default admin if none exists
                // Note: Password hashing is usually handled in the User model pre-save hook
                const admin = new User({
                    name: 'Admin User',
                    email: 'admin@example.com',
                    password: 'password123',
                    role: 'admin'
                });
                await admin.save();
                console.log('Created default admin: admin@example.com / password123');
            }
        } catch (err) {
            console.error('Error querying users:', err);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => {
        console.error('❌ Connection failed:', err);
        process.exit(1);
    });
