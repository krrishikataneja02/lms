import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';
import { runSeed } from './config/seed.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes Mounts
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/ai', aiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server breakdown error occurred.' });
});

const PORT = process.env.PORT || 5000;

// Start Server & Connect Database
const startServer = async () => {
  await connectDB();
  
  // Auto-seed database if empty
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Database empty! Running automated data seeder...');
      await runSeed();
    }
  } catch (err) {
    console.error('Auto-seed check failed:', err);
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
  });
};

startServer();
