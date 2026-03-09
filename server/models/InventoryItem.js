const mongoose = require('mongoose');

const InventoryItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0 },
  minRequired: { type: Number, default: 1 }, // threshold for alert
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InventoryItem', InventoryItemSchema);
