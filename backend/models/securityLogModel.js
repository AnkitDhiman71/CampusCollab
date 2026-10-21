const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema(
  {
    ipAddress: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    method: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    endpoint: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    statusCode: {
      type: Number,
      required: true,
      index: true,
    },
    responseTimeMs: {
      type: Number,
      default: 0,
    },
    threatLevel: {
      type: String,
      enum: ['Normal', 'Low', 'Medium', 'High', 'Critical'],
      default: 'Normal',
      index: true,
    },
    attackType: {
      type: String,
      enum: [
        'None',
        'Unauthorized Admin Access',
        'Failed Authentication / Brute Force',
        'SQL / NoSQL Injection',
        'XSS Injection Attempt',
        'Path Traversal Attack',
        'Automated Scanner / Malicious Bot',
        'Suspicious Payload / Header Manipulation',
        'Rate Limit Burst'
      ],
      default: 'None',
      index: true,
    },
    userAgent: {
      type: String,
      default: 'Unknown',
    },
    browser: {
      type: String,
      default: 'Unknown Browser',
    },
    os: {
      type: String,
      default: 'Unknown OS',
    },
    deviceType: {
      type: String,
      default: 'Desktop',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userEmail: {
      type: String,
      default: 'Anonymous / Unauthenticated',
      index: true,
    },
    userRole: {
      type: String,
      default: 'guest',
    },
    requestHeaders: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    queryParams: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    requestPayloadSnippet: {
      type: String,
      default: '',
    },
    suspiciousIndicators: [
      {
        type: String,
      },
    ],
    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    originHost: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

securityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SecurityLog', securityLogSchema);
