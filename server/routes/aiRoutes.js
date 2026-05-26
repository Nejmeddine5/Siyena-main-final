const express = require('express');
const aiController = require('../controllers/aiController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all AI routes
router.use(protect);

// Restrict to employee or admin
router.use(restrictTo('employee', 'admin'));

router.post('/chat', aiController.sendMessage);
router.post('/conversations/:id/request-ticket', aiController.requestTechnicianTicket);
router.get('/conversations', aiController.getConversations);
router.get('/conversations/:id/messages', aiController.getConversationMessages);

module.exports = router;
