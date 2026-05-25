const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert' },

  printerModel: { type: String, required: true },
  issue: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
  interventionDate: { type: Date },
  status: { type: String, enum: ['pending', 'assigned', 'in_progress', 'resolved', 'cancelled'], default: 'pending' },
  notes: [{
    text: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
    createdAt: { type: Date, default: Date.now }
  }],
  photos: [String],
  history: [{
    action: String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
    date: { type: Date, default: Date.now }
  }],
  resolutionReport: {
    problemDescription: String,
    actionTaken: String,
    date: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
