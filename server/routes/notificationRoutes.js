const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public route to simulate maintenance agent sending alerts
router.post('/', notificationController.createNotification);

// Protected routes for technicians
router.use(protect);
router.get('/:technicienId', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/read-all/:technicienId', notificationController.markAllAsRead);

module.exports = router;


