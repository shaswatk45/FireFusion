require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/disastersync';
console.log(`Using MongoDB URI: ${mongoURI}`);

mongoose.connect(mongoURI)
  .then(() => {
    console.log('✅ Successfully connected to MongoDB');
    console.log('Database name:', mongoose.connection.name);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Full error:', err);
  });

// Additional connection event listeners
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Routes
const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');
const userRoutes = require('./routes/users');
const alertRoutes = require('./routes/alerts');
const inventoryRoutes = require('./routes/inventory');
const inventoryRequestRoutes = require('./routes/inventoryRequests');
const wildfireRoutes = require('./routes/wildfires');
const damageAssessmentRoutes = require('./routes/damageAssessment');

// Serve static files (uploaded images)
app.use('/uploads', express.static('uploads'));

app.use('/api/inventory-requests', inventoryRequestRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/wildfires', wildfireRoutes);
app.use('/api/damage-assessment', damageAssessmentRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: 'DisasterSync API is running!',
    version: '1.0.0',
    endpoints: [
      '/api/auth',
      '/api/incidents',
      '/api/users',
      '/api/alerts',
      '/api/inventory',
      '/api/inventory-requests',
      '/api/wildfires',
      '/api/damage-assessment',
    ]
  });
});

module.exports = app;
