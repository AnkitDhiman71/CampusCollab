const Notification = require('../models/notificationModel');

/**
 * Persists an in-app notification without interrupting the caller transaction.
 */
const createNotification = async ({ recipient, sender, type, title, message, link }) => {
  try {
    if (!recipient || !title || !message) return null;
    const notification = await Notification.create({
      recipient,
      sender: sender || null,
      type: type || 'GENERAL',
      title: title.trim(),
      message: message.trim(),
      link: link || '/requests',
    });
    return notification;
  } catch (error) {
    console.error('[NotificationService Error] Could not create notification:', error.message);
    return null;
  }
};

module.exports = {
  createNotification,
};
