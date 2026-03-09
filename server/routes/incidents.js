const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const authMiddleware = require('../middleware/auth');

// Get all incidents (no auth required for now)
router.get('/', async (req, res) => {
  try {
    const incidents = await Incident.find()
      .populate('assignedTo', 'name email')
      .sort({ reportedAt: -1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new incident (no auth required for now)
router.post('/', async (req, res) => {
  const { title, description, location, severity, address, evidenceImage } = req.body;
  const incident = new Incident({
    title,
    description,
    location,
    severity,
    address: address || '',
    evidenceImage
  });

  try {
    const newIncident = await incident.save();

    // Emit to all connected clients
    if (global.io) {
      global.io.emit('newIncident', newIncident);
    }

    res.status(201).json(newIncident);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update incident status (admin/coordinator/volunteer only)
router.patch('/:id/status', authMiddleware(['admin', 'coordinator', 'volunteer']), async (req, res) => {
  try {
    const { status } = req.body;
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Emit update to all clients
    if (global.io) {
      global.io.emit('incidentUpdated', incident);
    }

    res.json(incident);
  } catch (err) {
    console.error('Error updating incident:', err);
    res.status(400).json({ message: err.message });
  }
});

// Delete incident (admin/coordinator only)
router.delete('/:id', authMiddleware(['admin', 'coordinator']), async (req, res) => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Emit deletion to all clients
    if (global.io) {
      global.io.emit('incidentDeleted', req.params.id);
    }

    res.json({ message: 'Incident deleted successfully' });
  } catch (err) {
    console.error('Error deleting incident:', err);
    res.status(400).json({ message: err.message });
  }
});

router.get('/assigned', authMiddleware(['volunteer', 'admin', 'coordinator']), async (req, res) => {
  try {
    const userId = req.user.id;
    // Find incidents where user is in the assignedTo array
    const assignedIncidents = await Incident.find({ assignedTo: userId })
      .populate('assignedTo', 'name email')  // Populate team member details
      .sort({ reportedAt: -1 });
    res.json(assignedIncidents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assign multiple volunteers to incident (admin/coordinator only)
router.patch('/:id/assign', authMiddleware(['admin', 'coordinator']), async (req, res) => {
  const { volunteerIds } = req.body;  // Now accepts array of volunteer IDs
  try {
    if (!volunteerIds || !Array.isArray(volunteerIds) || volunteerIds.length === 0) {
      return res.status(400).json({ message: 'volunteerIds array required' });
    }

    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { assignedTo: volunteerIds, status: 'In Progress' },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    if (global.io) global.io.emit('incidentUpdated', incident);

    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});




router.post('/:id/request-assignment', authMiddleware(['volunteer']), async (req, res) => {
  try {
    const volunteerId = req.user.id;
    const incidentId = req.params.id;

    // Here you would store a request in DB, or notify admin; For demo:
    // Emit event to admins or save to a collection for admin review

    if (global.io) {
      global.io.emit('assignmentRequest', { incidentId, volunteerId });
    }

    res.status(200).json({ message: 'Assignment request sent to admin' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Volunteer submits completion proof (photo evidence of completed work)
router.post('/:id/submit-proof', authMiddleware(['volunteer', 'admin', 'coordinator']), async (req, res) => {
  try {
    const { imageUrl, notes } = req.body;
    const volunteerId = req.user.id;
    const volunteerName = req.user.name || 'Unknown';

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Add proof to the incident
    incident.completionProofs.push({
      volunteerId,
      volunteerName,
      imageUrl,
      submittedAt: new Date(),
      notes: notes || ''
    });

    // Update status to Pending Verification
    incident.status = 'Pending Verification';
    await incident.save();

    // Notify coordinators
    if (global.io) {
      global.io.emit('proofSubmitted', {
        incidentId: incident._id,
        volunteerName,
        message: `${volunteerName} submitted completion proof for: ${incident.title}`
      });
      global.io.emit('incidentUpdated', incident);
    }

    res.json({ message: 'Proof submitted successfully', incident });
  } catch (error) {
    console.error('Error submitting proof:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get incident with proofs (for coordinator to review)
router.get('/:id/proofs', authMiddleware(['admin', 'coordinator']), async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('completionProofs.volunteerId', 'name email');

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
