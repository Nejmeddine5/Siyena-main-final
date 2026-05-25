const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(ticketController.getAllTickets)
  .post(ticketController.createTicket);

router.post('/manual', ticketController.createManualTicket);
router.patch('/:id/assign', ticketController.assignTicket);

router.patch('/:id/status', ticketController.updateTicketStatus);
router.delete('/:id', ticketController.deleteTicket);



module.exports = router;
