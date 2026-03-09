const express = require('express');
const router = express.Router();
const InventoryRequest = require('../models/InventoryRequest');
const InventoryItem = require('../models/InventoryItem');
const authMiddleware = require('../middleware/auth');

// Volunteer creates a new inventory request (shortage report)
router.post('/', authMiddleware(['volunteer']), async (req, res) => {
  try {
    const { itemId, requestedQty } = req.body;
    if (!itemId || !requestedQty || requestedQty <= 0) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    const request = await InventoryRequest.create({
      volunteerId: req.user.id,
      itemId,
      requestedQty,
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Volunteer views their requests
router.get('/', authMiddleware(['volunteer']), async (req, res) => {
  try {
    const requests = await InventoryRequest.find({ volunteerId: req.user.id })
      .populate('itemId', 'name')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin/Coordinator views all requests
router.get('/all', authMiddleware(['admin', 'coordinator']), async (req, res) => {
  try {
    const requests = await InventoryRequest.find()
      .populate('itemId', 'name')
      .populate('volunteerId', 'name email')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin/Coordinator updates request status
router.patch('/:id', authMiddleware(['admin', 'coordinator']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Denied', 'Fulfilled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await InventoryRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('itemId', 'name')
      .populate('volunteerId', 'name email');

    if (!request) return res.status(404).json({ message: 'Request not found' });

    // If approved, optionally decrease inventory quantity
    if (status === 'Fulfilled') {
      const item = await InventoryItem.findById(request.itemId._id);
      if (item) {
        item.quantity = Math.max(item.quantity - request.requestedQty, 0);
        await item.save();
      }
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
