const Reward = require('../models/rewardModel');
const Team = require('../models/teamModel');
const User = require('../models/userModel');
const { createNotification } = require('../utils/notificationService');
const { sendRewardDispatchedEmail } = require('../config/nodemailer');

// 1. Team Lead records a dispatched reward
const sendReward = async (req, res) => {
  try {
    const { teamId, recipientId, amount, reason, utrNumber } = req.body;

    if (!teamId || !recipientId || !amount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Team, recipient, amount, and milestone reason are required.',
      });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number.',
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    // Verify caller is the Team Lead
    const isLead = (team.lead?._id || team.lead)?.toString() === req.user._id.toString();
    if (!isLead) {
      return res.status(403).json({
        success: false,
        message: 'Only the Team Lead can grant rewards for this team.',
      });
    }

    // Verify recipient is a team member
    const isMember = (team.members || []).some(
      (m) => (m?._id || m)?.toString() === recipientId.toString()
    );
    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: 'Recipient is not a member of this project team.',
      });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient student not found.' });
    }

    // Create reward record
    const reward = await Reward.create({
      team: team._id,
      sender: req.user._id,
      recipient: recipient._id,
      amount: numericAmount,
      currency: 'INR',
      reason: reason.trim(),
      utrNumber: utrNumber ? utrNumber.trim() : '',
      status: 'dispatched',
    });

    // Award bonus ranking points to the recipient (e.g., 50 ranking points per milestone)
    recipient.rankingPoints = (recipient.rankingPoints || 500) + 50;
    await recipient.save();

    // 1. Dispatch In-App Notification
    createNotification({
      recipient: recipient._id,
      sender: req.user._id,
      type: 'TEAM_ACCEPTED',
      title: '🎉 Milestone Reward Received!',
      message: `${req.user.name || 'Team Lead'} granted you a milestone reward of ₹${numericAmount} in "${team.title}": ${reason.trim()}`,
      link: '/teams',
    });

    // 2. Dispatch Email
    if (recipient.email) {
      sendRewardDispatchedEmail({
        toEmail: recipient.email,
        recipientName: recipient.name || 'Student Contributor',
        senderName: req.user.name || 'Team Lead',
        teamTitle: team.title,
        amount: numericAmount,
        reason: reason.trim(),
        utrNumber: utrNumber ? utrNumber.trim() : '',
      }).catch((err) => console.error('[Reward Email Error]:', err.message));
    }

    const populatedReward = await Reward.findById(reward._id)
      .populate('sender', 'name email department')
      .populate('recipient', 'name email department upiId');

    return res.status(201).json({
      success: true,
      message: `Reward of ₹${numericAmount} recorded and notification dispatched!`,
      reward: populatedReward,
    });
  } catch (error) {
    console.error('sendReward error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get rewards for a specific team
const getTeamRewards = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const currentUserId = req.user._id.toString();
    const isMemberOrLead =
      (team.lead?._id || team.lead)?.toString() === currentUserId ||
      (team.members || []).some((m) => (m?._id || m)?.toString() === currentUserId);

    if (!isMemberOrLead && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only members of this team can view reward history.',
      });
    }

    const rewards = await Reward.find({ team: teamId })
      .populate('sender', 'name email department')
      .populate('recipient', 'name email department upiId')
      .sort({ createdAt: -1 });

    return res.json({ success: true, rewards });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get my received and sent rewards
const getMyRewards = async (req, res) => {
  try {
    const rewards = await Reward.find({
      $or: [{ recipient: req.user._id }, { sender: req.user._id }],
    })
      .populate('team', 'title')
      .populate('sender', 'name email')
      .populate('recipient', 'name email upiId')
      .sort({ createdAt: -1 });

    const totalReceived = rewards
      .filter((r) => r.recipient?._id?.toString() === req.user._id.toString())
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    return res.json({ success: true, rewards, totalReceived });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  sendReward,
  getTeamRewards,
  getMyRewards,
};
