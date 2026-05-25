const jwt = require('jsonwebtoken');
const Technician = require('../models/Technician');
const Notification = require('../models/Notification');
const AppError = require('../utils/appError');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const signup = async (data) => {
  const { nom, email, password } = data;

  const existingTech = await Technician.findOne({ email });
  if (existingTech) {
    throw new AppError('Cet email est déjà utilisé.', 400);
  }

  const technician = await Technician.create({
    nom,
    email,
    password,
    isApproved: false, // Account pending admin approval
  });

  // Create real notification for admin with reference to the user
  await Notification.create({
    type: 'user_joined',
    message: `Le technicien ${nom} (${email}) vient de s'inscrire sur la plateforme.`,
    relatedUserId: technician._id,
  });

  // Don't return a token — account is pending approval
  technician.password = undefined;

  return { technician };
};

const login = async (identifier, password) => {
  if (!identifier || !password) {
    throw new AppError('Veuillez fournir un identifiant et un mot de passe.', 400);
  }

  // Check for Admin from .env
  if (identifier === process.env.adminemail && password === process.env.adminpass) {
    const admin = {
      _id: 'admin_root_id',
      nom: 'Administrateur',
      email: process.env.adminemail,
      role: 'admin'
    };
    const token = signToken(admin._id);
    return { token, technician: admin };
  }

  // Find user by email OR name
  const technician = await Technician.findOne({
    $or: [{ email: identifier }, { nom: identifier }]
  }).select('+password');

  if (!technician || !(await technician.comparePassword(password, technician.password))) {
    throw new AppError('Identifiant ou mot de passe incorrect', 401);
  }

  // Check if account is approved
  if (!technician.isApproved) {
    throw new AppError('Votre compte est en attente d\'approbation par l\'administrateur. Veuillez patienter.', 403);
  }

  const token = signToken(technician._id);

  // Remove password from output
  technician.password = undefined;

  return { token, technician };
};

module.exports = { login, signup };
