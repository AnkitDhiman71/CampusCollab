const mongoose = require('mongoose');

const teamMessageSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      default: '',
      trim: true,
    },
    codeSnippet: {
      code: { type: String, default: '' },
      language: { type: String, default: 'javascript' },
    },
    attachment: {
      url: { type: String, default: '' },
      name: { type: String, default: '' },
      fileType: { type: String, default: '' }, // 'image', 'document', 'pdf', 'other'
      size: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TeamMessage', teamMessageSchema);
