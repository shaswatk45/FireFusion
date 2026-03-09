const express = require('express');
const router = express.Router();
const Wildfire = require('../models/Wildfire');
const authMiddleware = require('../middleware/auth');

// Get all detected wildfires
router.get('/', authMiddleware(), async (req, res) => {
    try {
        const { status, limit = 50, sort = '-detectedAt' } = req.query;

        const query = {};
        if (status) query.status = status;

        const wildfires = await Wildfire.find(query)
            .populate('incidentId')
            .sort(sort)
            .limit(parseInt(limit));

        res.json(wildfires);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching wildfires', error: error.message });
    }
});

// Get wildfire statistics
router.get('/stats', authMiddleware(), async (req, res) => {
    try {
        const total = await Wildfire.countDocuments();
        const detected = await Wildfire.countDocuments({ status: 'detected' });
        const withIncidents = await Wildfire.countDocuments({ status: 'incident_created' });
        const resolved = await Wildfire.countDocuments({ status: 'resolved' });

        // Get fires from last 24 hours
        const last24h = await Wildfire.countDocuments({
            detectedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        res.json({
            total,
            detected,
            withIncidents,
            resolved,
            last24h
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
});

// Get wildfire by ID
router.get('/:id', authMiddleware(), async (req, res) => {
    try {
        const wildfire = await Wildfire.findById(req.params.id).populate('incidentId');
        if (!wildfire) {
            return res.status(404).json({ message: 'Wildfire not found' });
        }
        res.json(wildfire);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching wildfire', error: error.message });
    }
});

// Update wildfire status
router.patch('/:id', authMiddleware(), async (req, res) => {
    try {
        const { status } = req.body;

        const wildfire = await Wildfire.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!wildfire) {
            return res.status(404).json({ message: 'Wildfire not found' });
        }

        res.json(wildfire);
    } catch (error) {
        res.status(500).json({ message: 'Error updating wildfire', error: error.message });
    }
});

module.exports = router;

