const express = require('express');
const router = express.Router();
const InventoryItem = require('../models/InventoryItem');
const authMiddleware = require('../middleware/auth');
const { io } = require('../server'); // socket.io instance

// Get all inventory items
router.get('/', authMiddleware(['volunteer', 'admin', 'coordinator']), async (req, res) => {
  try {
    const items = await InventoryItem.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update inventory item quantity (volunteer allowed)
router.patch('/:id', authMiddleware(['volunteer', 'admin', 'coordinator']), async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.quantity = quantity;
    item.updatedBy = req.user.id;
    item.updatedAt = Date.now();
    await item.save();

    // Emit to admins if quantity below threshold
    if (item.quantity < item.minRequired && io) {
      io.emit('inventoryLow', {
        itemId: item._id,
        name: item.name,
        quantity: item.quantity,
        threshold: item.minRequired
      });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
