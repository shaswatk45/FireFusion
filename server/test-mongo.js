const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/firefusion';

console.log('='.repeat(50));
console.log('MongoDB Connection Test');
console.log('='.repeat(50));
console.log('Attempting to connect to:', MONGO_URI);
console.log('');

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ SUCCESS! Connected to MongoDB');
        console.log('Database name:', mongoose.connection.name);
        console.log('Connection state:', mongoose.connection.readyState);
        process.exit(0);
    })
    .catch((err) => {
        console.log('❌ FAILED! Could not connect to MongoDB');
        console.log('Error message:', err.message);
        console.log('');
        console.log('Full error details:');
        console.log(err);
        process.exit(1);
    });

// Timeout after 10 seconds
setTimeout(() => {
    console.log('⏱️ Connection attempt timed out after 10 seconds');
    process.exit(1);
}, 10000);
