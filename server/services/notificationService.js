const Notification = require('../models/Notification');

const getNotificationsByTechnician = async (technicienId) => {
  return await Notification.find({ technicienId }).sort({ createdAt: -1 });
};

const getAdminNotifications = async () => {
  return await Notification.find({ technicienId: { $exists: false } }).sort({ createdAt: -1 });
};

const createNotification = async (data) => {
  const notification = await Notification.create(data);
  return notification;
};

const markAsRead = async (id) => {
  return await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
};

const markAllAsRead = async (technicienId) => {
  return await Notification.updateMany({ technicienId, read: false }, { read: true });
};

const deleteNotification = async (id) => {
  return await Notification.findByIdAndDelete(id);
};

module.exports = {
  getNotificationsByTechnician,
  getAdminNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
