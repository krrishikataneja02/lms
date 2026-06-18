import express from 'express';
import Quiz from '../models/Quiz.js';
import Attempt from '../models/Attempt.js';
import Course from '../models/Course.js';
import { protect, faculty } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get quizzes based on user courses
// @route   GET /api/quizzes
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let quizzes;
    if (req.user.role === 'admin') {
      quizzes = await Quiz.find({});
    } else if (req.user.role === 'faculty') {
      const courses = await Course.find({ instructor: req.user._id });
      const courseIds = courses.map(c => c._id);
      quizzes = await Quiz.find({ courseId: { $in: courseIds } });
    } else if (req.user.role === 'student') {
      const courses = await Course.find({ studentsEnrolled: req.user._id });
      const courseIds = courses.map(c => c._id);
      quizzes = await Quiz.find({ courseId: { $in: courseIds } });
    }
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create new Quiz (Faculty only)
// @route   POST /api/quizzes
// @access  Private/Faculty
router.post('/', protect, faculty, async (req, res) => {
  const { courseId, title, duration, questions } = req.body;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized: You do not teach this course.' });
    }

    const quiz = await Quiz.create({
      courseId,
      title,
      duration: Number(duration),
      questions
    });

    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Submit Quiz attempt
// @route   POST /api/quizzes/:id/attempts
// @access  Private
router.post('/:id/attempts', protect, async (req, res) => {
  const { answers, score } = req.body;
  const quizId = req.params.id;

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz assessment not found.' });
    }

    const attempt = await Attempt.create({
      quizId,
      studentId: req.user._id,
      studentEmail: req.user.email,
      score: Number(score),
      answers,
      date: new Date().toISOString().split('T')[0]
    });

    res.status(201).json(attempt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get student attempts history
// @route   GET /api/quizzes/attempts/my
// @access  Private
router.get('/attempts/my', protect, async (req, res) => {
  try {
    const attempts = await Attempt.find({ studentId: req.user._id });
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all attempts for a quiz (Faculty/Admin see all)
// @route   GET /api/quizzes/:id/attempts
// @access  Private
router.get('/:id/attempts', protect, async (req, res) => {
  const quizId = req.params.id;

  try {
    const attempts = await Attempt.find({ quizId }).populate('studentId', 'name email');
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
