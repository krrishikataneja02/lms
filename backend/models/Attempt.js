import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentEmail: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  answers: [{ type: Number }],
  date: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const Attempt = mongoose.model('Attempt', attemptSchema);
export default Attempt;
