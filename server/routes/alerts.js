const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Broadcast emergency alert (admin/coordinator only)
router.post('/broadcast', authMiddleware(['admin', 'coordinator']), async (req, res) => {
  try {
    const { message, severity = 'high' } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Alert message is required' });
    }

    const alert = {
      id: Date.now().toString(),
      message: message.trim(),
      severity,
      timestamp: new Date(),
      sentBy: req.user.id
    };

    // Broadcast to all connected clients
    if (global.io) {
      global.io.emit('emergencyAlert', alert);
    }

    res.json({
      message: 'Emergency alert broadcasted successfully',
      alert
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get recent alerts (admin/coordinator only)
router.get('/recent', authMiddleware(['admin', 'coordinator']), async (req, res) => {
  try {
    // In a real app, you'd store alerts in database
    // For now, we'll return a sample response
    res.json([
      {
        id: '1',
        message: 'System test alert',
        severity: 'low',
        timestamp: new Date(),
        sentBy: 'system'
      }
    ]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
