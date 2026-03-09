const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');
require('dotenv').config();

const createDemoUsers = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/firefusion');
        console.log('Connected to DB');

        const users = [
            // 4 Regular Users (public)
            {
                name: "Rahul Sharma",
                email: "rahul@gmail.com",
                password: "user123",
                role: "public"
            },
            {
                name: "Priya Patel",
                email: "priya@gmail.com",
                password: "user123",
                role: "public"
            },
            {
                name: "Amit Kumar",
                email: "amit@gmail.com",
                password: "user123",
                role: "public"
            },
            {
                name: "Sneha Reddy",
                email: "sneha@gmail.com",
                password: "user123",
                role: "public"
            },
            // 3 Volunteers
            {
                name: "Volunteer Ravi",
                email: "ravi.volunteer@gmail.com",
                password: "volunteer123",
                role: "volunteer"
            },
            {
                name: "Volunteer Deepa",
                email: "deepa.volunteer@gmail.com",
                password: "volunteer123",
                role: "volunteer"
            },
            {
                name: "Volunteer Suresh",
                email: "suresh.volunteer@gmail.com",
                password: "volunteer123",
                role: "volunteer"
            },
            // 1 Coordinator
            {
                name: "Coordinator Chief",
                email: "coordinator@firesync.com",
                password: "admin123",
                role: "coordinator"
            }
        ];

        console.log('\n=== Creating Demo Users ===\n');

        for (const u of users) {
            const exists = await User.findOne({ email: u.email });
            if (exists) {
                exists.name = u.name;
                exists.role = u.role;
                exists.password = u.password;
                await exists.save();
                console.log(`✅ Updated: ${u.name} (${u.email}) - Role: ${u.role}`);
            } else {
                await new User(u).save();
                console.log(`✅ Created: ${u.name} (${u.email}) - Role: ${u.role}`);
            }
        }

        console.log('\n=== Demo User Credentials ===\n');
        console.log('📌 REGULAR USERS (public):');
        console.log('   1. rahul@gmail.com / user123');
        console.log('   2. priya@gmail.com / user123');
        console.log('   3. amit@gmail.com / user123');
        console.log('   4. sneha@gmail.com / user123');
        console.log('\n📌 VOLUNTEERS:');
        console.log('   1. ravi.volunteer@gmail.com / volunteer123');
        console.log('   2. deepa.volunteer@gmail.com / volunteer123');
        console.log('   3. suresh.volunteer@gmail.com / volunteer123');
        console.log('\n📌 COORDINATOR:');
        console.log('   1. coordinator@firesync.com / admin123');
        console.log('\n=== All users ready! ===\n');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Database disconnected.');
    }
};

createDemoUsers();
