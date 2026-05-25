const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({

  printerModel: { type: String, required: true },
  issue: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  status: { type: String, enum: ['new', 'in_progress', 'assigned', 'resolved'], default: 'new' },
  confidence: { type: Number, required: true },
  conversation: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema);
