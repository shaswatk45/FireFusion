const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const VolunteerRequest = require('../models/VolunteerRequest');

// Get all users (admin/coordinator only)
router.get('/', authMiddleware(['admin', 'coordinator']), async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user role (admin/coordinator only)
router.patch('/:id/role', authMiddleware(['admin', 'coordinator']), async (req, res) => {
  try {
    const { role } = req.body;

    if (!['admin', 'coordinator', 'volunteer', 'public'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Emit update to all clients
    if (global.io) {
      global.io.emit('userUpdated', user);
    }

    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete user (admin/coordinator only)
router.delete('/:id', authMiddleware(['admin', 'coordinator']), async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Emit deletion to all clients
    if (global.io) {
      global.io.emit('userDeleted', req.params.id);
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get user profile
router.get('/profile', authMiddleware(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST: User submits request to become volunteer
router.post('/request-volunteer', authMiddleware(), async (req, res) => {
  try {
    // Check if there's already a pending request
    const exists = await VolunteerRequest.findOne({ userId: req.user.id, status: 'Pending' });
    if (exists) return res.status(400).json({ message: "You have a pending request." });

    await VolunteerRequest.create({ userId: req.user.id });
    res.status(201).json({ message: "Request submitted." });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET: Admin/Coordinator fetches all pending requests
router.get('/volunteer-requests', authMiddleware(['admin', 'coordinator']), async (req, res) => {
  const requests = await VolunteerRequest.find({ status: 'Pending' }).populate('userId', 'name email');
  res.json(requests);
});

// PATCH: Admin/Coordinator approves/rejects
router.patch('/volunteer-requests/:id', authMiddleware(['admin', 'coordinator']), async (req, res) => {
  const { status } = req.body;
  const request = await VolunteerRequest.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('userId');
  if (status === 'Approved') {
    // Promote user's role
    await User.findByIdAndUpdate(request.userId._id, { role: 'volunteer' });
  }
  res.json(request);
});

module.exports = router;
