const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.get('/', protect, alertController.getAllAlerts);
router.post('/chatbot', alertController.receiveChatbotAlert); // Open for chatbot
router.patch('/:id/status', protect, alertController.updateAlertStatus);

module.exports = router;
