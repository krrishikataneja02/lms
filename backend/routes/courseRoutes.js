import express from 'express';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { protect, faculty, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get courses based on user role
// @route   GET /api/courses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let courses;
    if (req.user.role === 'admin') {
      courses = await Course.find({}).populate('instructor', 'name email');
    } else if (req.user.role === 'faculty') {
      courses = await Course.find({ instructor: req.user._id }).populate('studentsEnrolled', 'name email');
    } else if (req.user.role === 'student') {
      courses = await Course.find({ studentsEnrolled: req.user._id }).populate('instructor', 'name email');
    }
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get courses catalog (student is not enrolled in)
// @route   GET /api/courses/catalog
// @access  Private
router.get('/catalog', protect, async (req, res) => {
  try {
    const courses = await Course.find({ studentsEnrolled: { $ne: req.user._id } }).populate('instructor', 'name email');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a course (Admin only)
// @route   POST /api/courses
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  const { id, code, title, description, instructorEmail } = req.body;

  try {
    const courseExists = await Course.findOne({ 
      $or: [{ code: code.toUpperCase() }, { _id: id }] 
    });

    if (courseExists) {
      return res.status(400).json({ message: 'Course ID or Code already exists.' });
    }

    const instructorUser = await User.findOne({ email: instructorEmail.toLowerCase(), role: 'faculty' });
    if (!instructorUser) {
      return res.status(404).json({ message: 'Assigned instructor not found or does not have Faculty privilege.' });
    }

    const course = await Course.create({
      code,
      title,
      description,
      instructor: instructorUser._id,
      instructorName: instructorUser.name,
      modules: [],
      studentsEnrolled: []
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add syllabus module (Faculty only)
// @route   POST /api/courses/:id/modules
// @access  Private/Faculty
router.post('/:id/modules', protect, faculty, async (req, res) => {
  const { title } = req.body;
  const courseId = req.params.id;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    // Verify course belongs to this instructor
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized: You do not teach this course.' });
    }

    const newModule = {
      id: `${course.code}-M${course.modules.length + 1}`,
      title,
      files: []
    };

    course.modules.push(newModule);
    await course.save();

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Upload module syllabus file (Faculty only)
// @route   POST /api/courses/:id/modules/:modId/files
// @access  Private/Faculty
router.post('/:id/modules/:modId/files', protect, faculty, async (req, res) => {
  const { name, size } = req.body;
  const { id, modId } = req.params;

  try {
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    // Verify ownership
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to upload files.' });
    }

    const targetModule = course.modules.find(m => m.id === modId);
    if (!targetModule) {
      return res.status(404).json({ message: 'Syllabus module not found.' });
    }

    targetModule.files.push({
      name,
      size,
      date: new Date().toISOString().split('T')[0]
    });

    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Enroll student in course
// @route   POST /api/courses/:id/enroll
// @access  Private
router.post('/:id/enroll', protect, async (req, res) => {
  const courseId = req.params.id;
  const studentId = req.body.studentId || req.user._id;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    if (course.studentsEnrolled.includes(studentId)) {
      return res.status(400).json({ message: 'Student is already enrolled.' });
    }

    course.studentsEnrolled.push(studentId);
    await course.save();

    res.json({ message: 'Successfully enrolled in course.', course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Unenroll student from course
// @route   POST /api/courses/:id/unenroll
// @access  Private
router.post('/:id/unenroll', protect, async (req, res) => {
  const courseId = req.params.id;
  const studentId = req.body.studentId || req.user._id;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    course.studentsEnrolled = course.studentsEnrolled.filter(
      id => id.toString() !== studentId.toString()
    );
    await course.save();

    res.json({ message: 'Successfully unenrolled from course.', course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
