const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a team title'],
      trim: true,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    tech: [
      {
        type: String,
        trim: true,
      },
    ],
    description: {
      type: String,
      default: '',
    },
    githubUrl: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Recruiting'],
      default: 'Active',
    },
    openRoles: [
      {
        type: String,
        trim: true,
      },
    ],
    tasks: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          default: '',
          trim: true,
        },
        status: {
          type: String,
          enum: ['todo', 'in_progress', 'review', 'done'],
          default: 'todo',
        },
        priority: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium',
        },
        assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null,
        },
        dueDate: {
          type: String,
          default: '',
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Team', teamSchema);
