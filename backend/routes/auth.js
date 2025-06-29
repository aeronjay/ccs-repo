const express = require('express');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const router = express.Router();

// In-memory storage for OTPs (expires after 10 minutes)
const otpStorage = new Map();

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL,
    pass: process.env.GMAIL_PASSWORD
  }
});

// Helper function to generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to clean expired OTPs
const cleanExpiredOTPs = () => {
  const now = Date.now();
  for (const [email, data] of otpStorage.entries()) {
    if (now > data.expiresAt) {
      otpStorage.delete(email);
    }
  }
};

// Send OTP to email for verification
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Clean up expired OTPs
    cleanExpiredOTPs();

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    // Store OTP in memory
    otpStorage.set(email, {
      otp,
      expiresAt,
      verified: false
    });

    // Send email
    const mailOptions = {
      from: process.env.GMAIL,
      to: email,
      subject: 'CCS Research Repository - Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Hello,</p>
          <p>Thank you for registering with CCS Research Repository. Please use the following OTP to verify your email address:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
          <br>
          <p>Best regards,<br>CCS Research Repository Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: 'OTP sent successfully to your email',
      expiresAt
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Clean up expired OTPs
    cleanExpiredOTPs();

    // Check if OTP exists and is valid
    const otpData = otpStorage.get(email);
    if (!otpData) {
      return res.status(400).json({ message: 'OTP expired or not found. Please request a new one.' });
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // Mark as verified
    otpData.verified = true;
    otpStorage.set(email, otpData);

    res.status(200).json({ 
      message: 'Email verified successfully',
      verified: true
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

// Register/Sign Up route
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Clean up expired OTPs
    cleanExpiredOTPs();

    // Check if email was verified with OTP
    const otpData = otpStorage.get(email);
    if (!otpData || !otpData.verified) {
      return res.status(400).json({ message: 'Email not verified. Please verify your email first.' });
    }

    // Check if user already exists (double check)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user with default 'user' role and 'pending' status
    const user = new User({ 
      email, 
      password, 
      role: 'user', // Always default to 'user' role
      status: 'pending' // Require admin approval
    });
    await user.save();

    // Clean up OTP data after successful registration
    otpStorage.delete(email);

    // Send pending approval email to user
    const approvalMailOptions = {
      from: process.env.GMAIL,
      to: email,
      subject: 'CCS Research Repository - Account Pending Approval',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #663399;">Account Registration Successful</h2>
          <p>Hello,</p>
          <p>Thank you for registering with CCS Research Repository. Your account has been created successfully!</p>
          <div style="background-color: #f8f5ff; padding: 20px; border-left: 4px solid #663399; margin: 20px 0;">
            <p style="margin: 0; color: #663399; font-weight: bold;">⏳ Your account is currently pending approval</p>
            <p style="margin: 10px 0 0 0;">An administrator will review your registration and approve your account shortly. You will receive an email notification once your account is approved.</p>
          </div>
          <p>Once approved, you'll be able to access all features of the CCS Research Repository.</p>
          <br>
          <p>Best regards,<br>CCS Research Repository Team</p>
        </div>
      `
    };

    await transporter.sendMail(approvalMailOptions);

    res.status(201).json({ 
      message: 'User created successfully. Your account is pending approval.',
      user: { id: user._id, email: user.email, role: user.role, status: user.status }
    });
  } catch (error) {
    console.error('Registration error:', error);
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
    }

    // Check if user account is approved (unless admin)
    if (user.role !== 'admin' && user.status !== 'approved') {
      return res.status(403).json({ 
        message: 'Your account is pending approval. Please wait for an administrator to approve your account.',
        status: user.status
      });
    }

    res.status(200).json({
      message: 'Login successful',
      user: { id: user._id, email: user.email, role: user.role, status: user.status }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin routes for user management
// Get all users (admin only)
router.get('/admin/users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user role (admin only)
router.put('/admin/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, select: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user (admin only)
router.delete('/admin/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user statistics (admin only)
router.get('/admin/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const regularUsers = await User.countDocuments({ role: 'user' });
    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const approvedUsers = await User.countDocuments({ status: 'approved' });
    const rejectedUsers = await User.countDocuments({ status: 'rejected' });
    
    const recentUsers = await User.find({}, { password: 0 })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalUsers,
      adminUsers,
      regularUsers,
      pendingUsers,
      approvedUsers,
      rejectedUsers,
      recentUsers
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pending users (admin only)
router.get('/admin/users/pending', async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' }, { password: 0 })
      .sort({ createdAt: -1 });
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve/reject user (admin only)
router.put('/admin/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true, select: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send email notification to user
    let emailSubject, emailContent;
    
    if (status === 'approved') {
      emailSubject = 'CCS Research Repository - Account Approved';
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #663399;">Account Approved! 🎉</h2>
          <p>Hello,</p>
          <p>Great news! Your CCS Research Repository account has been approved by an administrator.</p>
          <div style="background-color: #f0f8f0; padding: 20px; border-left: 4px solid #28a745; margin: 20px 0;">
            <p style="margin: 0; color: #28a745; font-weight: bold;">✅ You can now access your account</p>
            <p style="margin: 10px 0 0 0;">You can now sign in and access all features of the CCS Research Repository.</p>
          </div>
          <p>Welcome to the CCS Research Repository community!</p>
          <br>
          <p>Best regards,<br>CCS Research Repository Team</p>
        </div>
      `;
    } else if (status === 'rejected') {
      emailSubject = 'CCS Research Repository - Account Registration Update';
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #663399;">Account Registration Update</h2>
          <p>Hello,</p>
          <p>We regret to inform you that your CCS Research Repository account registration could not be approved at this time.</p>
          <div style="background-color: #fff5f5; padding: 20px; border-left: 4px solid #dc3545; margin: 20px 0;">
            <p style="margin: 0; color: #dc3545; font-weight: bold;">Account registration was not approved</p>
            <p style="margin: 10px 0 0 0;">If you believe this is an error or have questions, please contact the administrator.</p>
          </div>
          <p>Thank you for your interest in the CCS Research Repository.</p>
          <br>
          <p>Best regards,<br>CCS Research Repository Team</p>
        </div>
      `;
    }

    if (emailSubject && emailContent) {
      const mailOptions = {
        from: process.env.GMAIL,
        to: user.email,
        subject: emailSubject,
        html: emailContent
      };

      await transporter.sendMail(mailOptions);
    }

    res.json({ message: `User ${status} successfully`, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
