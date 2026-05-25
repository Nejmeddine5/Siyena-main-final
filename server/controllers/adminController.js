const Technician = require('../models/Technician');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const { sendApprovalEmail } = require('../services/emailService');

// Get all users
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await Technician.find().sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

// Update user role
exports.updateUserRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body;
  
  if (!['technician', 'employee', 'admin'].includes(role)) {
    return next(new AppError('Rôle invalide.', 400));
  }

  const user = await Technician.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) {
    return next(new AppError('Utilisateur non trouvé.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Delete user
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await Technician.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError('Utilisateur non trouvé.', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Approve user account
exports.approveUser = asyncHandler(async (req, res, next) => {
  const user = await Technician.findByIdAndUpdate(
    req.params.id,
    { isApproved: true },
    { new: true, runValidators: true }
  );

  if (!user) {
    return next(new AppError('Utilisateur non trouvé.', 404));
  }

  // Mark related notification as read
  await Notification.updateMany(
    { relatedUserId: req.params.id, type: 'user_joined' },
    { read: true }
  );

  // Send approval email to the user
  await sendApprovalEmail(user.email, user.nom);

  res.status(200).json({
    status: 'success',
    message: `Le compte de ${user.nom} a été approuvé.`,
    data: {
      user
    }
  });
});

// Reject user account (delete the user)
exports.rejectUser = asyncHandler(async (req, res, next) => {
  const user = await Technician.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError('Utilisateur non trouvé.', 404));
  }

  // Delete related notifications
  await Notification.deleteMany(
    { relatedUserId: req.params.id, type: 'user_joined' }
  );

  res.status(200).json({
    status: 'success',
    message: `Le compte de ${user.nom} a été rejeté et supprimé.`,
  });
});

