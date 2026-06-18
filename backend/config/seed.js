import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import Quiz from '../models/Quiz.js';
import Attempt from '../models/Attempt.js';
import Attendance from '../models/Attendance.js';
import Settings from '../models/Settings.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aegis_lms';

export async function runSeed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected for seeding...');

    // Clear existing data (optional but good for clean start in testing)
    await User.deleteMany({});
    await Course.deleteMany({});
    await Assignment.deleteMany({});
    await Submission.deleteMany({});
    await Quiz.deleteMany({});
    await Attempt.deleteMany({});
    await Attendance.deleteMany({});
    await Settings.deleteMany({});
    console.log('Cleared existing databases...');

    // 1. Seed Users
    // Passwords will be automatically hashed by User model pre-save hook
    const usersData = [
      { name: 'Super Administrator', email: 'admin@school.edu', password: 'admin123', role: 'admin' },
      { name: 'Prof. Sarah Smith', email: 'prof.smith@school.edu', password: 'faculty123', role: 'faculty' },
      { name: 'Alex Jones', email: 'alex.jones@school.edu', password: 'student123', role: 'student' }
    ];
    const createdUsers = await User.create(usersData);
    console.log('Created Users:', createdUsers.map(u => u.email));

    const adminUser = createdUsers.find(u => u.role === 'admin');
    const facultyUser = createdUsers.find(u => u.role === 'faculty');
    const studentUser = createdUsers.find(u => u.role === 'student');

    // 2. Seed System Settings
    await Settings.create({ geminiApiKey: '' });
    console.log('Created Default System Settings...');

    // 3. Seed Courses
    const coursesData = [
      {
        code: 'CS-101',
        title: 'Introduction to Computer Science',
        description: 'Learn the fundamentals of computational logic, algorithms, time complexity, and data searching patterns.',
        instructor: facultyUser._id,
        instructorName: facultyUser.name,
        modules: [
          {
            id: 'CS101-M1',
            title: 'Algorithmic Thinking & Pseudocode',
            files: [
              { name: 'introduction_to_algorithms.pdf', size: '1.4 MB', date: '2026-06-10' },
              { name: 'pseudocode_guide.txt', size: '230 KB', date: '2026-06-11' }
            ]
          },
          {
            id: 'CS101-M2',
            title: 'Sorting & Searching Deep Dive',
            files: [
              { name: 'binary_search_primer.pdf', size: '2.1 MB', date: '2026-06-15' }
            ]
          }
        ],
        studentsEnrolled: [studentUser._id]
      },
      {
        code: 'CS-202',
        title: 'Data Structures & Graph Theory',
        description: 'Advanced exploration of trees, graphs, traversals, shortest path routing, and hash mappings.',
        instructor: facultyUser._id,
        instructorName: facultyUser.name,
        modules: [
          {
            id: 'CS202-M1',
            title: 'Tree Data Structures & Balancing',
            files: [
              { name: 'binary_trees_primer.pdf', size: '3.1 MB', date: '2026-06-12' }
            ]
          }
        ],
        studentsEnrolled: [studentUser._id]
      }
    ];

    const createdCourses = await Course.create(coursesData);
    console.log('Created Courses:', createdCourses.map(c => c.code));

    const cs101 = createdCourses.find(c => c.code === 'CS-101');
    const cs202 = createdCourses.find(c => c.code === 'CS-202');

    // 4. Seed Assignments
    const asgData = [
      {
        courseId: cs101._id,
        title: 'Binary Search Implementation',
        description: 'Implement binary search in Javascript or Python. Write comments explaining the worst-case and best-case space/time complexity. The function must accept a sorted array and a target integer.',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        points: 100
      },
      {
        courseId: cs202._id,
        title: 'BFS & DFS Traversal Complexities',
        description: 'Develop a comparative summary analyzing when to use Depth-First Search vs Breadth-First Search. Write down code snippets illustrating graph cycle detection.',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        points: 100
      }
    ];

    const createdAsgs = await Assignment.create(asgData);
    console.log('Created Assignments:', createdAsgs.map(a => a.title));

    const asg101 = createdAsgs.find(a => a.title.includes('Binary Search'));

    // 5. Seed Submissions
    const subData = [
      {
        assignmentId: asg101._id,
        studentId: studentUser._id,
        studentEmail: studentUser.email,
        submissionDate: '2026-06-17',
        content: 'Here is my search implementation. Iterative approach, Time complexity is O(log N) and Space complexity is O(1) since it runs inline without extra recursion call allocation stacks.',
        fileName: 'binary_search.js',
        grade: 95,
        feedback: 'Excellent explanation of memory allocation. Clean and properly documented code.'
      }
    ];

    await Submission.create(subData);
    console.log('Created submissions...');

    // 6. Seed Quizzes
    const quizData = [
      {
        courseId: cs101._id,
        title: 'Core Algorithms Quiz',
        duration: 120,
        questions: [
          {
            id: 1,
            question: 'What is the worst-case time complexity of Binary Search?',
            options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
            answer: 1
          },
          {
            id: 2,
            question: 'Which data structure is typically used to implement Breadth-First Search (BFS)?',
            options: ['Stack', 'Queue', 'Binary Heap', 'Linked List'],
            answer: 1
          },
          {
            id: 3,
            question: 'What is the best-case time complexity of Bubble Sort on a pre-sorted array?',
            options: ['O(1)', 'O(n)', 'O(n log n)', 'O(n^2)'],
            answer: 1
          }
        ]
      },
      {
        courseId: cs202._id,
        title: 'Graph Theory & Trees MCQ',
        duration: 180,
        questions: [
          {
            id: 1,
            question: 'Which of the following describes a Tree structure in graph theory?',
            options: [
              'A graph with cycles and vertices',
              'A directed graph with uniform weight edges',
              'An undirected acyclic connected graph',
              'A graph with isolated loops'
            ],
            answer: 2
          },
          {
            id: 2,
            question: 'Which algorithm is optimal for finding the shortest path in a graph with negative edge weights but no negative cycles?',
            options: ["Dijkstra's Algorithm", 'Bellman-Ford Algorithm', "Kruskal's Algorithm", "Prim's Algorithm"],
            answer: 1
          }
        ]
      }
    ];

    const createdQuizzes = await Quiz.create(quizData);
    console.log('Created Quizzes:', createdQuizzes.map(q => q.title));

    const quiz1 = createdQuizzes.find(q => q.title.includes('Core'));

    // 7. Seed Quiz Attempts
    await Attempt.create({
      quizId: quiz1._id,
      studentId: studentUser._id,
      studentEmail: studentUser.email,
      score: 100,
      answers: [1, 1, 1],
      date: '2026-06-17'
    });
    console.log('Created Quiz attempts...');

    // 8. Seed Attendance
    const attendancesData = [
      { courseId: cs101._id, studentId: studentUser._id, studentEmail: studentUser.email, date: '2026-06-15', status: 'present' },
      { courseId: cs101._id, studentId: studentUser._id, studentEmail: studentUser.email, date: '2026-06-16', status: 'present' },
      { courseId: cs101._id, studentId: studentUser._id, studentEmail: studentUser.email, date: '2026-06-17', status: 'late' },
      { courseId: cs202._id, studentId: studentUser._id, studentEmail: studentUser.email, date: '2026-06-15', status: 'present' },
      { courseId: cs202._id, studentId: studentUser._id, studentEmail: studentUser.email, date: '2026-06-16', status: 'absent' }
    ];

    await Attendance.create(attendancesData);
    console.log('Created Attendance Records.');

    console.log('Database seeded successfully!');
    if (process.argv[1] && process.argv[1].includes('seed.js')) {
      mongoose.disconnect();
    }
  } catch (error) {
    console.error('Error seeding data:', error);
    if (process.argv[1] && process.argv[1].includes('seed.js')) {
      process.exit(1);
    }
  }
}

// Support running directly from command line
if (process.argv[1] && process.argv[1].includes('seed.js')) {
  runSeed();
}
