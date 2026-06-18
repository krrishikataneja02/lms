import express from 'express';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import Course from '../models/Course.js';
import { protect, faculty, facultyOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get assignments based on user courses
// @route   GET /api/assignments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let assignments;
    if (req.user.role === 'admin') {
      assignments = await Assignment.find({});
    } else if (req.user.role === 'faculty') {
      const courses = await Course.find({ instructor: req.user._id });
      const courseIds = courses.map(c => c._id);
      assignments = await Assignment.find({ courseId: { $in: courseIds } });
    } else if (req.user.role === 'student') {
      const courses = await Course.find({ studentsEnrolled: req.user._id });
      const courseIds = courses.map(c => c._id);
      assignments = await Assignment.find({ courseId: { $in: courseIds } });
    }
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create new assignment (Faculty only)
// @route   POST /api/assignments
// @access  Private/Faculty
router.post('/', protect, faculty, async (req, res) => {
  const { courseId, title, description, dueDate, points } = req.body;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Assigned course not found.' });
    }

    // Verify ownership
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized: You do not teach this course.' });
    }

    const assignment = await Assignment.create({
      courseId,
      title,
      description,
      dueDate,
      points: Number(points)
    });

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Submit student work
// @route   POST /api/assignments/:id/submit
// @access  Private
router.post('/:id/submit', protect, async (req, res) => {
  const { content, fileName } = req.body;
  const assignmentId = req.params.id;

  try {
    const asg = await Assignment.findById(assignmentId);
    if (!asg) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    // Check if submission already exists (update/overwrite for resubmission)
    let submission = await Submission.findOne({
      assignmentId,
      studentId: req.user._id
    });

    if (submission) {
      submission.content = content;
      submission.fileName = fileName || submission.fileName;
      submission.submissionDate = new Date().toISOString().split('T')[0];
      // Reset grading if resubmitted
      submission.grade = null;
      submission.feedback = null;
      await submission.save();
    } else {
      submission = await Submission.create({
        assignmentId,
        studentId: req.user._id,
        studentEmail: req.user.email,
        submissionDate: new Date().toISOString().split('T')[0],
        content,
        fileName
      });
    }

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get submissions list (student see theirs, instructor sees all)
// @route   GET /api/assignments/:id/submissions
// @access  Private
router.get('/:id/submissions', protect, async (req, res) => {
  const assignmentId = req.params.id;

  try {
    let submissions;
    if (req.user.role === 'student') {
      submissions = await Submission.find({
        assignmentId,
        studentId: req.user._id
      });
    } else {
      submissions = await Submission.find({ assignmentId })
        .populate('studentId', 'name email');
    }
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get student submissions profile list
// @route   GET /api/assignments/submissions/my
// @access  Private
router.get('/submissions/my', protect, async (req, res) => {
  try {
    const submissions = await Submission.find({ studentId: req.user._id });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Grade submission (Faculty only)
// @route   PUT /api/assignments/submissions/:subId/grade
// @access  Private/Faculty
router.put('/submissions/:subId/grade', protect, faculty, async (req, res) => {
  const { grade, feedback } = req.body;
  const subId = req.params.subId;

  try {
    const submission = await Submission.findById(subId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    submission.grade = Number(grade);
    submission.feedback = feedback;
    await submission.save();

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
