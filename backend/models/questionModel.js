const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a display name / preset label'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a challenge title'],
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    language: {
      type: String,
      enum: ['javascript', 'python', 'cpp', 'c', 'java', 'typescript'],
      default: 'javascript',
    },
    duration: {
      type: Number,
      default: 30,
      min: [5, 'Duration must be at least 5 minutes'],
      max: [180, 'Duration cannot exceed 180 minutes'],
    },
    description: {
      type: String,
      required: [true, 'Please provide problem statement and instructions'],
      trim: true,
    },
    starterCode: {
      type: String,
      default: '',
    },
    testCases: [
      {
        input: { type: String, default: '' },
        expectedOutput: { type: String, default: '' },
        explanation: { type: String, default: '' },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Question', questionSchema);
