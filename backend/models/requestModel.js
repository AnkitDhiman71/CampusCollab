const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Please provide a project or collaboration message'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    interactionRequested: {
      type: Boolean,
      default: false,
    },
    interactionRequestedAt: {
      type: Date,
    },
    interactionCompleted: {
      type: Boolean,
      default: false,
    },
    interactionCompletedAt: {
      type: Date,
    },
    scheduledDate: {
      type: String,
      default: '',
    },
    scheduledTime: {
      type: String,
      default: '',
    },
    duration: {
      type: Number,
      default: 30,
    },
    timezone: {
      type: String,
      default: 'IST',
    },
    meetingLink: {
      type: String,
      default: '',
    },
    calendarLink: {
      type: String,
      default: '',
    },
    fileUrl: {
      type: String,
      default: '',
    },
    fileName: {
      type: String,
      default: '',
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    requestType: {
      type: String,
      enum: ['peer', 'team_invite', 'team_join_request'],
      default: 'peer',
    },
    role: {
      type: String,
      default: '',
      trim: true,
    },
    leadAllowedJoin: {
      type: Boolean,
      default: false,
    },
    leadAllowedJoinAt: {
      type: Date,
    },
    testDetails: {
      isAssigned: {
        type: Boolean,
        default: false,
      },
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      title: {
        type: String,
        default: '',
        trim: true,
      },
      description: {
        type: String,
        default: '',
      },
      language: {
        type: String,
        default: 'javascript',
      },
      timeLimitMinutes: {
        type: Number,
        default: 30,
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
      assignedAt: {
        type: Date,
      },
      startedAt: {
        type: Date,
      },
      status: {
        type: String,
        enum: ['not_assigned', 'pending', 'in_progress', 'completed', 'terminated_violations'],
        default: 'not_assigned',
      },
      submittedCode: {
        type: String,
        default: '',
      },
      submittedAt: {
        type: Date,
      },
      timeSpentSeconds: {
        type: Number,
        default: 0,
      },
      violationsCount: {
        type: Number,
        default: 0,
      },
      violationLogs: [
        {
          timestamp: {
            type: Date,
            default: Date.now,
          },
          type: {
            type: String,
            default: 'tab_switch',
          },
          description: {
            type: String,
            default: '',
          },
        },
      ],
      outputLog: {
        type: String,
        default: '',
      },
      score: {
        type: String,
        default: '',
      },
      feedback: {
        type: String,
        default: '',
      },
      aiEvaluation: {
        score: { type: Number, default: null },
        verdict: { type: String, default: '' },
        strengths: { type: String, default: '' },
        improvements: { type: String, default: '' },
        timeComplexity: { type: String, default: '' },
        spaceComplexity: { type: String, default: '' },
        feedback: { type: String, default: '' },
        evaluatedAt: { type: Date },
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Request', requestSchema);

