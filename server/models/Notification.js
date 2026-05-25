const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    technicienId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Technician',
      required: false, // Optional for admin/system notifications
    },
    relatedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Technician',
      required: false, // The user this notification is about
    },
    type: {
      type: String,
      enum: ['user_joined', 'system', 'job_offer', 'other'],
      default: 'other',
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
