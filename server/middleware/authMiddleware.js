const jwt = require('jsonwebtoken');
const Technician = require('../models/Technician');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  // 1) Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  let currentUser;

  // Check if it's the root admin
  if (decoded.id === 'admin_root_id') {
    currentUser = {
      _id: 'admin_root_id',
      nom: 'Administrateur',
      email: process.env.adminemail,
      role: 'admin'
    };
  } else {
    // 2) Check if technician still exists
    currentUser = await Technician.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('Utilisateur inexistant.', 401));
    }
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.technician = currentUser;
  next();
});

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.technician.role)) {
      return next(new AppError('Vous n\'avez pas la permission d\'effectuer cette action.', 403));
    }
    next();
  };
};

module.exports = { protect, restrictTo };
