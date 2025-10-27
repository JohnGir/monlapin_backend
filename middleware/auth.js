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

// Middleware d'autorisation basique
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

// Middleware pour vérifier la propriété d'un lapin
const checkLapinOwnership = async (req, res, next) => {
  try {
    const Lapin = require('../models/Lapin');
    const Eleveur = require('../models/Eleveur');
    
    const lapin = await Lapin.findById(req.params.id);
    
    if (!lapin) {
      return res.status(404).json({
        success: false,
        message: 'Lapin non trouvé'
      });
    }

    // Les admins et gestionnaires peuvent tout faire
    if (req.user.role === 'admin' || req.user.role === 'gestionnaire') {
      return next();
    }

    // Les éleveurs ne peuvent modifier que leurs propres lapins
    if (req.user.role === 'eleveur') {
      const eleveur = await Eleveur.findOne({ userId: req.user.id });
      if (eleveur && lapin.eleveurId.toString() === eleveur._id.toString()) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Vous n\'êtes pas autorisé à modifier ce lapin'
    });

  } catch (error) {
    console.error('Erreur checkLapinOwnership:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ⚠️ TOUT EST BIEN EXPORTÉ
module.exports = { 
  auth, 
  authorize, 
  checkLapinOwnership  // ⚠️ LIGNE D'APPARTENANCE PRÉSENTE
};