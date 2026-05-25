const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

exports.login = asyncHandler(async (req, res, next) => {
  const { identifier, password } = req.body;
  const { token, technician } = await authService.login(identifier, password);

  res.status(200).json({
    status: 'success',
    token,
    data: {
      technician,
    },
  });
});

exports.signup = asyncHandler(async (req, res, next) => {
  const { technician } = await authService.signup(req.body);

  res.status(201).json({
    status: 'pending',
    message: 'Votre compte a été créé avec succès. Il est en attente d\'approbation par l\'administrateur. Vous recevrez un email de confirmation une fois votre compte approuvé.',
    data: {
      technician,
    },
  });
});
