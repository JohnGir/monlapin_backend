const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../utils/token');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès refusé. Token manquant.'
      });
    }

    // Vérifier si le token existe dans la base de données
    const user = await User.findOne({ 
      'tokens.token': token 
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré.'
      });
    }

    // Vérifier la signature JWT
    const decoded = verifyToken(token);
    
    if (decoded.id !== user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Token corrompu.'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token invalide.'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} non autorisé à accéder à cette ressource`
      });
    }
    next();
  };
};

module.exports = { auth, authorize };