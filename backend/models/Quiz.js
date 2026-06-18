import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  answer: { type: Number, required: true } // 0-indexed correct option
});

const quizSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number,
    required: true,
    default: 120 // seconds
  },
  questions: [questionSchema]
}, {
  timestamps: true
});

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
