const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const DamageAssessment = require('../models/DamageAssessment');
const authMiddleware = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/damage-images/';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'damage-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, JPG, PNG) are allowed!'));
        }
    }
});

// Configure multer for PDF reports
const reportStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/reports/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'report-' + uniqueSuffix + '.pdf');
    }
});

const uploadReport = multer({
    storage: reportStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for PDF
    fileFilter: function (req, file, cb) {
        const extname = path.extname(file.originalname).toLowerCase() === '.pdf';
        const mimetype = file.mimetype === 'application/pdf';

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'));
        }
    }
});

// POST: Create new damage assessment
router.post('/assess', authMiddleware(), upload.single('image'), async (req, res) => {
    try {
        const { area } = req.body;
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        console.log(`📸 Processing damage assessment for user ${userId}`);

        // Forward image to Flask API
        const formData = new FormData();
        formData.append('image', fs.createReadStream(req.file.path));
        formData.append('area', area || 150);

        let flaskResponse;
        try {
            flaskResponse = await axios.post('http://127.0.0.1:5001/api/damage-assessment/predict', formData, {
                headers: formData.getHeaders(),
                timeout: 30000 // 30 second timeout
            });
        } catch (flaskError) {
            console.error('❌ Flask API error:', flaskError.message);
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(503).json({
                message: 'AI model service is unavailable. Please ensure the Flask server is running on port 5001.',
                error: flaskError.message
            });
        }

        const result = flaskResponse.data;

        // Save assessment to database
        const assessment = new DamageAssessment({
            userId,
            imageUrl: `/uploads/damage-images/${req.file.filename}`,
            prediction: result.prediction,
            confidence: result.confidence,
            affectedArea: result.area,
            estimatedCosts: {
                repairCost: result.costs.repair_total,
                rebuildCost: result.costs.rebuild_total,
                laborCost: result.costs.labor_cost,
                materialCost: result.costs.material_cost,
                cleanupCost: result.costs.cleanup_cost,
                baseCost: result.costs.base_cost,
                areaCost: result.costs.area_cost
            },
            detectedMaterials: result.costs.materials_found,
            probabilities: result.probabilities,
            heatmapUrl: result.heatmap ? `data:image/png;base64,${result.heatmap}` : null
        });

        await assessment.save();

        console.log(`✅ Assessment saved: ${result.prediction} (${result.confidence}% confidence)`);

        res.json({
            message: 'Assessment completed successfully',
            assessment
        });

    } catch (error) {
        console.error('❌ Assessment error:', error);

        // Clean up uploaded file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            message: 'Assessment failed',
            error: error.message
        });
    }
});

// GET: Retrieve user's damage assessments
router.get('/my-assessments', authMiddleware(), async (req, res) => {
    try {
        const assessments = await DamageAssessment.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50); // Limit to last 50 assessments

        console.log(`📋 Retrieved ${assessments.length} assessments for user ${req.user.id}`);
        res.json(assessments);
    } catch (error) {
        console.error('❌ Error fetching assessments:', error);
        res.status(500).json({ message: 'Failed to fetch assessments', error: error.message });
    }
});

// GET: Get single assessment by ID
router.get('/:id', authMiddleware(), async (req, res) => {
    try {
        const assessment = await DamageAssessment.findById(req.params.id);

        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        // Ensure user owns this assessment
        if (assessment.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized access to this assessment' });
        }

        res.json(assessment);
    } catch (error) {
        console.error('❌ Error fetching assessment:', error);
        res.status(500).json({ message: 'Failed to fetch assessment', error: error.message });
    }
});

// DELETE: Delete an assessment
router.delete('/:id', authMiddleware(), async (req, res) => {
    try {
        const assessment = await DamageAssessment.findById(req.params.id);

        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        // Ensure user owns this assessment
        if (assessment.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Delete the image file
        const imagePath = path.join(__dirname, '..', assessment.imageUrl);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await DamageAssessment.findByIdAndDelete(req.params.id);

        console.log(`🗑️ Deleted assessment ${req.params.id}`);
        res.json({ message: 'Assessment deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting assessment:', error);
        res.status(500).json({ message: 'Failed to delete assessment', error: error.message });
    }
});

// PATCH: Update assessment status
router.patch('/:id/status', authMiddleware(), async (req, res) => {
    try {
        const { status, notes } = req.body;
        const assessment = await DamageAssessment.findById(req.params.id);

        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        // Ensure user owns this assessment
        if (assessment.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (status) assessment.status = status;
        if (notes !== undefined) assessment.notes = notes;

        await assessment.save();

        console.log(`📝 Updated assessment ${req.params.id} status to ${status}`);
        res.json(assessment);
    } catch (error) {
        console.error('❌ Error updating assessment:', error);
        res.status(500).json({ message: 'Failed to update assessment', error: error.message });
    }
});

// PATCH: Raise Donation Request with PDF report
router.patch('/:id/request-donation', authMiddleware(), uploadReport.single('report'), async (req, res) => {
    try {
        const assessment = await DamageAssessment.findById(req.params.id);
        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        if (assessment.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Verified AI report (PDF) is required for donation requests' });
        }

        assessment.donation = {
            requested: true,
            status: 'open',
            requestedAt: new Date(),
            reportUrl: `/uploads/reports/${req.file.filename}`
        };

        await assessment.save();
        console.log(`🙏 Donation requested for assessment ${req.params.id} with report ${req.file.filename}`);
        res.json(assessment);
    } catch (error) {
        console.error('❌ Error requesting donation:', error);
        res.status(500).json({ message: 'Failed to request donation', error: error.message });
    }
});

// GET: Donation Feed (Excludes user's own requests)
router.get('/community/donation-feed', authMiddleware(), async (req, res) => {
    try {
        // Filter out the current user's own requests so they only see others
        const feed = await DamageAssessment.find({
            'donation.requested': true,
            userId: { $ne: req.user.id }  // Exclude current user's requests
        })
            .populate('userId', 'email name') // Populating email for contact
            .sort({ 'donation.requestedAt': -1 })
            .limit(50);

        console.log(`🤝 Retrieved ${feed.length} donation requests for user ${req.user.id} (excluding own)`);
        res.json(feed);
    } catch (error) {
        console.error('❌ Error fetching donation feed:', error);
        res.status(500).json({ message: 'Failed to fetch feed', error: error.message });
    }
});

// GET: Health check for Flask API
router.get('/health/ai-model', authMiddleware(), async (req, res) => {
    try {
        const response = await axios.get('http://127.0.0.1:5001/api/damage-assessment/health', {
            timeout: 5000
        });
        res.json(response.data);
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            message: 'Flask AI model server is not responding',
            error: error.message
        });
    }
});

module.exports = router;
