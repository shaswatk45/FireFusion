const mongoose = require('mongoose');

const damageAssessmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  prediction: {
    type: String,
    enum: ['mild', 'moderate', 'severe', 'nondamaged'],
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  affectedArea: {
    type: Number,
    required: true,
    min: 0
  },
  estimatedCosts: {
    repairCost: {
      type: Number,
      required: true
    },
    rebuildCost: Number,
    laborCost: Number,
    materialCost: Number,
    cleanupCost: Number,
    baseCost: Number,
    areaCost: Number,
    minCost: Number,
    maxCost: Number
  },
  detectedMaterials: [String],
  probabilities: {
    mild: Number,
    moderate: Number,
    severe: Number,
    nondamaged: Number
  },
  heatmapUrl: String,
  notes: String,
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'claimed'],
    default: 'pending'
  },
  donation: {
    requested: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['none', 'open', 'funded', 'closed'],
      default: 'none'
    },
    requestedAt: Date,
    reportUrl: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
damageAssessmentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('DamageAssessment', damageAssessmentSchema);
