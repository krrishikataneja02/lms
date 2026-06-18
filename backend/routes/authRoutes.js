import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import Course from '../models/Course.js';
import Submission from '../models/Submission.js';
import Attendance from '../models/Attendance.js';
import Attempt from '../models/Attempt.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Generate JWT Helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'aegis_lms_jwt_key_2026', {
    expiresIn: '30d'
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user && (await user.comparePassword(password))) {
      res.json({
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, role, password } = req.body;

  try {
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'A user with this email address already exists.' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      role,
      password
    });

    if (user) {
      res.status(201).json({
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid user data.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role
  });
});

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create new user (Admin only)
// @route   POST /api/auth/users
// @access  Private/Admin
router.post('/users', protect, admin, async (req, res) => {
  const { name, email, role, password } = req.body;

  try {
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'A user with this email address already exists.' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      role,
      password: password || 'password123'
    });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete user and cascade clear associations (Admin only)
// @route   DELETE /api/auth/users/:email
// @access  Private/Admin
router.delete('/users/:email', protect, admin, async (req, res) => {
  const email = req.params.email.toLowerCase();

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const userId = user._id;

    // Delete User
    await User.findByIdAndDelete(userId);

    // Clean up course enrollments
    await Course.updateMany(
      { studentsEnrolled: userId },
      { $pull: { studentsEnrolled: userId } }
    );

    // Clean up submissions
    await Submission.deleteMany({ studentId: userId });

    // Clean up attendance
    await Attendance.deleteMany({ studentId: userId });

    // Clean up attempts
    await Attempt.deleteMany({ studentId: userId });

    res.json({ message: `Deleted user ${email} and all nested resources.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get system settings (Admin only)
// @route   GET /api/auth/settings
// @access  Private
router.get('/settings', protect, async (req, res) => {
  try {
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({ geminiApiKey: '' });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Save system settings (Admin only)
// @route   POST /api/auth/settings
// @access  Private/Admin
router.post('/settings', protect, admin, async (req, res) => {
  const { geminiApiKey } = req.body;

  try {
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = new Settings({ geminiApiKey });
    } else {
      settings.geminiApiKey = geminiApiKey;
    }
    await settings.save();
    res.json({ message: 'Settings saved successfully.', settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
