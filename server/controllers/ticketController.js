const asyncHandler = require('../utils/asyncHandler');
const Ticket = require('../models/Ticket');
const Alert = require('../models/Alert');
const AppError = require('../utils/appError');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');



exports.createTicket = asyncHandler(async (req, res, next) => {
  const { alertId, notes } = req.body;

  const alert = await Alert.findById(alertId);
  if (!alert) return next(new AppError('Alert not found', 404));

  // Verify if ticket already exists for this alert
  const existingTicket = await Ticket.findOne({ alertId });
  if (existingTicket) return next(new AppError('A ticket already exists for this alert.', 400));

  const performedBy = mongoose.Types.ObjectId.isValid(req.technician?._id)
    ? req.technician._id
    : null;

  const ticket = await Ticket.create({
    ticketId: `TICK-${uuidv4().substring(0, 6).toUpperCase()}`,
    alertId: alert._id,
    printerModel: alert.printerModel,
    issue: alert.issue,
    priority: alert.severity,
    assignedTechnician: performedBy,
    notes: notes ? [{ text: notes, addedBy: performedBy }] : [],
    status: 'pending', // Starts in 'À faire' / pending
    history: [{ action: 'Created from Alert', performedBy: performedBy }]
  });


  // Update Alert Status
  alert.status = 'assigned';
  await alert.save();

  // Emitting the event
  const io = req.app.get('socketio');
  if (io) {
    io.emit('newTicket', ticket);
    io.emit('alertUpdated', alert);
  }

  res.status(201).json({ status: 'success', data: ticket });
});

exports.getAllTickets = asyncHandler(async (req, res, next) => {
  let filter = {};

  // If the user is a technician, only show tickets assigned to them
  if (req.technician.role === 'technician') {
    filter.assignedTechnician = req.technician._id;
  }

  const tickets = await Ticket.find(filter).populate('assignedTechnician', 'nom');
  res.status(200).json({ status: 'success', results: tickets.length, data: tickets });
});

exports.updateTicketStatus = asyncHandler(async (req, res, next) => {
  const { status, resolutionReport } = req.body;
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) return next(new AppError('Ticket not found', 404));

  const performedBy = mongoose.Types.ObjectId.isValid(req.technician?._id)
    ? req.technician._id
    : null;

  ticket.status = status;
  if (resolutionReport) {
    ticket.resolutionReport = {
      ...resolutionReport,
      date: new Date()
    };
  }

  ticket.history.push({
    action: `Status changed to ${status}`,
    performedBy: performedBy
  });


  await ticket.save();

  const io = req.app.get('socketio');
  if (io) io.emit('ticketUpdated', ticket);

  res.status(200).json({ status: 'success', data: ticket });
});

exports.createManualTicket = asyncHandler(async (req, res, next) => {
  const { title, priority, printerModel } = req.body;

  // Safe check for ObjectId validation
  const performedBy = mongoose.Types.ObjectId.isValid(req.technician?._id)
    ? req.technician._id
    : null;

  const ticket = await Ticket.create({
    ticketId: `TICK-${uuidv4().substring(0, 6).toUpperCase()}`,
    printerModel: printerModel || 'Intervention Manuelle',
    issue: title,
    priority: priority || 'medium',
    status: 'pending',
    history: [{
      action: 'Created Manually by Admin',
      performedBy: performedBy
    }]
  });


  const io = req.app.get('socketio');
  if (io) io.emit('newTicket', ticket);

  res.status(201).json({ status: 'success', data: ticket });
});

exports.assignTicket = asyncHandler(async (req, res, next) => {
  const { technicianId } = req.body;
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) return next(new AppError('Ticket not found', 404));

  const performedBy = mongoose.Types.ObjectId.isValid(req.technician?._id)
    ? req.technician._id
    : null;

  ticket.assignedTechnician = technicianId;
  ticket.status = 'assigned';
  ticket.history.push({
    action: `Ticket assigned to technician`,
    performedBy: performedBy
  });

  await ticket.save();

  const updatedTicket = await Ticket.findById(ticket._id).populate('assignedTechnician', 'nom');

  await Notification.create({
    technicienId: technicianId,
    message: `Un nouveau ticket vous a été assigné : ${ticket.issue || ticket.ticketId}`,
    type: 'system' // Matching enum in Notification model
  });

  const io = req.app.get('socketio');
  if (io) {
    io.emit('ticketUpdated', updatedTicket);
    io.emit('newNotification', { recipient: technicianId });
  }

  res.status(200).json({ status: 'success', data: updatedTicket });
});

exports.deleteTicket = asyncHandler(async (req, res, next) => {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) return next(new AppError('Ticket not found', 404));

  if (ticket.alertId) {
    const alert = await Alert.findById(ticket.alertId);
    if (alert) {
      alert.status = 'new';
      await alert.save();
      const io = req.app.get('socketio');
      if (io) io.emit('alertUpdated', alert);
    }
  }

  await Notification.deleteMany({
    message: { $regex: ticket.ticketId, $options: 'i' }
  });

  await Ticket.findByIdAndDelete(req.params.id);

  const io = req.app.get('socketio');
  if (io) io.emit('ticketDeleted', { _id: req.params.id });

  res.status(204).json({
    status: 'success',
    data: null
  });
});
