import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  submissionDate: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    default: null
  },
  grade: {
    type: Number,
    default: null
  },
  feedback: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
