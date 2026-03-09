const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  address: { type: String, default: '' },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  severity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  status: { type: String, enum: ['Reported', 'In Progress', 'Pending Verification', 'Resolved'], default: 'Reported' },
  reportedAt: { type: Date, default: Date.now },
  evidenceImage: { type: String, default: null },

  // Completion proof photos from volunteers
  completionProofs: [{
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    volunteerName: String,
    imageUrl: String,
    submittedAt: { type: Date, default: Date.now },
    notes: String
  }],

  metadata: { type: mongoose.Schema.Types.Mixed }

});

IncidentSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Incident', IncidentSchema);
