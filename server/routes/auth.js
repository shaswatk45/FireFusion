const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Register
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const user = new User({ name, email, password, role });
    await user.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    res.status(400).json({ message: "Registration error", error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token, user: { name: user.name, email, role: user.role } });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

module.exports = router;
