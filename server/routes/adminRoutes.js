const express = require('express');
const adminController = require('../controllers/adminController');
const notificationController = require('../controllers/notificationController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/role', adminController.updateUserRole);
router.patch('/users/:id/approve', adminController.approveUser);
router.delete('/users/:id/reject', adminController.rejectUser);
router.delete('/users/:id', adminController.deleteUser);

// Notifications
router.get('/notifications', notificationController.getAdminNotifications);
router.patch('/notifications/:id/read', notificationController.markAsRead);
router.delete('/notifications/:id', notificationController.deleteNotification);

module.exports = router;
