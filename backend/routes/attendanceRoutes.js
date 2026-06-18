import express from 'express';
import Attendance from '../models/Attendance.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { protect, faculty } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get attendance records for a course
// @route   GET /api/attendance/:courseId
// @access  Private
router.get('/:courseId', protect, async (req, res) => {
  const courseId = req.params.courseId;
  const date = req.query.date;

  try {
    const query = { courseId };
    
    // If student, restrict to their own records
    if (req.user.role === 'student') {
      query.studentId = req.user._id;
    }

    if (date) {
      query.date = date;
    }

    const records = await Attendance.find(query);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get current student's full attendance logs
// @route   GET /api/attendance/student/my
// @access  Private
router.get('/student/my', protect, async (req, res) => {
  try {
    const records = await Attendance.find({ studentId: req.user._id });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Mark attendance for a student (Faculty only)
// @route   POST /api/attendance/:courseId
// @access  Private/Faculty
router.post('/:courseId', protect, faculty, async (req, res) => {
  const courseId = req.params.courseId;
  const { date, studentEmail, status } = req.body;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    // Verify instructor ownership
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to mark attendance for this course.' });
    }

    const student = await User.findOne({ email: studentEmail.toLowerCase() });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    // Upsert attendance entry
    const record = await Attendance.findOneAndUpdate(
      { courseId, studentId: student._id, date },
      { status, studentEmail: studentEmail.toLowerCase() },
      { new: true, upsert: true }
    );

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
