const notificationService = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');

exports.getNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await notificationService.getNotificationsByTechnician(req.params.technicienId);

  res.status(200).json({
    status: 'success',
    results: notifications.length,
    data: { notifications },
  });
});

exports.getAdminNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await notificationService.getAdminNotifications();

  res.status(200).json({
    status: 'success',
    results: notifications.length,
    data: { notifications },
  });
});

exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await notificationService.markAsRead(req.params.id);

  res.status(200).json({
    status: 'success',
    data: { notification },
  });
});

exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await notificationService.markAllAsRead(req.params.technicienId);

  res.status(200).json({
    status: 'success',
    data: null,
  });
});


exports.deleteNotification = asyncHandler(async (req, res, next) => {
  await notificationService.deleteNotification(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createNotification = asyncHandler(async (req, res, next) => {
  const notification = await notificationService.createNotification(req.body);

  // Emit real-time event via Socket.IO if attached to the request
  const io = req.app.get('socketio');
  if (io && req.body.technicienId) {
    io.to(req.body.technicienId.toString()).emit('newNotification', notification);
  }

  res.status(201).json({
    status: 'success',
    data: {
      notification,
    },
  });
});
