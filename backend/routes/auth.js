const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Register/Sign Up route
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({ 
      email, 
      password, 
      role: role || 'user' // Default to 'user' if no role provided
    });
    await user.save();

    res.status(201).json({ 
      message: 'User created successfully',
      user: { id: user._id, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Sign In/Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password (no hashing as requested)
    if (user.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }    res.status(200).json({
      message: 'Login successful',
      user: { id: user._id, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
