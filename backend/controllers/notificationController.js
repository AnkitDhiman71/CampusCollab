const Notification = require('../models/notificationModel');

// @desc    Get current user notifications and unread count
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .populate('sender', 'name email department ranking')
        .sort({ createdAt: -1 })
        .limit(30),
      Notification.countDocuments({ recipient: userId, read: false }),
    ]);

    return res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });

    return res.json({
      success: true,
      message: 'Notification marked as read',
      notification,
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all user notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );

    return res.json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete single notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findOneAndDelete({ _id: id, recipient: req.user._id });

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });

    return res.json({
      success: true,
      message: 'Notification removed',
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
