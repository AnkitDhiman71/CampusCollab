const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
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
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    utrNumber: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['dispatched', 'confirmed'],
      default: 'dispatched',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reward', rewardSchema);
