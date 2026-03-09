const mongoose = require('mongoose');

const InventoryRequestSchema = new mongoose.Schema({
  volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  requestedQty: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Denied', 'Fulfilled'], 
    default: 'Pending' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InventoryRequest', InventoryRequestSchema);
