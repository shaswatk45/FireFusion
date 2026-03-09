/**
 * CREATE 5 VOLUNTEERS
 * Run: node create_volunteers.js
 * 
 * CREDENTIALS (save for reference):
 * ================================
 * 1. volunteer1@firesync.com / vol123
 * 2. volunteer2@firesync.com / vol123
 * 3. volunteer3@firesync.com / vol123
 * 4. volunteer4@firesync.com / vol123
 * 5. volunteer5@firesync.com / vol123
 */

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createVolunteers = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/disastersync');
        console.log('Connected to DB');
        console.log('');

        const volunteers = [
            {
                name: "Rahul Sharma",
                email: "volunteer1@firesync.com",
                password: "vol123",
                role: "volunteer"
            },
            {
                name: "Priya Patel",
                email: "volunteer2@firesync.com",
                password: "vol123",
                role: "volunteer"
            },
            {
                name: "Amit Kumar",
                email: "volunteer3@firesync.com",
                password: "vol123",
                role: "volunteer"
            },
            {
                name: "Sneha Reddy",
                email: "volunteer4@firesync.com",
                password: "vol123",
                role: "volunteer"
            },
            {
                name: "Vikram Singh",
                email: "volunteer5@firesync.com",
                password: "vol123",
                role: "volunteer"
            }
        ];

        console.log('='.repeat(50));
        console.log('VOLUNTEER CREDENTIALS (SAVE FOR REFERENCE)');
        console.log('='.repeat(50));

        for (const v of volunteers) {
            const exists = await User.findOne({ email: v.email });
            if (exists) {
                exists.name = v.name;
                exists.role = v.role;
                exists.password = v.password;
                await exists.save();
                console.log(`✅ Updated: ${v.name}`);
            } else {
                await new User(v).save();
                console.log(`✅ Created: ${v.name}`);
            }
            console.log(`   Email: ${v.email}`);
            console.log(`   Password: ${v.password}`);
            console.log('');
        }

        console.log('='.repeat(50));
        console.log('ALL VOLUNTEERS READY!');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDatabase disconnected.');
    }
};

createVolunteers();
